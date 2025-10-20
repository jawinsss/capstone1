// src/payment-gateway/payment-gateway.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { PaymentGatewayService } from './payment-gateway.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('payment-gateway')
@Controller('payment-gateway')
export class PaymentGatewayController {
  constructor(private readonly paymentService: PaymentGatewayService) {}

  @Post('create-momo')
  createMomo(@Body('amount') amount: number) {
    return this.paymentService.createMomoPayment(amount);
  }
  
  @Post('create-zalopay')
  createZaloPay(@Body('amount') amount: number) {
    return this.paymentService.createZaloPayPayment(amount);
  }
}
