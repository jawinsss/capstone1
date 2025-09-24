import { PrismaService } from '../prisma/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getOverview(): Promise<{
        gmv: number;
        pendingOrders: number;
        pendingProducts: number;
        openTickets: number;
    }>;
    revenueLast7Days(): Promise<{
        date: string;
        amount: number;
    }[]>;
    revenueByRange(range?: 'day' | 'week' | 'month'): Promise<{
        key: string;
        amount: number;
    }[]>;
}
