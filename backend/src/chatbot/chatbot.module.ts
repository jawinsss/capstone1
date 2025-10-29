import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ToolsService } from './tools.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmModule } from '../llm/llm.module';
import { VectorModule } from '../vector/vector.module';
import { ContactModule } from '../contact/contact.module';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PrismaModule,
    LlmModule,
    VectorModule,
    ContactModule,
    OrdersModule,
    UsersModule,
  ],
  providers: [ChatbotService, ToolsService],
  controllers: [ChatbotController],
  exports: [ChatbotService, ToolsService],
})
export class ChatbotModule {}

