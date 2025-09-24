import { PrismaService } from '../prisma/prisma.service';
export declare class ReviewsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(): import(".prisma/client").Prisma.PrismaPromise<({
        product: {
            id: string;
            name: string;
        };
        user: {
            id: string;
            username: string;
            fullName: string;
        };
    } & {
        id: string;
        productId: string;
        userId: string;
        rating: number;
        content: string;
        status: import(".prisma/client").$Enums.ReviewStatus;
        createdAt: Date;
    })[]>;
    listByProduct(productId: string): import(".prisma/client").Prisma.PrismaPromise<({
        user: {
            id: string;
            username: string;
            fullName: string;
        };
    } & {
        id: string;
        productId: string;
        userId: string;
        rating: number;
        content: string;
        status: import(".prisma/client").$Enums.ReviewStatus;
        createdAt: Date;
    })[]>;
    create(userId: string, payload: {
        productId: string;
        rating: number;
        content: string;
    }): Promise<{
        id: string;
        productId: string;
        userId: string;
        rating: number;
        content: string;
        status: import(".prisma/client").$Enums.ReviewStatus;
        createdAt: Date;
    }>;
    updateStatus(id: string, status: 'PUBLISHED' | 'HIDDEN'): Promise<{
        id: string;
        productId: string;
        userId: string;
        rating: number;
        content: string;
        status: import(".prisma/client").$Enums.ReviewStatus;
        createdAt: Date;
    }>;
}
