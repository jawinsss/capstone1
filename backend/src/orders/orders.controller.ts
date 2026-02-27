import { Body, Controller, Get, Param, Patch, Post, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { OrderAutomationService } from './order-automation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly automationService: OrderAutomationService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  list() {
    return this.ordersService.list();
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  updateStatus(@Param('id') id: string, @Body('status') status: any) {
    return this.ordersService.updateStatus(id, status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(`ADMIN`)
  @ApiBearerAuth()
  deleteOrder(@Param('id') id: string, @Req() req) {
    return this.ordersService.delete(id, req.user?.id);
  }

  // Public checkout
  @Post()
  createOrder(@Body() body: any) {
    return this.ordersService.create(body);
  }

  // Get user orders
  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getUserOrders(@Req() req) {
    return this.ordersService.getUserOrders(req.user.id);
  }

  // User cancel order
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  cancelOrder(@Param('id') id: string, @Req() req) {
    return this.ordersService.cancelOrder(id, req.user.id);
  }

  // User mark order as received
  @Patch(':id/received')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  markReceived(@Param('id') id: string, @Req() req) {
    return this.ordersService.markReceived(id, req.user.id);
  }

  // User request return/refund
  @Post(':id/return')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  requestReturn(@Param('id') id: string, @Body() body: any, @Req() req) {
    return this.ordersService.requestReturn(id, req.user.id, body);
  }

  // ========================================
  // AUTOMATION ENDPOINTS (ADMIN ONLY)
  // ========================================

  // Get automation statistics
  @Get('automation/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  getAutomationStats() {
    return this.automationService.getAutomationStats();
  }

  // Manually trigger automation for specific order
  @Post('automation/process/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  processOrderManually(@Param('id') id: string) {
    return this.automationService.processOrder(id);
  }

  // Manually trigger automation for all orders (run now)
  @Post('automation/run')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  async runAutomationNow() {
    await this.automationService.autoApproveOrders();
    return {
      success: true,
      message: 'Automation executed successfully',
    };
  }
}


