import { Injectable, NotFoundException } from '@nestjs/common';
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
      include: { items: { include: { product: true } }, user: true },
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
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, price: true } });
    const priceMap = new Map(products.map((p) => [p.id, p.price] as const));
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

    const order = await this.prisma.order.create({
      data: {
        code,
        userId: user.id,
        status: 'PENDING',
        totalAmount,
        items: { create: items },
      },
      include: { items: true },
    });

    // If prepayment in payload, create a pending payment
    if (payload?.payment?.amount > 0) {
      await this.prisma.payment.create({ data: { orderId: order.id, amount: Math.trunc(payload.payment.amount), status: 'PENDING' } });
    }

    return order;
  }
}


