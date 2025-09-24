import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
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
    updateStatus(id: string, status: any): Promise<{
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
    createOrder(body: any): Promise<{
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
