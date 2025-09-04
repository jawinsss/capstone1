import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.review.findMany({
      include: { 
        user: { select: { id: true, username: true, fullName: true } },
        product: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listByProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId, status: 'PUBLISHED' },
      include: { user: { select: { id: true, username: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, payload: { productId: string; rating: number; content: string }) {
    return this.prisma.review.create({
      data: {
        productId: payload.productId,
        userId,
        rating: Math.max(1, Math.min(5, Math.trunc(payload.rating || 5))),
        content: payload.content,
        status: 'PUBLISHED',
      },
    });
  }

  async updateStatus(id: string, status: 'PUBLISHED' | 'HIDDEN') {
    const exists = await this.prisma.review.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Review not found');
    return this.prisma.review.update({ where: { id }, data: { status } });
  }
}


