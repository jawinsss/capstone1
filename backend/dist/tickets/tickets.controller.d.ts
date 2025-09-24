import { TicketsService } from './tickets.service';
export declare class TicketsController {
    private readonly ticketsService;
    constructor(ticketsService: TicketsService);
    list(type?: string): import(".prisma/client").Prisma.PrismaPromise<({
        user: {
            id: string;
            createdAt: Date;
            email: string;
            username: string;
            password: string;
            fullName: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            isActive: boolean;
            updatedAt: Date;
        };
    } & {
        id: string;
        userId: string;
        subject: string;
        content: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        createdAt: Date;
    })[]>;
    listOpen(): import(".prisma/client").Prisma.PrismaPromise<({
        user: {
            id: string;
            createdAt: Date;
            email: string;
            username: string;
            password: string;
            fullName: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            isActive: boolean;
            updatedAt: Date;
        };
    } & {
        id: string;
        userId: string;
        subject: string;
        content: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        createdAt: Date;
    })[]>;
    updateStatus(id: string, status: any): Promise<{
        id: string;
        userId: string;
        subject: string;
        content: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        createdAt: Date;
    }>;
}
