import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Prisma } from '@prisma/client';

export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  categoryId: string;
  images?: { url: string; alt?: string; order?: number }[] ;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
  isActive?: boolean;
  images?: { url: string; alt?: string; order?: number }[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: any;
  statusCode?: number;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params?: any) {
    const take = Math.min(Math.max(Number(params?.take) || 12, 1), 1000); // Increased from 100 to 1000 for infinite scroll
    const page = Math.max(Number(params?.page) || 1, 1);
    const skip = (page - 1) * take;
    const where: any = {};
    
    // Handle categoryId - include products from subcategories and siblings
    if (params?.categoryId) {
      console.log('[ProductsService] Querying with categoryId:', params.categoryId);
      
      // Get the category to check if it has a parent
      const category = await this.prisma.category.findUnique({
        where: { id: params.categoryId },
        select: { id: true, parentId: true, name: true }
      });
      
      if (!category) {
        console.log('[ProductsService] Category not found:', params.categoryId);
        where.categoryId = params.categoryId; // Fallback to exact match
      } else {
        console.log('[ProductsService] Category info:', category);
        
        // Check if this category has subcategories (is a parent)
        const subcategories = await this.prisma.category.findMany({
          where: { parentId: params.categoryId },
          select: { id: true }
        });
        
        console.log('[ProductsService] Found subcategories:', subcategories.length);
        
        if (subcategories.length > 0) {
          // This is a parent category - include parent + all children
          const categoryIds = [params.categoryId, ...subcategories.map(sub => sub.id)];
          console.log('[ProductsService] Parent category - using IDs:', categoryIds);
          where.categoryId = { in: categoryIds };
        } else if (category.parentId) {
          // This is a child category - include all siblings + parent for related products
          const siblings = await this.prisma.category.findMany({
            where: { parentId: category.parentId },
            select: { id: true }
          });
          const categoryIds = [category.parentId, ...siblings.map(sib => sib.id)];
          console.log('[ProductsService] Child category - including parent and siblings:', categoryIds);
          where.categoryId = { in: categoryIds };
        } else {
          // Root category with no children - just use exact match
          console.log('[ProductsService] Root category without children - exact match');
          where.categoryId = params.categoryId;
        }
      }
    }
    
    if (params?.q) where.name = { contains: String(params.q), mode: 'insensitive' };
    if (params?.minPrice || params?.maxPrice) where.price = {
      gte: params.minPrice ? Math.trunc(params.minPrice) : undefined,
      lte: params.maxPrice ? Math.trunc(params.maxPrice) : undefined,
    };
    let orderBy: Prisma.ProductOrderByWithRelationInput;
    if (params?.sort === 'price_asc') {
      orderBy = { price: 'asc' as Prisma.SortOrder };
    } else if (params?.sort === 'price_desc') {
      orderBy = { price: 'desc' as Prisma.SortOrder };
    } else {
      orderBy = { createdAt: 'desc' as Prisma.SortOrder };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({ where, include: { images: true, category: true }, orderBy, skip, take }),
      this.prisma.product.count({ where }),
    ]);
    
    console.log('[ProductsService] Query results:', {
      foundItems: items.length,
      total: total,
      page: page,
      take: take,
      skip: skip
    });
    
    return {
      success: true,
      data: items,
      meta: {
        total,
        page,
        take,
        pages: Math.ceil(total / take)
      }
    };
  }

  async findOne(id: string, userId?: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: { images: true, category: true },
      });
      
      if (!product) {
        return {
          success: false,
          message: 'Product not found'
        };
      }

      // Create audit log for product view if userId is provided
      if (userId) {
        try {
          await this.auditService.createAuditLog({
            userId: userId,
            action: 'VIEW',
            resource: 'PRODUCT',
            resourceId: product.id,
            details: {
              productName: product.name,
              productPrice: product.price,
              category: product.category?.name,
              viewTime: new Date().toISOString()
            },
            ipAddress: null, // Will be set by controller if available
            userAgent: null, // Will be set by controller if available
          });
        } catch (error) {
          console.error('Failed to create audit log for product view:', error);
        }
      }
      
      return {
        success: true,
        data: product
      };
    } catch (error) {
      console.error('ProductsService.findOne error:', error);
      return {
        success: false,
        message: error.message || 'Failed to find product'
      };
    }
  }

  async create(dto: CreateProductDto, userId?: string) {
    try {
      // Validate required fields
      if (!dto.name || !dto.categoryId) {
        return {
          success: false,
          message: 'Name and categoryId are required'
        };
      }

      // Check if category exists
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
        select: { id: true }
      });
      
      if (!category) {
        return {
          success: false,
          message: 'Category not found'
        };
      }

      const product = await this.prisma.product.create({
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

      // Create audit log for product creation if userId is provided
      if (userId) {
        try {
          await this.auditService.createAuditLog({
            userId: userId,
            action: 'CREATE',
            resource: 'PRODUCT',
            resourceId: product.id,
            details: {
              productName: product.name,
              productPrice: product.price,
              category: product.categoryId,
              stock: product.stock,
              createdBy: userId
            },
            ipAddress: null, // Will be set by controller if available
            userAgent: null, // Will be set by controller if available
          });
        } catch (error) {
          console.error('Failed to create audit log for product creation:', error);
        }
      }

      return {
        success: true,
        data: product
      };
    } catch (error) {
      console.error('ProductsService.create error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create product'
      };
    }
  }

  async update(id: string, dto: UpdateProductDto, userId?: string) {
    try {
      const exists = await this.ensureExists(id);
      if (!exists.success) {
        return exists;
      }

      const product = await this.prisma.product.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.name ? await this.generateUniqueSlug(dto.name) : undefined,
          description: dto.description,
          price: dto.price !== undefined ? Math.max(0, Math.trunc(dto.price)) : undefined,
          stock: dto.stock !== undefined ? Math.max(0, Math.trunc(dto.stock)) : undefined,
          categoryId: dto.categoryId,
          isActive: dto.isActive,
          // For simplicity, replace images if provided
          images: dto.images
            ? {
                deleteMany: { productId: id },
                create: dto.images.map((i) => ({ url: i.url, alt: i.alt, order: i.order ?? 0 })),
              }
            : undefined,
        },
        include: { images: true, category: true },
      });

      // Create audit log for product update if userId is provided
      if (userId) {
        try {
          await this.auditService.createAuditLog({
            userId: userId,
            action: 'UPDATE',
            resource: 'PRODUCT',
            resourceId: product.id,
            details: {
              productName: product.name,
              productPrice: product.price,
              category: product.categoryId,
              stock: product.stock,
              updatedFields: Object.keys(dto),
              updatedBy: userId
            },
            ipAddress: null, // Will be set by controller if available
            userAgent: null, // Will be set by controller if available
          });
        } catch (error) {
          console.error('Failed to create audit log for product update:', error);
        }
      }

      return {
        success: true,
        data: product
      };
    } catch (error) {
      console.error('ProductsService.update error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update product'
      };
    }
  }

  async remove(id: string) {
    try {
      const exists = await this.ensureExists(id);
      if (!exists.success) {
        return exists;
      }

      await this.prisma.productImage.deleteMany({ where: { productId: id } });
      await this.prisma.product.delete({ where: { id } });

      return {
        success: true,
        message: 'Product deleted successfully'
      };
    } catch (error) {
      console.error('ProductsService.remove error:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete product'
      };
    }
  }

  private async ensureExists(id: string) {
    try {
      const exists = await this.prisma.product.findUnique({ where: { id }, select: { id: true } });
      if (!exists) {
        return {
          success: false,
          message: 'Product not found'
        };
      }
      return {
        success: true
      };
    } catch (error) {
      console.error('ProductsService.ensureExists error:', error);
      return {
        success: false,
        message: error.message || 'Failed to check product existence'
      };
    }
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    let slug = base || 'product';
    let i = 1;
    while (
      await this.prisma.product.findFirst({ where: { slug }, select: { id: true } })
    ) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }
}


