import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { GetAuditLogsDto } from './dto/get-audit-logs.dto';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async createAuditLog(createAuditLogDto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        userId: createAuditLogDto.userId,
        action: createAuditLogDto.action,
        resource: createAuditLogDto.resource,
        resourceId: createAuditLogDto.resourceId,
        details: createAuditLogDto.details,
        ipAddress: createAuditLogDto.ipAddress,
        userAgent: createAuditLogDto.userAgent,
        timestamp: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async getAuditLogs(query: GetAuditLogsDto) {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      resource,
      startDate,
      endDate,
      search,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (resource) {
      where.resource = resource;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: auditLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAuditStats() {
    const [
      totalLogs,
      todayLogs,
      actionStats,
      resourceStats,
      userStats,
    ] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({
        where: {
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 5,
      }),
      this.prisma.auditLog.groupBy({
        by: ['resource'],
        _count: { resource: true },
        orderBy: { _count: { resource: 'desc' } },
        take: 5,
      }),
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        _count: { userId: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 5,
      }),
    ]);

    return {
      totalLogs,
      todayLogs,
      actionStats: actionStats.map(stat => ({
        action: stat.action,
        count: stat._count.action,
      })),
      resourceStats: resourceStats.map(stat => ({
        resource: stat.resource,
        count: stat._count.resource,
      })),
      userStats: userStats.map(stat => ({
        userId: stat.userId,
        count: stat._count.userId,
      })),
    };
  }

  async getAuditLogById(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}
