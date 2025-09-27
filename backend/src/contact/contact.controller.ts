import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactDto } from './dto/contact.dto';

@Controller('api/contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async sendContactMessage(@Body() contactDto: ContactDto) {
    try {
      const result = await this.contactService.sendContactMessage(contactDto);
      return result;
    } catch (error) {
      throw new HttpException(
        {
          error: error.message || 'Không gửi được email. Kiểm tra cấu hình SMTP.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
