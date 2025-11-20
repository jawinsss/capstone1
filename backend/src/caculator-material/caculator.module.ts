import { Module } from '@nestjs/common';
import { CalculatorController } from './caculator.controller';
import { CalculatorService } from './caculator.service';
import { LlmModule } from '../llm/llm.module';
import { VectorModule } from '../vector/vector.module';
import { ChatbotModule } from '../chatbot/chatbot.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [LlmModule, VectorModule, PrismaModule, ChatbotModule],
  controllers: [CalculatorController],
  providers: [CalculatorService],
  exports: [CalculatorService],
})
export class CalculatorModule {}
