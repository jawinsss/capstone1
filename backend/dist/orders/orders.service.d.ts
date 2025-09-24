import { PrismaService } from '../prisma/prisma.service';
export declare class OrdersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(): import(".prisma/client").Prisma.PrismaPromise<({
        user: {
            id: string;
            email: string;
            username: string;
            password: string;
            fullName: string;
            phone: string | null;
            role: import(".prisma/client").$Enums.UserRole;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        items: ({
            product: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                slug: string;
                price: number;
                stock: number;
                categoryId: string;
            };
        } & {
            id: string;
            price: number;
            productId: string;
            orderId: string;
            quantity: number;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        code: string;
        userId: string;
        totalAmount: number;
        paidAmount: number;
        isPaid: boolean;
    })[]>;
    updateStatus(id: string, status: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED'): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        code: string;
        userId: string;
        totalAmount: number;
        paidAmount: number;
        isPaid: boolean;
    }>;
    create(payload: any): Promise<{
        items: {
            id: string;
            price: number;
            productId: string;
            orderId: string;
            quantity: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        code: string;
        userId: string;
        totalAmount: number;
        paidAmount: number;
        isPaid: boolean;
    }>;
}
