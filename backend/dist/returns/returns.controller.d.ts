import { ReturnsService } from './returns.service';
export declare class ReturnsController {
    private readonly returnsService;
    constructor(returnsService: ReturnsService);
    listPending(): import(".prisma/client").Prisma.PrismaPromise<({
        order: {
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                username: string;
                password: string;
                fullName: string;
                phone: string | null;
                role: import(".prisma/client").$Enums.UserRole;
                isActive: boolean;
            };
            items: ({
                product: {
                    id: string;
                    createdAt: Date;
                    name: string;
                    updatedAt: Date;
                    isActive: boolean;
                    price: number;
                    slug: string;
                    description: string | null;
                    stock: number;
                    categoryId: string;
                };
            } & {
                id: string;
                orderId: string;
                productId: string;
                quantity: number;
                price: number;
            })[];
        } & {
            id: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            createdAt: Date;
            code: string;
            userId: string;
            totalAmount: number;
            paidAmount: number;
            isPaid: boolean;
            updatedAt: Date;
        };
    } & {
        id: string;
        orderId: string;
        reason: string;
        status: import(".prisma/client").$Enums.ReturnStatus;
        refundAmount: number;
        createdAt: Date;
    })[]>;
    listAll(): import(".prisma/client").Prisma.PrismaPromise<({
        order: {
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string;
                username: string;
                password: string;
                fullName: string;
                phone: string | null;
                role: import(".prisma/client").$Enums.UserRole;
                isActive: boolean;
            };
            items: ({
                product: {
                    id: string;
                    createdAt: Date;
                    name: string;
                    updatedAt: Date;
                    isActive: boolean;
                    price: number;
                    slug: string;
                    description: string | null;
                    stock: number;
                    categoryId: string;
                };
            } & {
                id: string;
                orderId: string;
                productId: string;
                quantity: number;
                price: number;
            })[];
        } & {
            id: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            createdAt: Date;
            code: string;
            userId: string;
            totalAmount: number;
            paidAmount: number;
            isPaid: boolean;
            updatedAt: Date;
        };
    } & {
        id: string;
        orderId: string;
        reason: string;
        status: import(".prisma/client").$Enums.ReturnStatus;
        refundAmount: number;
        createdAt: Date;
    })[]>;
    updateStatus(id: string, status: any): Promise<{
        id: string;
        orderId: string;
        reason: string;
        status: import(".prisma/client").$Enums.ReturnStatus;
        refundAmount: number;
        createdAt: Date;
    }>;
}
