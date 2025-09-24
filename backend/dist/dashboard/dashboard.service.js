"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
        const map = new Map();
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
    async revenueByRange(range = 'day') {
        const now = new Date();
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        const buckets = [];
        if (range === 'day') {
            start.setDate(start.getDate() - 6);
            for (let i = 0; i < 7; i++) {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                const from = new Date(d);
                const to = new Date(d);
                to.setDate(d.getDate() + 1);
                buckets.push({ key: d.toISOString().slice(0, 10), from, to });
            }
        }
        else if (range === 'week') {
            const cur = new Date(start);
            cur.setDate(cur.getDate() - (cur.getDay() || 7) + 1);
            cur.setDate(cur.getDate() - 7 * 7);
            for (let i = 0; i < 8; i++) {
                const from = new Date(cur);
                from.setDate(cur.getDate() + i * 7);
                const to = new Date(from);
                to.setDate(from.getDate() + 7);
                const key = `${from.getFullYear()}-W${i + 1}`;
                buckets.push({ key, from, to });
            }
        }
        else {
            const y = start.getFullYear();
            let m = start.getMonth() - 11;
            const base = new Date(y, m, 1);
            for (let i = 0; i < 12; i++) {
                const from = new Date(base.getFullYear(), base.getMonth() + i, 1);
                const to = new Date(from.getFullYear(), from.getMonth() + 1, 1);
                const key = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}`;
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
            if (idx >= 0)
                sums[idx].amount += p.amount;
        }
        return sums;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map