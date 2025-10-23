import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

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
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            phone: true,
            province: true,
            provinceName: true,
            district: true,
            ward: true,
            wardName: true,
            street: true,
            fullAddress: true
          }
        }
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
    
    // Convert payment method string to enum
    const paymentMethodStr = payload?.payment?.method || 'COD';
    let paymentMethod: PaymentMethod = PaymentMethod.COD;
    
    if (paymentMethodStr === 'Ví MoMo' || paymentMethodStr === 'MOMO') {
      paymentMethod = PaymentMethod.MOMO;
    } else if (paymentMethodStr === 'Ví ZaloPay' || paymentMethodStr === 'ZALOPAY') {
      paymentMethod = PaymentMethod.ZALOPAY;
    }
    
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
          status: 'PENDING', // Always start with PENDING, will be updated to CONFIRMED by payment callback
          totalAmount,
          paymentMethod, // Store payment method
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

      // Create initial payment record for ALL orders (including COD)
      // - COD: status = PENDING (will be confirmed by admin after delivery)
      // - MoMo/ZaloPay: status = PENDING (will be confirmed by payment gateway callback)
      await tx.payment.create({ 
        data: { 
          orderId: createdOrder.id, 
          amount: Math.trunc(totalAmount), 
          status: 'PENDING',
          method: paymentMethod,
          metadata: JSON.stringify({
            createdFrom: 'order-checkout',
            paymentMethod: paymentMethod,
            initialAmount: totalAmount,
          }),
        } 
      });

      return createdOrder;
    });

    return order;
  }

  // User cancels their order
  async cancelOrder(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, code: true, paymentMethod: true }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user owns this order
    if (order.userId !== userId) {
      throw new BadRequestException('You can only cancel your own orders');
    }

    // Only allow cancellation for PENDING or CONFIRMED orders
    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      throw new BadRequestException('Cannot cancel order in current status');
    }

    // Update order and payment in transaction
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // 1. Update order status to CANCELLED
      const cancelledOrder = await tx.order.update({
        where: { id },
        data: { status: 'CANCELLED', isPaid: false },
        include: { items: { include: { product: true } } }
      });

      // 2. Update payment status to FAILED (if exists)
      const payment = await tx.payment.findFirst({
        where: { orderId: id }
      });

      if (payment && payment.status === PaymentStatus.PENDING) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            metadata: JSON.stringify({
              canceledAt: new Date().toISOString(),
              cancelReason: 'Order canceled by user',
              canceledBy: userId,
              originalStatus: payment.status,
            }),
          },
        });
      }

      return cancelledOrder;
    });

    return {
      success: true,
      data: updatedOrder,
      message: 'Order cancelled successfully'
    };
  }

  // User marks order as received
  async markReceived(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, code: true }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user owns this order
    if (order.userId !== userId) {
      throw new BadRequestException('You can only update your own orders');
    }

    // Only allow marking as received for SHIPPING orders
    if (order.status !== 'SHIPPING') {
      throw new BadRequestException('Can only mark received for orders that are shipping');
    }

    // Update status to COMPLETED
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: { items: { include: { product: true } } }
    });

    return {
      success: true,
      data: updatedOrder,
      message: 'Order marked as received successfully'
    };
  }

  // User requests return/refund
  async requestReturn(id: string, userId: string, payload: any) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, code: true, totalAmount: true }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if user owns this order
    if (order.userId !== userId) {
      throw new BadRequestException('You can only request returns for your own orders');
    }

    // Only allow return requests for COMPLETED orders
    if (order.status !== 'COMPLETED') {
      throw new BadRequestException('Can only request return for completed orders');
    }

    // Create return request
    const returnRequest = await this.prisma.returnRequest.create({
      data: {
        orderId: id,
        reason: payload.reason || 'No reason provided',
        status: 'PENDING',
        refundAmount: order.totalAmount
      }
    });

    return {
      success: true,
      data: returnRequest,
      message: 'Return request submitted successfully'
    };
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

    // Use transaction to delete order, payments, and items
    await this.prisma.$transaction(async (tx) => {
      // 1. Delete payments first (foreign key constraint)
      await tx.payment.deleteMany({
        where: { orderId: id }
      });

      // 2. Delete order items
      await tx.orderItem.deleteMany({
        where: { orderId: id }
      });

      // 3. Delete order
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


