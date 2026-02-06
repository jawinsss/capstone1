import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderAutomationService {
  private readonly logger = new Logger(OrderAutomationService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Auto-approve orders every 30 seconds
   * PENDING (> 1 min) → CONFIRMED
   * CONFIRMED (> 1 min) → SHIPPING
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async autoApproveOrders() {
    try {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000); // 1 minute ago

      // 1. Auto-approve PENDING orders (> 1 minute old)
      const pendingOrders = await this.prisma.order.findMany({
        where: {
          status: 'PENDING',
          createdAt: {
            lte: oneMinuteAgo,
          },
        },
        select: {
          id: true,
          code: true,
          createdAt: true,
        },
      });

      if (pendingOrders.length > 0) {
        const updatedPending = await this.prisma.order.updateMany({
          where: {
            id: {
              in: pendingOrders.map((o) => o.id),
            },
          },
          data: {
            status: 'CONFIRMED',
          },
        });

        this.logger.log(
          `Auto-confirmed ${updatedPending.count} PENDING orders: ${pendingOrders.map((o) => o.code).join(', ')}`,
        );
      }

      // 2. Auto-ship CONFIRMED orders (> 1 minute old in CONFIRMED status)
      const confirmedOrders = await this.prisma.order.findMany({
        where: {
          status: 'CONFIRMED',
          updatedAt: {
            lte: oneMinuteAgo,
          },
        },
        select: {
          id: true,
          code: true,
          updatedAt: true,
        },
      });

      if (confirmedOrders.length > 0) {
        const updatedConfirmed = await this.prisma.order.updateMany({
          where: {
            id: {
              in: confirmedOrders.map((o) => o.id),
            },
          },
          data: {
            status: 'SHIPPING',
          },
        });

        this.logger.log(
          `Auto-shipped ${updatedConfirmed.count} CONFIRMED orders: ${confirmedOrders.map((o) => o.code).join(', ')}`,
        );
      }

      // Log summary
      if (pendingOrders.length === 0 && confirmedOrders.length === 0) {
        this.logger.debug('No orders to auto-process');
      }
    } catch (error) {
      this.logger.error('Error in auto-approve orders:', error.message);
    }
  }

  /**
   * Manual method to process specific order
   * Can be called via API if needed
   */
  async processOrder(orderId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          code: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      let newStatus: string | null = null;

      if (order.status === 'PENDING') {
        newStatus = 'CONFIRMED';
      } else if (order.status === 'CONFIRMED') {
        newStatus = 'SHIPPING';
      }

      if (newStatus) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { status: newStatus as any },
        });

        this.logger.log(`Manually processed order ${order.code}: ${order.status} → ${newStatus}`);
        return {
          success: true,
          message: `Order ${order.code} updated to ${newStatus}`,
          data: { oldStatus: order.status, newStatus },
        };
      }

      return {
        success: false,
        message: `Order ${order.code} is in ${order.status} status, cannot auto-process`,
      };
    } catch (error) {
      this.logger.error('Error processing order:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get automation statistics
   */
  async getAutomationStats() {
    try {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

      const [pendingCount, confirmedCount] = await Promise.all([
        this.prisma.order.count({
          where: {
            status: 'PENDING',
            createdAt: { lte: oneMinuteAgo },
          },
        }),
        this.prisma.order.count({
          where: {
            status: 'CONFIRMED',
            updatedAt: { lte: oneMinuteAgo },
          },
        }),
      ]);

      return {
        success: true,
        data: {
          pendingToConfirm: pendingCount,
          confirmedToShipping: confirmedCount,
          nextRunIn: '30 seconds',
          enabled: true,
        },
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

