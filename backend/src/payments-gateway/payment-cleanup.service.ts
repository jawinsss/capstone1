import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, PaymentMethod, OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentCleanupService {
  private readonly logger = new Logger(PaymentCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Auto-cancel pending online payments after 5 minutes
   * Auto-confirm pending COD payments after 3 minutes (when order completed)
   * Runs every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async autoCancelExpiredPayments() {
    this.logger.log('🔄 Running payment cleanup job...');
    
    // Auto-confirm COD payments first
    await this.autoConfirmCODPayments();

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
    
    this.logger.log(`⏰ Current time: ${now.toISOString()}`);
    this.logger.log(`⏰ Looking for payments before: ${fiveMinutesAgo.toISOString()}`);

    try {
      // Find pending online payments older than 5 minutes
      const expiredPayments = await this.prisma.payment.findMany({
        where: {
          status: PaymentStatus.PENDING,
          method: {
            in: [PaymentMethod.MOMO, PaymentMethod.ZALOPAY],
          },
          createdAt: {
            lte: fiveMinutesAgo,
          },
        },
        include: {
          order: {
            include: {
              items: true,
            },
          },
        },
      });

      this.logger.log(`🔍 Total PENDING online payments in database: ${
        await this.prisma.payment.count({
          where: {
            status: PaymentStatus.PENDING,
            method: { in: [PaymentMethod.MOMO, PaymentMethod.ZALOPAY] }
          }
        })
      }`);

      if (expiredPayments.length === 0) {
        this.logger.log('✅ No expired payments found (all are within 5 minutes)');
        return;
      }

      this.logger.log(
        `🔍 Found ${expiredPayments.length} expired payments to cancel:`,
      );
      
      expiredPayments.forEach(p => {
        const age = Math.floor((now.getTime() - p.createdAt.getTime()) / 60000);
        this.logger.log(`  - Payment ${p.id} (Order: ${p.order?.code}) - Age: ${age} minutes`);
      });

      // Cancel each expired payment
      for (const payment of expiredPayments) {
        await this.cancelExpiredPayment(payment);
      }

      this.logger.log(
        `✅ Successfully auto-canceled ${expiredPayments.length} expired online payments`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error in payment cleanup job: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Cancel a single expired payment and its order
   */
  private async cancelExpiredPayment(payment: any) {
    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Update payment status to FAILED
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            metadata: JSON.stringify({
              canceledAt: new Date().toISOString(),
              cancelReason: 'Payment expired after 5 minutes (user did not complete payment)',
              autoCanceled: true,
              originalCreatedAt: payment.createdAt,
            }),
          },
        });

        // 2. Update order status to CANCELLED (if not yet COMPLETED or RETURNED)
        // Cancel orders in PENDING, CONFIRMED, or SHIPPING status
        const cancelableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPING];
        
        if (cancelableStatuses.includes(payment.order.status)) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: {
              status: OrderStatus.CANCELLED,
              isPaid: false,
            },
          });

          // 3. Restore stock
          for (const item of payment.order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
            this.logger.log(
              `↩️ Restored ${item.quantity} units of product ${item.productId}`,
            );
          }

          this.logger.log(
            `✅ Auto-canceled order ${payment.order.code} (status: ${payment.order.status} → CANCELLED) - payment expired after 5 minutes`,
          );
        } else {
          // Order already completed/returned - only mark payment as failed
          this.logger.warn(
            `⚠️ Payment ${payment.id} expired but order ${payment.order.code} already ${payment.order.status} - cannot cancel`,
          );
        }
      });
    } catch (error) {
      this.logger.error(
        `❌ Failed to cancel payment ${payment.id}: ${error.message}`,
      );
    }
  }

  /**
   * Auto-confirm COD payments after 3 minutes when order is COMPLETED
   */
  private async autoConfirmCODPayments() {
    const now = new Date();
    const threeMinutesAgo = new Date(now.getTime() - 3 * 60 * 1000); // 3 minutes ago

    try {
      // Find PENDING COD payments where order is COMPLETED and receivedAt > 3 minutes ago
      const pendingCODPayments = await this.prisma.payment.findMany({
        where: {
          status: PaymentStatus.PENDING,
          method: PaymentMethod.COD,
          order: {
            status: OrderStatus.COMPLETED,
            receivedAt: {
              lte: threeMinutesAgo,
              not: null,
            },
          },
        },
        include: {
          order: {
            select: {
              id: true,
              code: true,
              receivedAt: true,
            },
          },
        },
      });

      if (pendingCODPayments.length === 0) {
        this.logger.debug('✅ No COD payments ready for auto-confirmation');
        return;
      }

      this.logger.log(
        `💰 Found ${pendingCODPayments.length} COD payments ready for auto-confirmation:`,
      );

      pendingCODPayments.forEach((p) => {
        const age = Math.floor(
          (now.getTime() - p.order.receivedAt.getTime()) / 60000,
        );
        this.logger.log(
          `  - Payment ${p.id} (Order: ${p.order.code}) - Age since received: ${age} minutes`,
        );
      });

      // Confirm each COD payment
      for (const payment of pendingCODPayments) {
        await this.confirmCODPayment(payment);
      }

      this.logger.log(
        `✅ Successfully auto-confirmed ${pendingCODPayments.length} COD payments`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error in COD payment auto-confirmation: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Confirm a single COD payment
   */
  private async confirmCODPayment(payment: any) {
    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Update payment status to CONFIRMED
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.CONFIRMED,
            metadata: JSON.stringify({
              confirmedAt: new Date().toISOString(),
              confirmReason: 'Auto-confirmed 3 minutes after order received',
              autoConfirmed: true,
              orderReceivedAt: payment.order.receivedAt,
            }),
          },
        });

        // 2. Update order isPaid flag
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            isPaid: true,
            paidAmount: payment.amount,
          },
        });

        this.logger.log(
          `✅ Auto-confirmed COD payment for order ${payment.order.code} (payment: ${payment.id})`,
        );
      });
    } catch (error) {
      this.logger.error(
        `❌ Failed to confirm COD payment ${payment.id}: ${error.message}`,
      );
    }
  }

  /**
   * Manual trigger for testing (can be called via API endpoint)
   */
  async manualCleanup() {
    this.logger.log('🔧 Manual payment cleanup triggered');
    await this.autoCancelExpiredPayments();
    return {
      success: true,
      message: 'Payment cleanup completed',
    };
  }
}

