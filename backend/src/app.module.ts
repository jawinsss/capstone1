import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthController } from './health/health.controller';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OrdersModule } from './orders/orders.module';
import { ReturnsModule } from './returns/returns.module';
import { TicketsModule } from './tickets/tickets.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ContactModule } from './contact/contact.module';
import { LocationsModule } from './locations/locations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { PaymentsModule } from './payments/payments.module';
import { PaymentGatewayModule } from './payments-gateway/payment-gateway.module';
import { ReportsModule } from './reports/reports.module';
import { ChatbotModule } from './chatbot/chatbot.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    DashboardModule,
    OrdersModule,
    ReturnsModule,
    TicketsModule,
    ReviewsModule,
    ContactModule,
    LocationsModule,
    NotificationsModule,
    AuditModule,
    PaymentsModule,
    PaymentGatewayModule,
    ReportsModule,
    ChatbotModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
