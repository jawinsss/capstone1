import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all return requests with optional status filter
   */
  async list(status?: string) {
    const where = status ? { status: status as any } : {};
    
    const requests = await this.prisma.returnRequest.findMany({
      where,
      include: { 
        order: { 
          include: { 
            items: { 
              include: { 
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    images: true,
                  }
                } 
              } 
            },
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
              }
            }
          } 
        } 
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: requests,
      message: `Found ${requests.length} return requests`,
    };
  }

  /**
   * Get single return request by ID
   */
  async getById(id: string) {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: { 
        order: { 
          select: {
            id: true,
            code: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            items: { 
              include: { 
                product: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    images: true,
                  }
                } 
              } 
            },
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                fullAddress: true,
                street: true,
                wardName: true,
                district: true,
                provinceName: true,
              }
            }
          }
        } 
      },
    });

    if (!request) {
      throw new NotFoundException('Return request not found');
    }

    return {
      success: true,
      data: request,
    };
  }

  /**
   * Approve return request
   * - Update return request status to APPROVED
   * - Update order status to RETURNED
   * - Restore product stock
   */
  async approve(id: string, adminNote?: string) {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: { 
        order: { 
          include: { items: true } 
        } 
      },
    });

    if (!request) {
      throw new NotFoundException('Return request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Cannot approve return request with status ${request.status}`);
    }

    // Use transaction to ensure data consistency
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update return request
      const updatedRequest = await tx.returnRequest.update({
        where: { id },
        data: { 
          status: 'APPROVED',
        },
      });

      // 2. Update order status to RETURNED
      await tx.order.update({
        where: { id: request.orderId },
        data: { 
          status: OrderStatus.RETURNED,
        },
      });

      // 3. Optional: Restore product stock
      for (const item of request.order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      return updatedRequest;
    });

    return {
      success: true,
      data: result,
      message: 'Return request approved successfully. Order marked as returned and stock restored.',
    };
  }

  /**
   * Reject return request
   * - Update return request status to REJECTED
   * - Update order status back to COMPLETED
   */
  async reject(id: string, adminNote?: string) {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Return request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Cannot reject return request with status ${request.status}`);
    }

    // Use transaction to ensure data consistency
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update return request
      const updatedRequest = await tx.returnRequest.update({
        where: { id },
        data: { 
          status: 'REJECTED',
        },
      });

      // 2. Update order status back to COMPLETED
      await tx.order.update({
        where: { id: request.orderId },
        data: { 
          status: OrderStatus.COMPLETED,
        },
      });

      return updatedRequest;
    });

    return {
      success: true,
      data: result,
      message: 'Return request rejected. Order status restored to COMPLETED.',
    };
  }

  /**
   * Get statistics
   */
  async getStats() {
    const [pending, approved, rejected, total] = await Promise.all([
      this.prisma.returnRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.returnRequest.count({ where: { status: 'APPROVED' } }),
      this.prisma.returnRequest.count({ where: { status: 'REJECTED' } }),
      this.prisma.returnRequest.count(),
    ]);

    return {
      success: true,
      data: {
        pending,
        approved,
        rejected,
        total,
      },
    };
  }
}


