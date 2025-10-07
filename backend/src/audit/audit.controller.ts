import { Controller, Get, Post, Body, Query, UseGuards, Req, Param } from '@nestjs/common';
import { AuditService } from './audit.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { GetAuditLogsDto } from './dto/get-audit-logs.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  create(@Body() createAuditLogDto: CreateAuditLogDto) {
    return this.auditService.createAuditLog(createAuditLogDto);
  }

  @Get()
  findAll(@Query() query: GetAuditLogsDto) {
    return this.auditService.getAuditLogs(query);
  }

  @Get('stats')
  getStats() {
    return this.auditService.getAuditStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditService.getAuditLogById(id);
  }
}
