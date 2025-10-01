import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateCategoryDto {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' },
    });
  }

  async findMainCategories() {
    return this.prisma.category.findMany({
      where: { 
        isActive: true,
        parentId: null 
      },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' },
    });
  }

  async findSubcategories(parentId: string) {
    return this.prisma.category.findMany({
      where: { 
        isActive: true,
        parentId: parentId 
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        }
      },
    });
  }

  async create(dto: CreateCategoryDto) {
    try {
      console.log('Creating category with data:', dto);
      
      // Check for duplicate name under same parent
      const existingCategory = await this.prisma.category.findFirst({
        where: {
          name: dto.name,
          parentId: dto.parentId || null,
          isActive: true
        }
      });
      
      if (existingCategory) {
        throw new Error(`Danh mục "${dto.name}" đã tồn tại trong danh mục cha này`);
      }
      
      // Generate unique slug
      const slug = await this.generateUniqueSlug(dto.name, dto.parentId);
      console.log('Generated slug:', slug);
      
      const categoryData = {
        name: dto.name,
        slug: slug,
        description: dto.description,
        parentId: dto.parentId || null,
      };
      console.log('Category data to insert:', categoryData);
      
      return await this.prisma.category.create({
        data: categoryData,
        include: {
          parent: true,
          children: {
            where: { isActive: true },
            orderBy: { name: 'asc' }
          }
        },
      });
    } catch (error: any) {
      console.error('Error creating category:', error);
      
      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('unique_name_per_parent')) {
          throw new Error(`Danh mục "${dto.name}" đã tồn tại trong danh mục cha này`);
        } else if (error.meta?.target?.includes('slug')) {
          throw new Error('Slug đã tồn tại, vui lòng thử lại');
        }
      }
      
      throw new Error(`Không thể tạo danh mục: ${error.message}`);
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    try {
      const updateData: any = {};
      
      // Check for duplicate name if name is being updated
      if (dto.name) {
        const existingCategory = await this.prisma.category.findFirst({
          where: {
            name: dto.name,
            parentId: dto.parentId !== undefined ? dto.parentId : undefined,
            isActive: true,
            id: { not: id } // Exclude current category
          }
        });
        
        if (existingCategory) {
          throw new Error(`Danh mục "${dto.name}" đã tồn tại trong danh mục cha này`);
        }
        
        updateData.name = dto.name;
        updateData.slug = await this.generateUniqueSlug(dto.name, dto.parentId);
      }
      
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.parentId !== undefined) updateData.parentId = dto.parentId;
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

      return await this.prisma.category.update({
        where: { id },
        data: updateData,
        include: {
          parent: true,
          children: {
            where: { isActive: true },
            orderBy: { name: 'asc' }
          }
        },
      });
    } catch (error: any) {
      console.error('Error updating category:', error);
      
      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        if (error.meta?.target?.includes('unique_name_per_parent')) {
          throw new Error(`Danh mục "${dto.name}" đã tồn tại trong danh mục cha này`);
        } else if (error.meta?.target?.includes('slug')) {
          throw new Error('Slug đã tồn tại, vui lòng thử lại');
        }
      }
      
      throw new Error(`Không thể cập nhật danh mục: ${error.message}`);
    }
  }

  async delete(id: string, hardDelete: boolean = false) {
    // Check if category has children
    const children = await this.prisma.category.findMany({
      where: { parentId: id, isActive: true }
    });

    if (children.length > 0) {
      throw new Error('Không thể xóa danh mục có danh mục con');
    }

    // Check if category has products
    const products = await this.prisma.product.findMany({
      where: { categoryId: id }
    });

    if (products.length > 0) {
      throw new Error('Không thể xóa danh mục có sản phẩm');
    }

    if (hardDelete) {
      // Hard delete - permanently remove from database
      return this.prisma.category.delete({
        where: { id },
      });
    } else {
      // Soft delete - set isActive to false
      return this.prisma.category.update({
        where: { id },
        data: { isActive: false },
      });
    }
  }

  private async generateUniqueSlug(name: string, parentId?: string): Promise<string> {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    let slug = base || 'category';
    
    // Add parent context to make slug more unique
    if (parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: parentId },
        select: { slug: true }
      });
      if (parent) {
        slug = `${parent.slug}-${slug}`;
      }
    }
    
    // First try the base slug
    let existing = await this.prisma.category.findFirst({ 
      where: { slug }, 
      select: { id: true } 
    });
    
    if (!existing) {
      return slug;
    }
    
    // If base slug exists, try with numbers
    let i = 1;
    while (i <= 100) {
      const numberedSlug = `${slug}-${i}`;
      existing = await this.prisma.category.findFirst({ 
        where: { slug: numberedSlug }, 
        select: { id: true } 
      });
      
      if (!existing) {
        return numberedSlug;
      }
      i++;
    }
    
    // If still not unique, use timestamp
    slug = `${slug}-${Date.now()}`;
    return slug;
  }
}


