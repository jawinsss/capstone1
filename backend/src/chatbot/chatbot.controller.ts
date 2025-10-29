import { Controller, Post, Get, Body, Query, Delete, Param, Put, UseGuards, Request } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ChatRequestDto {
  @ApiProperty({ description: 'Tin nhắn từ người dùng', example: 'Tư vấn xi măng cho tôi' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'ID cuộc hội thoại', required: false })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiProperty({ description: 'User ID (nếu đã đăng nhập)', required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ description: 'Session ID (cho guest user)', required: false })
  @IsString()
  @IsOptional()
  sessionId?: string;
}

export class UpdateConversationDto {
  @ApiProperty({ description: 'Tiêu đề cuộc hội thoại' })
  @IsString()
  @IsNotEmpty()
  title: string;
}

@ApiTags('Chatbot')
@Controller('api/chatbot')
export class ChatbotController {
  constructor(private chatbotService: ChatbotService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Gửi tin nhắn đến chatbot' })
  @ApiResponse({ status: 200, description: 'Trả về câu trả lời từ AI' })
  async chat(@Body() body: ChatRequestDto) {
    return this.chatbotService.chat(
      body.message,
      body.conversationId,
      body.userId,
      body.sessionId,
    );
  }

  @Get('status')
  @ApiOperation({ summary: 'Kiểm tra trạng thái chatbot' })
  async getStatus() {
    return this.chatbotService.getSystemStatus();
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Lấy danh sách cuộc hội thoại của user' })
  @ApiResponse({ status: 200, description: 'Danh sách conversations' })
  async getUserConversations(
    @Query('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.chatbotService.getUserConversations(userId, limit);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Lấy chi tiết một cuộc hội thoại' })
  @ApiResponse({ status: 200, description: 'Chi tiết conversation và messages' })
  async getConversation(
    @Param('id') conversationId: string,
    @Query('userId') userId?: string,
  ) {
    return this.chatbotService.getConversationById(conversationId, userId);
  }

  @Put('conversations/:id')
  @ApiOperation({ summary: 'Cập nhật tiêu đề cuộc hội thoại' })
  @ApiResponse({ status: 200, description: 'Conversation updated' })
  async updateConversation(
    @Param('id') conversationId: string,
    @Body() body: UpdateConversationDto,
    @Query('userId') userId?: string,
  ) {
    return this.chatbotService.updateConversationTitle(
      conversationId,
      body.title,
      userId,
    );
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Xóa cuộc hội thoại' })
  @ApiResponse({ status: 200, description: 'Conversation deleted' })
  async deleteConversation(
    @Param('id') conversationId: string,
    @Query('userId') userId?: string,
  ) {
    await this.chatbotService.deleteConversation(conversationId, userId);
    return { message: 'Conversation deleted successfully' };
  }

  @Delete('conversation')
  @ApiOperation({ summary: 'Xóa lịch sử hội thoại (deprecated, dùng DELETE /conversations/:id)' })
  async clearConversation(@Query('id') conversationId: string) {
    await this.chatbotService.clearConversation(conversationId);
    return { message: 'Conversation cleared' };
  }
}

