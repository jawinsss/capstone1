import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ContactDto } from './dto/contact.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  async sendContactMessage(contactDto: ContactDto) {
    const { name, email, subject, message } = contactDto;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      throw new Error('Thiếu thông tin bắt buộc.');
    }

    try {
      // Configure SMTP transporter
      const transporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST'),
        port: Number(this.configService.get('SMTP_PORT')) || 587,
        secure: this.configService.get('SMTP_SECURE') === 'true',
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
      });

      // Verify SMTP connection
      await transporter.verify();
      this.logger.log('SMTP connection verified successfully');

      // Send email to admin
      await transporter.sendMail({
        from: this.configService.get('SMTP_FROM') || this.configService.get('SMTP_USER'),
        to: this.configService.get('CONTACT_TO') || this.configService.get('SMTP_USER'),
        replyTo: `${name} <${email}>`,
        subject: `[Form liên hệ] ${subject}`,
        text: `Tin nhắn mới từ form liên hệ:

Tên: ${name}
Email: ${email}

Nội dung:
${message}
`,
      });

      // Send confirmation email to user
      await transporter.sendMail({
        from: this.configService.get('SMTP_FROM') || this.configService.get('SMTP_USER'),
        to: email,
        subject: 'Cảm ơn bạn đã liên hệ với MatFlow',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #20b2aa, #0e8f87); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 24px;">MatFlow</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Cảm ơn bạn đã liên hệ với chúng tôi</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Xin chào <strong>${name}</strong>,</p>
              <p style="margin: 0 0 15px 0; font-size: 16px; color: #333;">Chúng tôi đã nhận được tin nhắn của bạn với tiêu đề: <em>${subject}</em>.</p>
              
              <div style="background: white; padding: 15px; border-left: 4px solid #20b2aa; margin: 15px 0;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">Nội dung bạn gửi:</p>
                <p style="margin: 0; color: #666; line-height: 1.6;">${message}</p>
              </div>
              
              <p style="margin: 15px 0 0 0; font-size: 16px; color: #333;">Đội ngũ hỗ trợ sẽ phản hồi trong thời gian sớm nhất.</p>
            </div>
            
            <div style="text-align: center; padding: 20px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #666; font-size: 14px;">Trân trọng,<br/><strong>MatFlow Support Team</strong></p>
              <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">Đây là tin nhắn tự động, vui lòng không trả lời email này.</p>
            </div>
          </div>
        `,
      });

      this.logger.log(`Contact message sent successfully from ${email}`);
      
      // Create audit log for contact form submission
      try {
        await this.auditService.createAuditLog({
          userId: null, // Contact form can be submitted by anonymous users
          action: 'CREATE',
          resource: 'CONTACT',
          resourceId: `contact-${Date.now()}`, // Generate unique ID
          details: {
            contactName: name,
            contactEmail: email,
            subject: subject,
            messageLength: message.length,
            submissionTime: new Date().toISOString(),
            isAnonymous: true
          },
          ipAddress: null, // Will be set by controller if available
          userAgent: null, // Will be set by controller if available
        });
      } catch (error) {
        console.error('Failed to create audit log for contact form submission:', error);
      }
      
      return { ok: true, message: 'Tin nhắn đã được gửi thành công' };
    } catch (error) {
      this.logger.error('Error sending contact message:', error);
      throw new Error('Không gửi được email. Kiểm tra cấu hình SMTP.');
    }
  }
}
