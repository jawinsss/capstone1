import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReturnsService } from './returns.service';
import { ReturnsController } from './returns.controller';

@Module({
  imports: [PrismaModule],
  providers: [ReturnsService],
  controllers: [ReturnsController],
})
export class ReturnsModule {}


