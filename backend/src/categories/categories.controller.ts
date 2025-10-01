import { Body, Controller, Get, Post, Put, Delete, Param, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { CategoriesService, CreateCategoryDto, UpdateCategoryDto } from './categories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List all categories with subcategories' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('main')
  @ApiOperation({ summary: 'List main categories only' })
  findMainCategories() {
    return this.categoriesService.findMainCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  findById(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Get(':parentId/subcategories')
  @ApiOperation({ summary: 'Get subcategories by parent ID' })
  @ApiParam({ name: 'parentId', description: 'Parent category ID' })
  findSubcategories(@Param('parentId') parentId: string) {
    return this.categoriesService.findSubcategories(parentId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create category (ADMIN)' })
  async create(@Body() dto: CreateCategoryDto) {
    try {
      return await this.categoriesService.create(dto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (ADMIN)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category (ADMIN)' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async delete(@Param('id') id: string, @Query('hard') hardDelete?: string) {
    try {
      const isHardDelete = hardDelete === 'true';
      return await this.categoriesService.delete(id, isHardDelete);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}


