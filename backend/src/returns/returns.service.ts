import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  listPending() {
    return this.prisma.returnRequest.findMany({
      where: { status: 'PENDING' },
      include: { order: { include: { items: { include: { product: true } }, user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAll() {
    return this.prisma.returnRequest.findMany({
      include: { order: { include: { items: { include: { product: true } }, user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: 'APPROVED'|'REJECTED') {
    const exists = await this.prisma.returnRequest.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('Return request not found');
    return this.prisma.returnRequest.update({ where: { id }, data: { status } });
  }
}


