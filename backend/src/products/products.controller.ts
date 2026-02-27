import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService, CreateProductDto, UpdateProductDto, ApiResponse } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products with filters' })
  findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  async findOne(@Param('id') id: string): Promise<ApiResponse> {
    const result = await this.productsService.findOne(id);
    
    if (!result.success) {
      return {
        success: false,
        message: (result as any).message || 'Product not found',
        statusCode: 404
      };
    }
    
    return result ;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create product (ADMIN)' })
  async create(@Body() dto: CreateProductDto): Promise<ApiResponse> {
    const result = await this.productsService.create(dto);
    
    if (!result.success) {
      return {
        success: false,
        message: (result as any).message || 'Create failed',
        statusCode: 400
      };
    }
    
    return result;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product (ADMIN)' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto): Promise<ApiResponse> {
    const result = await this.productsService.update(id, dto);
    
    if (!result.success) {
      return {
        success: false,
        message: (result as any).message || 'Update failed',
        statusCode: 400
      };
    }
    
    return result;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product (ADMIN)' })
  async remove(@Param('id') id: string): Promise<ApiResponse> {
    const result = await this.productsService.remove(id);
    
    if (!result.success) {
      return {
        success: false,
        message: (result as any).message || 'Delete failed',
        statusCode: 400
      };
    }
    
    return result;
  }
}


