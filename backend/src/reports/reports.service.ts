import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * LINE CHART: Products Sold Stats (Thanh toán đã xác nhận)
   * Filter: day (7 days) | month (12 months) | year (5 years)
   */
  async getProductsSoldStats(range: 'day' | 'month' | 'year' = 'day') {
    const now = new Date();
    const buckets = this.generateTimeBuckets(now, range);

    // Get confirmed payments with order items
    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'CONFIRMED',
        createdAt: { gte: buckets[0].from },
      },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
    });

    // Calculate products sold per bucket
    const stats = buckets.map(bucket => {
      const bucketPayments = payments.filter(
        p => p.createdAt >= bucket.from && p.createdAt < bucket.to
      );
      
      const totalProducts = bucketPayments.reduce((sum, p) => {
        return sum + (p.order?.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0);
      }, 0);

      const totalRevenue = bucketPayments.reduce((sum, p) => {
        return sum + p.amount;
      }, 0);

      return {
        label: bucket.label,
        value: totalProducts,
        revenue: totalRevenue,
        date: bucket.from,
      };
    });

    return {
      labels: stats.map(s => s.label),
      data: stats.map(s => s.value),
      revenues: stats.map(s => s.revenue),
      total: stats.reduce((sum, s) => sum + s.value, 0),
      totalRevenue: stats.reduce((sum, s) => sum + s.revenue, 0),
    };
  }

  /**
   * BAR CHART: Orders Stats (Đơn hàng đã đặt - không bao gồm PENDING và CANCELLED)
   * Filter: day (7 days) | month (12 months) | year (5 years)
   * Include: CONFIRMED, SHIPPING, COMPLETED, RETURNED
   */
  async getOrdersStats(range: 'day' | 'month' | 'year' = 'day') {
    const now = new Date();
    const buckets = this.generateTimeBuckets(now, range);

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: buckets[0].from },
        status: {
          in: ['CONFIRMED', 'SHIPPING', 'COMPLETED', 'RETURNED'],
        },
      },
      select: {
        id: true,
        createdAt: true,
        totalAmount: true,
      },
    });

    const stats = buckets.map(bucket => {
      const bucketOrders = orders.filter(
        o => o.createdAt >= bucket.from && o.createdAt < bucket.to
      );
      return {
        label: bucket.label,
        count: bucketOrders.length,
        revenue: bucketOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      };
    });

    return {
      labels: stats.map(s => s.label),
      orderCounts: stats.map(s => s.count),
      revenues: stats.map(s => s.revenue),
      totalOrders: stats.reduce((sum, s) => sum + s.count, 0),
      totalRevenue: stats.reduce((sum, s) => sum + s.revenue, 0),
    };
  }

  /**
   * PIE CHART: Category Distribution (11 categories)
   */
  async getCategoryDistribution() {
    // Get all order items with category info
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

    // Group by category
    const categoryMap = new Map<string, {
      id: string;
      name: string;
      quantity: number;
      revenue: number;
    }>();

    for (const item of orderItems) {
      const category = item.product.category;
      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, {
          id: category.id,
          name: category.name,
          quantity: 0,
          revenue: 0,
        });
      }
      const cat = categoryMap.get(category.id);
      cat.quantity += item.quantity;
      cat.revenue += item.price * item.quantity;
    }

    const categories = Array.from(categoryMap.values())
      .sort((a, b) => b.quantity - a.quantity);

    return {
      labels: categories.map(c => c.name),
      data: categories.map(c => c.quantity),
      revenues: categories.map(c => c.revenue),
      total: categories.reduce((sum, c) => sum + c.quantity, 0),
    };
  }

  /**
   * MAP: Orders by Location (Province)
   */
  async getOrdersByLocation() {
    const orders = await this.prisma.order.findMany({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED'],
        },
      },
      include: {
        user: {
          select: {
            province: true,
            provinceName: true,
            district: true,
            ward: true,
            wardName: true,
          },
        },
      },
    });

    // Group by province
    const provinceMap = new Map<string, {
      code: string;
      name: string;
      count: number;
      districts: Map<string, number>;
    }>();

    for (const order of orders) {
      const province = order.user.province || 'Unknown';
      const provinceName = order.user.provinceName || 'Không xác định';

      if (!provinceMap.has(province)) {
        provinceMap.set(province, {
          code: province,
          name: provinceName,
          count: 0,
          districts: new Map(),
        });
      }

      const prov = provinceMap.get(province);
      prov.count += 1;

      // Track districts
      const district = order.user.district || 'Unknown';
      prov.districts.set(district, (prov.districts.get(district) || 0) + 1);
    }

    const locations = Array.from(provinceMap.values())
      .map(p => ({
        code: p.code,
        name: p.name,
        count: p.count,
        districts: Array.from(p.districts.entries()).map(([code, count]) => ({
          code,
          count,
        })),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      locations,
      total: orders.length,
      topLocation: locations[0] || null,
    };
  }

  /**
   * AREA CHART: User Registration Stats
   * Filter: day (30 days) | month (12 months) | year (5 years)
   */
  async getUserRegistrationStats(range: 'day' | 'month' | 'year' = 'day') {
    const now = new Date();
    const buckets = this.generateTimeBuckets(now, range, range === 'day' ? 30 : undefined);

    const users = await this.prisma.user.findMany({
      where: {
        createdAt: { gte: buckets[0].from },
      },
      select: {
        id: true,
        createdAt: true,
        role: true,
      },
    });

    const stats = buckets.map(bucket => {
      const bucketUsers = users.filter(
        u => u.createdAt >= bucket.from && u.createdAt < bucket.to
      );
      return {
        label: bucket.label,
        total: bucketUsers.length,
        users: bucketUsers.filter(u => u.role === 'USER').length,
        admins: bucketUsers.filter(u => u.role === 'ADMIN').length,
      };
    });

    return {
      labels: stats.map(s => s.label),
      totalRegistrations: stats.map(s => s.total),
      userRegistrations: stats.map(s => s.users),
      adminRegistrations: stats.map(s => s.admins),
      total: users.length,
    };
  }

  /**
   * Helper: Generate time buckets for different ranges
   */
  private generateTimeBuckets(
    now: Date,
    range: 'day' | 'month' | 'year',
    customDays?: number
  ) {
    const buckets: { label: string; from: Date; to: Date }[] = [];
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    if (range === 'day') {
      const days = customDays || 7;
      start.setDate(start.getDate() - (days - 1));
      for (let i = 0; i < days; i++) {
        const from = new Date(start);
        from.setDate(start.getDate() + i);
        const to = new Date(from);
        to.setDate(from.getDate() + 1);
        buckets.push({
          label: from.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          from,
          to,
        });
      }
    } else if (range === 'month') {
      const y = start.getFullYear();
      let m = start.getMonth() - 11;
      const base = new Date(y, m, 1);
      for (let i = 0; i < 12; i++) {
        const from = new Date(base.getFullYear(), base.getMonth() + i, 1);
        const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
        buckets.push({
          label: from.toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }),
          from,
          to,
        });
      }
    } else if (range === 'year') {
      const currentYear = start.getFullYear();
      for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        const from = new Date(year, 0, 1);
        const to = new Date(year + 1, 0, 1);
        buckets.push({
          label: year.toString(),
          from,
          to,
        });
      }
    }

    return buckets;
  }

  /**
   * Get summary statistics for reports page
   */
  async getSummaryStats() {
    const [
      totalProducts,
      totalOrders,
      totalRevenue,
      totalUsers,
      activeCategories,
    ] = await Promise.all([
      this.prisma.orderItem.aggregate({
        where: {
          order: {
            status: {
              in: ['COMPLETED', 'SHIPPING', 'CONFIRMED'],
            },
          },
        },
        _sum: { quantity: true },
      }),
      this.prisma.order.count(),
      this.prisma.payment.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
      this.prisma.user.count(),
      this.prisma.category.count({ where: { isActive: true } }),
    ]);

    return {
      totalProductsSold: totalProducts._sum.quantity || 0,
      totalOrders,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalUsers,
      activeCategories,
    };
  }
}

