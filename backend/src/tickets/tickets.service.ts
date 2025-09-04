import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  list(type?: string) {
    const where = type === 'message' ? { subject: { contains: 'message' } } : {};
    return this.prisma.ticket.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  listOpen() {
    return this.prisma.ticket.findMany({
      where: { status: 'OPEN' },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: 'OPEN'|'IN_PROGRESS'|'CLOSED') {
    const exists = await this.prisma.ticket.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException('Ticket not found');
    return this.prisma.ticket.update({ where: { id }, data: { status } });
  }
}


