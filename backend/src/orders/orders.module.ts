import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderAutomationService } from './order-automation.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [OrdersService, OrderAutomationService],
  controllers: [OrdersController],
  exports: [OrdersService, OrderAutomationService],
})
export class OrdersModule {}


