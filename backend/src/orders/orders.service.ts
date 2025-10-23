import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  list() {
    return this.prisma.order.findMany({
      include: { 
        items: { 
          include: { 
            product: {
              include: {
                images: true
              }
            } 
          } 
        }, 
        user: true 
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: 'PENDING'|'CONFIRMED'|'SHIPPING'|'COMPLETED'|'CANCELLED', userId?: string) {
    const order = await this.prisma.order.findUnique({ 
      where: { id }, 
      select: { id: true, status: true, userId: true } 
    });
    if (!order) throw new NotFoundException('Order not found');
    
    const updatedOrder = await this.prisma.order.update({ 
      where: { id }, 
      data: { status },
      include: { user: true }
    });

    // Create audit log for order status update if userId is provided
    if (userId) {
      try {
        await this.auditService.createAuditLog({
          userId: userId,
          action: 'UPDATE',
          resource: 'ORDER',
          resourceId: order.id,
          details: {
            orderId: order.id,
            oldStatus: order.status,
            newStatus: status,
            updatedBy: userId,
            orderOwner: order.userId
          },
          ipAddress: null, // Will be set by controller if available
          userAgent: null, // Will be set by controller if available
        });
      } catch (error) {
        console.error('Failed to create audit log for order status update:', error);
      }
    }

    return updatedOrder;
  }

  async getUserOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { 
        items: { 
          include: { 
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true
              }
            } 
          } 
        } 
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: orders,
      message: 'Danh sách đơn hàng của người dùng'
    };
  }

  async create(payload: any) {
    // payload: { customer: { fullName, email, phone, address }, items: [{ productId, quantity }], payment: { method } }
    const code = `ORD-${Date.now()}`;
    const productIds = (payload.items || []).map((i) => i.productId);
    
    // Load products with stock information
    const products = await this.prisma.product.findMany({ 
      where: { id: { in: productIds } }, 
      select: { id: true, price: true, stock: true, name: true } 
    });
    
    // Create maps for easy lookup
    const priceMap = new Map(products.map((p) => [p.id, p.price] as const));
    const stockMap = new Map(products.map((p) => [p.id, p.stock] as const));
    const nameMap = new Map(products.map((p) => [p.id, p.name] as const));
    
    // Validate stock availability for each item STRICTLY
    const insufficientStockItems = [];
    for (const item of (payload.items || [])) {
      const requestedQty = Math.max(1, Number(item.quantity) || 1);
      const availableStock = stockMap.get(item.productId);
      const productName = nameMap.get(item.productId) || 'Unknown product';
      
      // CRITICAL: Stock must not be null/undefined and must be >= requested
      if (availableStock === undefined || availableStock === null) {
        throw new BadRequestException(`Sản phẩm ${productName} không tồn tại trong hệ thống`);
      }
      
      if (availableStock < requestedQty) {
        insufficientStockItems.push({
          productId: item.productId,
          productName: productName,
          requested: requestedQty,
          available: availableStock
        });
      }
    }
    
    // If any items have insufficient stock, throw error with details
    if (insufficientStockItems.length > 0) {
      const errorMessage = insufficientStockItems.map(item => 
        `${item.productName}: Yêu cầu ${item.requested}, chỉ còn ${item.available} trong kho`
      ).join('; ');
      
      throw new BadRequestException({
        message: 'Số lượng sản phẩm vượt quá tồn kho',
        details: insufficientStockItems,
        errorMessage: errorMessage
      });
    }
    
    const items = (payload.items || []).map((i) => ({
      productId: i.productId,
      quantity: Math.max(1, Number(i.quantity) || 1),
      price: priceMap.get(i.productId) || 0,
    }));
    const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);

    // Ensure a user exists (guest account by email or random)
    const email = payload?.customer?.email || `guest-${Date.now()}@example.com`;
    const user = await this.prisma.user.upsert({
      where: { email },
      update: { fullName: payload?.customer?.fullName ?? 'Khách hàng', phone: payload?.customer?.phone },
      create: {
        email,
        username: email,
        password: email, // placeholder; not used for login
        fullName: payload?.customer?.fullName ?? 'Khách hàng',
        phone: payload?.customer?.phone,
        role: 'USER',
      },
    });

    // Use transaction to ensure atomicity: create order + decrease stock
    const order = await this.prisma.$transaction(async (tx) => {
      // Create the order
      const createdOrder = await tx.order.create({
        data: {
          code,
          userId: user.id,
          status: 'PENDING',
          totalAmount,
          items: { create: items },
        },
        include: { items: true },
      });

      // Decrease stock for each product
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      // If prepayment in payload, create a pending payment
      if (payload?.payment?.amount > 0) {
        await tx.payment.create({ 
          data: { 
            orderId: createdOrder.id, 
            amount: Math.trunc(payload.payment.amount), 
            status: 'PENDING' 
          } 
        });
      }

      return createdOrder;
    });

    return order;
  }

  async delete(id: string, userId?: string) {
    // Check if order exists
    const order = await this.prisma.order.findUnique({ 
      where: { id },
      include: { items: true, user: true }
    });
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Use transaction to delete order and its items
    await this.prisma.$transaction(async (tx) => {
      // Delete order items first (foreign key constraint)
      await tx.orderItem.deleteMany({
        where: { orderId: id }
      });

      // Delete order
      await tx.order.delete({
        where: { id }
      });
    });

    // Create audit log for order deletion if userId is provided
    if (userId) {
      try {
        await this.auditService.createAuditLog({
          userId: userId,
          action: 'DELETE',
          resource: 'ORDER',
          resourceId: order.id,
          details: {
            orderId: order.id,
            orderCode: order.code,
            totalAmount: order.totalAmount,
            status: order.status,
            itemsCount: order.items.length,
            deletedBy: userId,
            orderOwner: order.userId,
            customerName: order.user?.fullName || order.user?.username || 'Unknown'
          },
          ipAddress: null,
          userAgent: null,
        });
      } catch (error) {
        console.error('Failed to create audit log for order deletion:', error);
        // Continue even if audit log fails
      }
    }

    return { 
      success: true, 
      message: 'Order deleted successfully',
      deletedOrderId: id,
      deletedOrderCode: order.code
    };
  }
}


