import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReturnsService } from './returns.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('returns')
@Controller('returns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.returnsService.list(status);
  }

  /**
   * Get return request statistics
   * GET /returns/stats
   */
  @Get('stats')
  getStats() {
    return this.returnsService.getStats();
  }

  /**
   * Get single return request by ID
   * GET /returns/:id
   */
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.returnsService.getById(id);
  }

  /**
   * Approve return request
   * POST /returns/:id/approve
   */
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() body?: { adminNote?: string }) {
    return this.returnsService.approve(id, body?.adminNote);
  }

  /**
   * Reject return request
   * POST /returns/:id/reject
   */
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() body?: { adminNote?: string }) {
    return this.returnsService.reject(id, body?.adminNote);
  }
}


