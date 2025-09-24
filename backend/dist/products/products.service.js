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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductsService = class ProductsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const take = Math.min(Math.max(Number(params?.take) || 12, 1), 100);
        const page = Math.max(Number(params?.page) || 1, 1);
        const skip = (page - 1) * take;
        const where = {};
        if (params?.categoryId)
            where.categoryId = params.categoryId;
        if (params?.q)
            where.name = { contains: String(params.q), mode: 'insensitive' };
        if (params?.minPrice || params?.maxPrice)
            where.price = {
                gte: params.minPrice ? Math.trunc(params.minPrice) : undefined,
                lte: params.maxPrice ? Math.trunc(params.maxPrice) : undefined,
            };
        let orderBy;
        if (params?.sort === 'price_asc') {
            orderBy = { price: 'asc' };
        }
        else if (params?.sort === 'price_desc') {
            orderBy = { price: 'desc' };
        }
        else {
            orderBy = { createdAt: 'desc' };
        }
        const [items, total] = await this.prisma.$transaction([
            this.prisma.product.findMany({ where, include: { images: true, category: true }, orderBy, skip, take }),
            this.prisma.product.count({ where }),
        ]);
        return { items, total, page, take, pages: Math.ceil(total / take) };
    }
    async findOne(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { images: true, category: true },
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        return product;
    }
    async create(dto) {
        return this.prisma.product.create({
            data: {
                name: dto.name,
                slug: await this.generateUniqueSlug(dto.name),
                description: dto.description,
                price: Math.max(0, Math.trunc(dto.price || 0)),
                stock: Math.max(0, Math.trunc(dto.stock || 0)),
                categoryId: dto.categoryId,
                images: dto.images?.length
                    ? { create: dto.images.map((i) => ({ url: i.url, alt: i.alt, order: i.order ?? 0 })) }
                    : undefined,
            },
            include: { images: true, category: true },
        });
    }
    async update(id, dto) {
        await this.ensureExists(id);
        return this.prisma.product.update({
            where: { id },
            data: {
                name: dto.name,
                slug: dto.name ? await this.generateUniqueSlug(dto.name) : undefined,
                description: dto.description,
                price: dto.price !== undefined ? Math.max(0, Math.trunc(dto.price)) : undefined,
                stock: dto.stock !== undefined ? Math.max(0, Math.trunc(dto.stock)) : undefined,
                categoryId: dto.categoryId,
                isActive: dto.isActive,
                images: dto.images
                    ? {
                        deleteMany: { productId: id },
                        create: dto.images.map((i) => ({ url: i.url, alt: i.alt, order: i.order ?? 0 })),
                    }
                    : undefined,
            },
            include: { images: true, category: true },
        });
    }
    async remove(id) {
        await this.ensureExists(id);
        await this.prisma.productImage.deleteMany({ where: { productId: id } });
        return this.prisma.product.delete({ where: { id } });
    }
    async ensureExists(id) {
        const exists = await this.prisma.product.findUnique({ where: { id }, select: { id: true } });
        if (!exists)
            throw new common_1.NotFoundException('Product not found');
    }
    async generateUniqueSlug(name) {
        const base = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        let slug = base || 'product';
        let i = 1;
        while (await this.prisma.product.findFirst({ where: { slug }, select: { id: true } })) {
            slug = `${base}-${i++}`;
        }
        return slug;
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map