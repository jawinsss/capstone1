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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OrdersService = class OrdersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    list() {
        return this.prisma.order.findMany({
            include: { items: { include: { product: true } }, user: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateStatus(id, status) {
        const exists = await this.prisma.order.findUnique({ where: { id }, select: { id: true } });
        if (!exists)
            throw new common_1.NotFoundException('Order not found');
        return this.prisma.order.update({ where: { id }, data: { status } });
    }
    async create(payload) {
        const code = `ORD-${Date.now()}`;
        const productIds = (payload.items || []).map((i) => i.productId);
        const products = await this.prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, price: true } });
        const priceMap = new Map(products.map((p) => [p.id, p.price]));
        const items = (payload.items || []).map((i) => ({
            productId: i.productId,
            quantity: Math.max(1, Number(i.quantity) || 1),
            price: priceMap.get(i.productId) || 0,
        }));
        const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);
        const email = payload?.customer?.email || `guest-${Date.now()}@example.com`;
        const user = await this.prisma.user.upsert({
            where: { email },
            update: { fullName: payload?.customer?.fullName ?? 'Khách hàng', phone: payload?.customer?.phone },
            create: {
                email,
                username: email,
                password: email,
                fullName: payload?.customer?.fullName ?? 'Khách hàng',
                phone: payload?.customer?.phone,
                role: 'USER',
            },
        });
        const order = await this.prisma.order.create({
            data: {
                code,
                userId: user.id,
                status: 'PENDING',
                totalAmount,
                items: { create: items },
            },
            include: { items: true },
        });
        if (payload?.payment?.amount > 0) {
            await this.prisma.payment.create({ data: { orderId: order.id, amount: Math.trunc(payload.payment.amount), status: 'PENDING' } });
        }
        return order;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map