// src/payment-gateway/payment-gateway.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as https from 'https';
import * as moment from 'moment';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  // ================== MoMo ==================
  async createMomoPayment(amount: number, orderId: string) {
    const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';
    const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
    const secretkey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
    const requestId = partnerCode + new Date().getTime();
    const momoOrderId = requestId; // MoMo internal order ID
    const orderInfo = `Thanh toán đơn hàng MatFlow #${orderId}`;
    // Redirect về bill.html sau khi thanh toán
    const redirectUrl = process.env.MOMO_REDIRECT_URL || 'http://localhost:5500/frontend/Page/homepage/bill.html';
    const ipnUrl = process.env.MOMO_IPN_URL || 'http://localhost:3000/payment-gateway/momo-ipn';
    const requestType = 'captureWallet';
    const extraData = Buffer.from(JSON.stringify({ orderId })).toString('base64'); // Store our order ID

    const rawSignature =
      `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac('sha256', secretkey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId: momoOrderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      requestType,
      extraData,
      signature,
      lang: 'vi',
      orderExpireTime: 3, // QR expires after 3 minutes
    };

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'payment.momo.vn',
        port: 443,
        path: '/v2/gateway/api/create',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            // Thêm thông tin status và message để frontend có thể sử dụng
            const enhancedResponse = {
              ...response,
              status: response.resultCode === 0 ? 'success' : 'failed',
              message: response.message || (response.resultCode === 0 ? 'Tạo mã thanh toán thành công' : 'Tạo mã thanh toán thất bại'),
              resultCode: response.resultCode,
              timestamp: new Date().toISOString()
            };
            resolve(enhancedResponse);
          } catch (error) {
            reject(new InternalServerErrorException('Invalid JSON response from MoMo API'));
          }
        });
      });

      req.on('error', (e) =>
        reject(new InternalServerErrorException(e.message)),
      );
      req.write(JSON.stringify(requestBody));
      req.end();
    });
  }

  // ================== ZaloPay ==================
  async createZaloPayPayment(amount: number, orderId: string) {
    const config = {
      app_id: process.env.ZALOPAY_APP_ID || '2553',
      key1: process.env.ZALOPAY_KEY1 || 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL',
      endpoint: process.env.ZALOPAY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create',
    };

    const embed_data = {
      // Redirect về bill.html sau khi thanh toán
      redirecturl: process.env.ZALOPAY_REDIRECT_URL || 'http://localhost:5500/frontend/Page/homepage/bill.html',
      orderId, // Store our order ID in embed_data
    };

    const items = [
      { itemid: orderId, itemname: `Thanh toán MatFlow #${orderId}`, itemprice: amount },
    ];

    const transID = Math.floor(Math.random() * 1000000);
    const app_trans_id = `${moment().format('YYMMDD')}_${transID}`;
    const order: any = {
      app_id: config.app_id,
      app_trans_id,
      app_user: 'user123',
      app_time: Date.now(),
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embed_data),
      amount,
      description: `Thanh toán đơn hàng #${transID}`,
      bank_code: 'zalopayapp',
    };

    const data =
      config.app_id +
      '|' +
      order.app_trans_id +
      '|' +
      order.app_user +
      '|' +
      order.amount +
      '|' +
      order.app_time +
      '|' +
      order.embed_data +
      '|' +
      order.item;

    order.mac = crypto.createHmac('sha256', config.key1).update(data).digest('hex');

    try {
      const response = await firstValueFrom(
        this.httpService.post(config.endpoint, order, {
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      return response.data;
    } catch (error) {
      throw new InternalServerErrorException(error.response?.data || error.message);
    }
  }

  // ================== MoMo IPN Handler ==================
  async handleMomoIPN(body: any) {
    this.logger.log('MoMo IPN received:', JSON.stringify(body));

    const {
      partnerCode,
      orderId: momoOrderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = body;

    // Verify signature
    const secretkey = process.env.MOMO_SECRET_KEY;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    
    const rawSignature =
      `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}` +
      `&message=${message}&orderId=${momoOrderId}&orderInfo=${orderInfo}` +
      `&orderType=${orderType}&partnerCode=${partnerCode}` +
      `&payType=${payType}&requestId=${requestId}` +
      `&responseTime=${responseTime}&resultCode=${resultCode}` +
      `&transId=${transId}`;

    const calculatedSignature = crypto
      .createHmac('sha256', secretkey)
      .update(rawSignature)
      .digest('hex');

    if (calculatedSignature !== signature) {
      this.logger.error('MoMo signature verification failed!');
      return { success: false, message: 'Invalid signature' };
    }

    // Extract our orderId from extraData
    let orderId: string;
    try {
      const decodedData = JSON.parse(Buffer.from(extraData, 'base64').toString());
      orderId = decodedData.orderId;
    } catch (error) {
      this.logger.error('Failed to parse extraData:', error);
      return { success: false, message: 'Invalid extraData' };
    }

    // Handle payment result
    if (resultCode === 0) {
      // Payment successful
      this.logger.log(`MoMo payment successful for order ${orderId}`);
      
      await this.prisma.$transaction(async (tx) => {
        // Update order
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.CONFIRMED, // Auto-confirm for online payment
            isPaid: true,
            paidAmount: amount,
          },
        });

        // Create payment record
        await tx.payment.create({
          data: {
            orderId,
            amount,
            status: PaymentStatus.CONFIRMED,
            method: PaymentMethod.MOMO,
            transactionId: transId.toString(),
            metadata: JSON.stringify(body),
          },
        });
      });

      return { success: true, message: 'Payment confirmed' };
    } else {
      // Payment failed
      this.logger.error(`MoMo payment failed for order ${orderId}: ${message}`);
      
      await this.prisma.payment.create({
        data: {
          orderId,
          amount,
          status: PaymentStatus.FAILED,
          method: PaymentMethod.MOMO,
          transactionId: transId?.toString() || '',
          metadata: JSON.stringify(body),
        },
      });

      return { success: false, message };
    }
  }

  // ================== ZaloPay Callback Handler ==================
  async handleZaloPayCallback(body: any) {
    this.logger.log('ZaloPay callback received:', JSON.stringify(body));

    const { data: dataStr, mac: reqMac } = body;

    // Verify MAC
    const key2 = process.env.ZALOPAY_KEY2;
    const calculatedMac = crypto
      .createHmac('sha256', key2)
      .update(dataStr)
      .digest('hex');

    if (reqMac !== calculatedMac) {
      this.logger.error('ZaloPay MAC verification failed!');
      return { return_code: -1, return_message: 'Invalid MAC' };
    }

    // Parse data
    const dataJson = JSON.parse(dataStr);
    const {
      app_trans_id,
      app_id,
      app_user,
      amount,
      embed_data,
      item,
      zp_trans_id,
      server_time,
    } = dataJson;

    // Extract our orderId from embed_data
    let orderId: string;
    try {
      const embedDataObj = JSON.parse(embed_data);
      orderId = embedDataObj.orderId;
    } catch (error) {
      this.logger.error('Failed to parse embed_data:', error);
      return { return_code: -1, return_message: 'Invalid embed_data' };
    }

    this.logger.log(`ZaloPay payment successful for order ${orderId}`);

    await this.prisma.$transaction(async (tx) => {
      // Update order
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CONFIRMED, // Auto-confirm for online payment
          isPaid: true,
          paidAmount: amount,
        },
      });

      // Create payment record
      await tx.payment.create({
        data: {
          orderId,
          amount,
          status: PaymentStatus.CONFIRMED,
          method: PaymentMethod.ZALOPAY,
          transactionId: zp_trans_id.toString(),
          metadata: JSON.stringify(dataJson),
        },
      });
    });

    return { return_code: 1, return_message: 'success' };
  }

  // ================== Get Payment Status ==================
  async getPaymentStatus(orderId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        code: true,
        status: true,
        isPaid: true,
        paidAmount: true,
        totalAmount: true,
        paymentMethod: true,
      },
    });

    return {
      success: true,
      data: {
        order,
        payments,
      },
    };
  }

  // ================== Manual Confirm Payment (from redirect) ==================
  async confirmPaymentManual(payload: {
    orderId: string;
    transactionId: string;
    method: string;
    amount: number;
    resultCode: number;
  }) {
    this.logger.log(`Manual payment confirmation for order: ${payload.orderId}`);

    try {
      await this.prisma.$transaction(async (tx) => {
        // Update order status to CONFIRMED and mark as paid
        await tx.order.update({
          where: { id: payload.orderId },
          data: {
            status: OrderStatus.CONFIRMED,
            isPaid: true,
            paidAmount: payload.amount,
          },
        });

        // Update or create payment record
        const existingPayment = await tx.payment.findFirst({
          where: {
            orderId: payload.orderId,
            method: payload.method as PaymentMethod,
          },
        });

        if (existingPayment) {
          // Update existing payment
          await tx.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: PaymentStatus.CONFIRMED,
              transactionId: payload.transactionId,
              metadata: JSON.stringify({
                resultCode: payload.resultCode,
                confirmedAt: new Date().toISOString(),
                confirmedVia: 'redirect_callback',
              }),
            },
          });
        } else {
          // Create new payment record
          await tx.payment.create({
            data: {
              orderId: payload.orderId,
              amount: payload.amount,
              status: PaymentStatus.CONFIRMED,
              method: payload.method as PaymentMethod,
              transactionId: payload.transactionId,
              metadata: JSON.stringify({
                resultCode: payload.resultCode,
                confirmedAt: new Date().toISOString(),
                confirmedVia: 'redirect_callback',
              }),
            },
          });
        }
      });

      this.logger.log(`✅ Payment confirmed successfully for order: ${payload.orderId}`);

      return {
        success: true,
        message: 'Payment confirmed successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to confirm payment for order: ${payload.orderId}`, error);
      return {
        success: false,
        message: 'Failed to confirm payment',
        error: error.message,
      };
    }
  }

  // ================== Manual Fail Payment (canceled/expired) ==================
  async failPaymentManual(payload: {
    orderId: string;
    method: string;
    resultCode: number;
    message: string;
  }) {
    this.logger.log(`Manual payment failure for order: ${payload.orderId} - ${payload.message}`);

    try {
      await this.prisma.$transaction(async (tx) => {
        // Update or create payment record as FAILED
        const existingPayment = await tx.payment.findFirst({
          where: {
            orderId: payload.orderId,
            method: payload.method as PaymentMethod,
          },
        });

        if (existingPayment) {
          // Update existing payment
          await tx.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: PaymentStatus.FAILED,
              metadata: JSON.stringify({
                resultCode: payload.resultCode,
                failedAt: new Date().toISOString(),
                failReason: payload.message,
                failedVia: 'redirect_callback',
              }),
            },
          });
        } else {
          // Create new payment record
          await tx.payment.create({
            data: {
              orderId: payload.orderId,
              amount: 0,
              status: PaymentStatus.FAILED,
              method: payload.method as PaymentMethod,
              metadata: JSON.stringify({
                resultCode: payload.resultCode,
                failedAt: new Date().toISOString(),
                failReason: payload.message,
                failedVia: 'redirect_callback',
              }),
            },
          });
        }

        // Critical: Update order status to CANCELLED
        // When online payment fails, the order should be cancelled
        const order = await tx.order.update({
          where: { id: payload.orderId },
          data: {
            status: OrderStatus.CANCELLED,
            isPaid: false,
          },
          include: {
            items: true,
          },
        });

        // Restore Stock: Return products to inventory
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
          this.logger.log(`Restored ${item.quantity} units of product ${item.productId}`);
        }

        this.logger.log(`Order ${payload.orderId} marked as CANCELLED due to failed payment`);
      });

      this.logger.log(`Payment marked as failed for order: ${payload.orderId}`);

      return {
        success: true,
        message: 'Payment marked as failed',
      };
    } catch (error) {
      this.logger.error(`Failed to update payment status for order: ${payload.orderId}`, error);
      return {
        success: false,
        message: 'Failed to update payment status',
        error: error.message,
      };
    }
  }
}
