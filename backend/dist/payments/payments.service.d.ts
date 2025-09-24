import { PrismaService } from '../prisma/prisma.service';
export declare class PaymentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listPending(): import(".prisma/client").Prisma.PrismaPromise<({
        order: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.OrderStatus;
            code: string;
            userId: string;
            totalAmount: number;
            paidAmount: number;
            isPaid: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        amount: number;
        orderId: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
    })[]>;
    confirm(id: string): Promise<{
        id: string;
        createdAt: Date;
        amount: number;
        orderId: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
    }>;
}
