import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  listPending() {
    return this.prisma.payment.findMany({
      where: { status: 'PENDING' },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async confirm(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    const updated = await this.prisma.payment.update({ where: { id }, data: { status: 'CONFIRMED' } });
    // Update order paidAmount/isPaid
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
        paidAmount: { increment: payment.amount },
        isPaid: true,
      },
    });
    return updated;
  }
}


