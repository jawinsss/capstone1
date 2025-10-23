// src/payment-gateway/payment-gateway.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentCleanupService } from './payment-cleanup.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('payment-gateway')
@Controller('payment-gateway')
export class PaymentGatewayController {
  constructor(
    private readonly paymentService: PaymentGatewayService,
    private readonly cleanupService: PaymentCleanupService,
  ) {}

  @Post('create-momo')
  @ApiOperation({ summary: 'Create MoMo payment URL' })
  createMomo(@Body() body: { amount: number; orderId: string }) {
    return this.paymentService.createMomoPayment(body.amount, body.orderId);
  }
  
  @Post('create-zalopay')
  @ApiOperation({ summary: 'Create ZaloPay payment URL' })
  createZaloPay(@Body() body: { amount: number; orderId: string }) {
    return this.paymentService.createZaloPayPayment(body.amount, body.orderId);
  }

  @Post('momo-ipn')
  @ApiOperation({ summary: 'MoMo IPN callback endpoint' })
  handleMomoIPN(@Body() body: any) {
    return this.paymentService.handleMomoIPN(body);
  }

  @Post('zalopay-callback')
  @ApiOperation({ summary: 'ZaloPay callback endpoint' })
  handleZaloPayCallback(@Body() body: any) {
    return this.paymentService.handleZaloPayCallback(body);
  }

  @Get('status/:orderId')
  @ApiOperation({ summary: 'Get payment status for an order' })
  getPaymentStatus(@Param('orderId') orderId: string) {
    return this.paymentService.getPaymentStatus(orderId);
  }

  @Post('confirm-payment')
  @ApiOperation({ summary: 'Manually confirm payment from redirect callback' })
  confirmPayment(@Body() body: {
    orderId: string;
    transactionId: string;
    method: string;
    amount: number;
    resultCode: number;
  }) {
    return this.paymentService.confirmPaymentManual(body);
  }

  @Post('fail-payment')
  @ApiOperation({ summary: 'Mark payment as failed (canceled/expired)' })
  failPayment(@Body() body: {
    orderId: string;
    method: string;
    resultCode: number;
    message: string;
  }) {
    return this.paymentService.failPaymentManual(body);
  }

  @Post('cleanup-expired')
  @ApiOperation({ summary: 'Manual cleanup of expired payments (for testing)' })
  manualCleanup() {
    return this.cleanupService.manualCleanup();
  }
}
