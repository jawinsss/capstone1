import { PrismaService } from '../prisma/prisma.service';
export declare class TicketsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    updateStatus(id: string, status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED'): Promise<{
        id: string;
        userId: string;
        subject: string;
        content: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        createdAt: Date;
    }>;
}
