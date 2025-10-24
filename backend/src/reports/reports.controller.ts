import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('products-sold')
  @ApiOperation({ summary: 'Get products sold statistics (Line Chart)' })
  @ApiQuery({ name: 'range', enum: ['day', 'month', 'year'], required: false })
  async getProductsSold(@Query('range') range?: 'day' | 'month' | 'year') {
    return this.reportsService.getProductsSoldStats(range || 'day');
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get orders statistics (Bar Chart)' })
  @ApiQuery({ name: 'range', enum: ['day', 'month', 'year'], required: false })
  async getOrders(@Query('range') range?: 'day' | 'month' | 'year') {
    return this.reportsService.getOrdersStats(range || 'day');
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get category distribution (Pie Chart)' })
  async getCategories() {
    return this.reportsService.getCategoryDistribution();
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get orders by location (Map)' })
  async getLocations() {
    return this.reportsService.getOrdersByLocation();
  }

  @Get('user-registrations')
  @ApiOperation({ summary: 'Get user registration statistics (Area Chart)' })
  @ApiQuery({ name: 'range', enum: ['day', 'month', 'year'], required: false })
  async getUserRegistrations(@Query('range') range?: 'day' | 'month' | 'year') {
    return this.reportsService.getUserRegistrationStats(range || 'day');
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get summary statistics for reports page' })
  async getSummary() {
    return this.reportsService.getSummaryStats();
  }
}

