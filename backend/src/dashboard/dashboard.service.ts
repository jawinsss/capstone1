import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [totalRevenue, pendingOrders, pendingProducts, openTickets] = await Promise.all([
      this.prisma.payment.aggregate({ where: { status: 'CONFIRMED' }, _sum: { amount: true } }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.product.count({ where: { isActive: false } }),
      this.prisma.ticket.count({ where: { status: 'OPEN' } }),
    ]);

    return {
      gmv: totalRevenue._sum.amount || 0,
      pendingOrders,
      pendingProducts,
      openTickets,
    };
  }

  async revenueLast7Days() {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const payments = await this.prisma.payment.findMany({
      where: { status: 'CONFIRMED', createdAt: { gte: since } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const map = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      map.set(key, 0);
    }
    for (const p of payments) {
      const key = p.createdAt.toISOString().slice(0, 10);
      map.set(key, (map.get(key) || 0) + p.amount);
    }
    return Array.from(map.entries()).map(([date, amount]) => ({ date, amount }));
  }

  async revenueByRange(range: 'day'|'week'|'month' = 'day') {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0,0,0,0);

    const buckets: { key: string; from: Date; to: Date }[] = [];
    if (range === 'day') {
      // last 7 days
      start.setDate(start.getDate() - 6);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const from = new Date(d);
        const to = new Date(d); to.setDate(d.getDate()+1);
        buckets.push({ key: d.toISOString().slice(0,10), from, to });
      }
    } else if (range === 'week') {
      // last 8 weeks (Sun-Sat groups)
      const cur = new Date(start);
      cur.setDate(cur.getDate() - (cur.getDay() || 7) + 1); // set to Monday this week
      cur.setDate(cur.getDate() - 7*7); // 8 weeks window
      for (let i = 0; i < 8; i++) {
        const from = new Date(cur); from.setDate(cur.getDate() + i*7);
        const to = new Date(from); to.setDate(from.getDate() + 7);
        const key = `${from.getFullYear()}-W${i+1}`;
        buckets.push({ key, from, to });
      }
    } else {
      // last 12 months
      const y = start.getFullYear();
      let m = start.getMonth() - 11;
      const base = new Date(y, m, 1);
      for (let i = 0; i < 12; i++) {
        const from = new Date(base.getFullYear(), base.getMonth() + i, 1);
        const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
        const key = `${from.getFullYear()}-${String(from.getMonth()+1).padStart(2,'0')}`;
        buckets.push({ key, from, to });
      }
    }

    const payments = await this.prisma.payment.findMany({
      where: { status: 'CONFIRMED', createdAt: { gte: buckets[0].from } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const sums = buckets.map(b => ({ key: b.key, amount: 0 }));
    for (const p of payments) {
      const t = p.createdAt;
      const idx = buckets.findIndex(b => t >= b.from && t < b.to);
      if (idx >= 0) sums[idx].amount += p.amount;
    }
    return sums;
  }
}


