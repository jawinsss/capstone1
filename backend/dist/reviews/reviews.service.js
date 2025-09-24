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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReviewsService = class ReviewsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    list() {
        return this.prisma.review.findMany({
            include: {
                user: { select: { id: true, username: true, fullName: true } },
                product: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    listByProduct(productId) {
        return this.prisma.review.findMany({
            where: { productId, status: 'PUBLISHED' },
            include: { user: { select: { id: true, username: true, fullName: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(userId, payload) {
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
    async updateStatus(id, status) {
        const exists = await this.prisma.review.findUnique({ where: { id }, select: { id: true } });
        if (!exists)
            throw new common_1.NotFoundException('Review not found');
        return this.prisma.review.update({ where: { id }, data: { status } });
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map