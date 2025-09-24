import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    overview(): Promise<{
        gmv: number;
        pendingOrders: number;
        pendingProducts: number;
        openTickets: number;
    }>;
    revenue7d(): Promise<{
        date: string;
        amount: number;
    }[]>;
    revenue(range?: 'day' | 'week' | 'month'): Promise<{
        key: string;
        amount: number;
    }[]>;
}
