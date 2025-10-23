import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Get all payments with filters
   */
  @Get()
  @ApiQuery({ name: 'method', required: false, enum: PaymentMethod })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  list(@Query() query: any) {
    const filters: any = {};

    if (query.method) {
      filters.method = query.method;
    }

    if (query.status) {
      filters.status = query.status;
    }

    if (query.startDate) {
      filters.startDate = new Date(query.startDate);
    }

    if (query.endDate) {
      filters.endDate = new Date(query.endDate);
    }

    if (query.search) {
      filters.search = query.search;
    }

    return this.paymentsService.list(filters);
  }

  /**
   * Get payment statistics
   */
  @Get('stats')
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  getStats(@Query() query: any) {
    const filters: any = {};

    if (query.startDate) {
      filters.startDate = new Date(query.startDate);
    }

    if (query.endDate) {
      filters.endDate = new Date(query.endDate);
    }

    return this.paymentsService.getStats(filters);
  }

  /**
   * Get pending COD payments
   */
  @Get('pending-cod')
  getPendingCOD() {
    return this.paymentsService.getPendingCODPayments();
  }

  /**
   * Get payment by ID
   */
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.paymentsService.getById(id);
  }

  /**
   * Confirm COD payment (manual by admin)
   */
  @Patch(':id/confirm')
  confirmCOD(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user?.id || 'system';
    return this.paymentsService.confirmCODPayment(id, adminId);
  }
}
