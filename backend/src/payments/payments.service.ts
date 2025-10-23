import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all payments with filters
   */
  async list(filters?: {
    method?: PaymentMethod;
    status?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }) {
    const where: any = {};

    // Filter by payment method
    if (filters?.method) {
      where.method = filters.method;
    }

    // Filter by payment status
    if (filters?.status) {
      where.status = filters.status;
    }

    // Filter by date range
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    // Search by order code or transaction ID
    if (filters?.search) {
      where.OR = [
        {
          order: {
            code: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
        {
          transactionId: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: payments,
      message: `Found ${payments.length} payments`,
    };
  }

  /**
   * Get payment statistics
   */
  async getStats(filters?: { startDate?: Date; endDate?: Date }) {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    // Total revenue (confirmed payments)
    const totalRevenue = await this.prisma.payment.aggregate({
      where: {
        ...where,
        status: PaymentStatus.CONFIRMED,
      },
      _sum: {
        amount: true,
      },
    });

    // Pending COD payments
    const pendingCOD = await this.prisma.payment.count({
      where: {
        ...where,
        method: PaymentMethod.COD,
        status: PaymentStatus.PENDING,
      },
    });

    // Confirmed payments count
    const confirmedCount = await this.prisma.payment.count({
      where: {
        ...where,
        status: PaymentStatus.CONFIRMED,
      },
    });

    // Failed payments count
    const failedCount = await this.prisma.payment.count({
      where: {
        ...where,
        status: PaymentStatus.FAILED,
      },
    });

    // Revenue breakdown by method
    const revenueByMethod = await this.prisma.payment.groupBy({
      by: ['method'],
      where: {
        ...where,
        status: PaymentStatus.CONFIRMED,
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Daily revenue (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRevenue = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.CONFIRMED,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        amount: true,
        createdAt: true,
        method: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const revenueByDay: any = {};
    dailyRevenue.forEach((payment) => {
      const date = payment.createdAt.toISOString().split('T')[0];
      if (!revenueByDay[date]) {
        revenueByDay[date] = { COD: 0, MOMO: 0, ZALOPAY: 0, total: 0 };
      }
      revenueByDay[date][payment.method] += payment.amount;
      revenueByDay[date].total += payment.amount;
    });

    return {
      success: true,
      data: {
        totalRevenue: totalRevenue._sum.amount || 0,
        pendingCOD,
        confirmedCount,
        failedCount,
        revenueByMethod: revenueByMethod.map((item) => ({
          method: item.method,
          revenue: item._sum.amount || 0,
          count: item._count,
        })),
        dailyRevenue: Object.entries(revenueByDay).map(([date, data]: [string, any]) => ({
          date,
          ...(data as any),
        })),
      },
    };
  }

  /**
   * Get payment by ID
   */
  async getById(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                street: true,
                ward: true,
                district: true,
                province: true,
                provinceName: true,
                fullAddress: true,
              },
            },
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                    price: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return {
      success: true,
      data: payment,
    };
  }

  /**
   * Confirm COD payment (manual by admin)
   */
  async confirmCODPayment(id: string, adminId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    if (payment.method !== PaymentMethod.COD) {
      throw new BadRequestException(
        'Only COD payments can be manually confirmed',
      );
    }

    if (payment.status === PaymentStatus.CONFIRMED) {
      throw new BadRequestException('Payment is already confirmed');
    }

    // Update payment status to CONFIRMED
    const updatedPayment = await this.prisma.$transaction(async (tx) => {
      // Update payment
      const confirmedPayment = await tx.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.CONFIRMED,
          metadata: JSON.stringify({
            confirmedBy: adminId,
            confirmedAt: new Date().toISOString(),
            note: 'COD payment confirmed by admin',
          }),
        },
      });

      // Update order
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
        isPaid: true,
          paidAmount: payment.amount,
        },
      });

      return confirmedPayment;
    });

    return {
      success: true,
      data: updatedPayment,
      message: 'COD payment confirmed successfully',
    };
  }

  /**
   * Get pending COD payments (need admin confirmation)
   */
  async getPendingCODPayments() {
    const payments = await this.prisma.payment.findMany({
      where: {
        method: PaymentMethod.COD,
        status: PaymentStatus.PENDING,
        order: {
          status: 'COMPLETED', // Only show payments for completed orders
        },
      },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      data: payments,
      message: `Found ${payments.length} pending COD payments`,
    };
  }
}
