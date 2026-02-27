import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      const [
      totalRevenue,
      todayRevenue,
      yesterdayRevenue,
      totalOrders,
      pendingOrders,
      shippingOrders,
      completedOrders,
      todayOrders,
      totalProducts,
      lowStockProducts,
      totalUsers,
      activeUsers,
      openTickets,
      recentOrders,
    ] = await Promise.all([
      // Revenue metrics
      this.prisma.payment.aggregate({
        where: { status: `CONFIRMED` },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: `CONFIRMED`, createdAt: { gte: startOfToday } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'CONFIRMED',
          createdAt: { gte: startOfYesterday, lt: startOfToday },
        },
        _sum: { amount: true },
      }),
    // Get all metrics in parallel

      
      // Order metrics
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: 'SHIPPING' } }),
      this.prisma.order.count({ where: { status: 'COMPLETED' } }),
      this.prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      
      // Product metrics
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.count({ where: { stock: { lte: 10 }, isActive: true } }),
      
      // User metrics
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      
      // Ticket metrics
      this.prisma.ticket.count({ where: { status: 'OPEN' } }),
      
      // Recent orders
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { fullName: true, email: true },
          },
          items: {
            include: {
              product: {
                select: { name: true },
              },
            },
          },
        },
      }),
    ]);

    // Calculate growth percentages
    const todayRev = todayRevenue._sum.amount || 0;
    const yesterdayRev = yesterdayRevenue._sum.amount || 0;
    const revenueGrowth = yesterdayRev > 0 
      ? ((todayRev - yesterdayRev) / yesterdayRev) * 100 
      : 0;

    return {
      // Revenue
      totalRevenue: totalRevenue._sum.amount || 0,
      todayRevenue: todayRev,
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      
      // Orders
      totalOrders,
      pendingOrders,
      shippingOrders,
      completedOrders,
      todayOrders,
      
      // Products
      totalProducts,
      lowStockProducts,
      
      // Users
      totalUsers,
      activeUsers,
      
      // Tickets
      openTickets,
      
      // Recent activity
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        code: order.code,
        customerName: order.user.fullName,
        totalAmount: order.totalAmount,
        status: order.status,
        itemCount: order.items.length,
        createdAt: order.createdAt,
      })),
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

  async getTopCategories(limit: number = 10) {
    // Get order items with category information
    const orderItems = await this.prisma.orderItem.findMany({
      include: {
        product: {
          include: {
            category: true,
          },
        },
        order: {
          select: {
            status: true,
          },
        },
      },
      where: {
        order: {
          status: {
            in: ['COMPLETED', 'SHIPPING', 'CONFIRMED'],
          },
        },
      },
    });

    // Group by category and count products sold
    const categoryMap = new Map<string, { 
      id: string; 
      name: string; 
      totalQuantity: number;
      totalRevenue: number;
      productCount: Set<string>;
    }>();

    for (const item of orderItems) {
      const category = item.product.category;
      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, {
          id: category.id,
          name: category.name,
          totalQuantity: 0,
          totalRevenue: 0,
          productCount: new Set(),
        });
      }
      const cat = categoryMap.get(category.id);
      cat.totalQuantity += item.quantity;
      cat.totalRevenue += item.price * item.quantity;
      cat.productCount.add(item.product.id);
    }

    // Convert to array and sort by quantity sold
    const topCategories = Array.from(categoryMap.values())
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        productsSold: cat.totalQuantity,
        uniqueProducts: cat.productCount.size,
        revenue: cat.totalRevenue,
      }))
      .sort((a, b) => b.productsSold - a.productsSold)
      .slice(0, limit);

    return topCategories;
  }

  async getRevenueByHour() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'CONFIRMED',
        createdAt: { gte: startOfToday },
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by hour
    const hourlyRevenue = new Array(24).fill(0);
    for (const p of payments) {
      const hour = p.createdAt.getHours();
      hourlyRevenue[hour] += p.amount;
    }

    return hourlyRevenue.map((amount, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      amount,
    }));
  }

  async getOrderStatusDistribution() {
    const statusCounts = await this.prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    return statusCounts.map(s => ({
      status: s.status,
      count: s._count,
    }));
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


