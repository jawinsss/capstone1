import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get comprehensive dashboard overview with all KPIs' })
  overview() {
    return this.dashboardService.getOverview();
  }

  @Get('revenue-7d')
  @ApiOperation({ summary: 'Get revenue for last 7 days' })
  revenue7d() {
    return this.dashboardService.revenueLast7Days();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue by time range' })
  @ApiQuery({ name: 'range', enum: ['day', 'week', 'month'], required: false })
  revenue(@Query('range') range: 'day'|'week'|'month' = 'day') {
    return this.dashboardService.revenueByRange(range);
  }

  @Get('top-categories')
  @ApiOperation({ summary: 'Get top selling categories' })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  topCategories(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.dashboardService.getTopCategories(limitNum);
  }

  @Get('revenue-hourly')
  @ApiOperation({ summary: 'Get revenue breakdown by hour for today' })
  revenueHourly() {
    return this.dashboardService.getRevenueByHour();
  }

  @Get('order-distribution')
  @ApiOperation({ summary: 'Get order status distribution' })
  orderDistribution() {
    return this.dashboardService.getOrderStatusDistribution();
  }
}


