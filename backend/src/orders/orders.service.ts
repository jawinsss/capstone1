import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.order.findMany({
      include: { items: { include: { product: true } }, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: 'PENDING'|'CONFIRMED'|'SHIPPING'|'COMPLETED'|'CANCELLED') {
    const exists = await this.prisma.order.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Order not found');
    return this.prisma.order.update({ where: { id }, data: { status } });
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


