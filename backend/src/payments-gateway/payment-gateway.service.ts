// src/payment-gateway/payment-gateway.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as https from 'https';
import * as moment from 'moment';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class PaymentGatewayService {
  constructor(private readonly httpService: HttpService) {}

  // ================== MoMo ==================
  async createMomoPayment(amount: number) {
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretkey = process.env.MOMO_SECRET_KEY;
    const requestId = partnerCode + new Date().getTime();
    const orderId = requestId;
    const orderInfo = 'Thanh toán đơn hàng MatFlow';
    const redirectUrl = process.env.MOMO_REDIRECT_URL;
    const ipnUrl = process.env.MOMO_IPN_URL;
    const requestType = 'captureWallet';
    const extraData = '';

    const rawSignature =
      `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}` +
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
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      requestType,
      extraData,
      signature,
      lang: 'vi',
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
  async createZaloPayPayment(amount: number) {
    const config = {
      app_id: process.env.ZALOPAY_APP_ID,
      key1: process.env.ZALOPAY_KEY1,
      endpoint: process.env.ZALOPAY_ENDPOINT,
    };

    const embed_data = {
      redirecturl: process.env.ZALOPAY_REDIRECT_URL,
    };

    const items = [
      { itemid: 'matflow', itemname: 'Thanh toán MatFlow', itemprice: amount },
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
}
