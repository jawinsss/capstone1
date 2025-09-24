import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
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
    create(body: any, req: any): Promise<{
        id: string;
        productId: string;
        userId: string;
        rating: number;
        content: string;
        status: import(".prisma/client").$Enums.ReviewStatus;
        createdAt: Date;
    }>;
    updateStatus(id: string, status: any): Promise<{
        id: string;
        productId: string;
        userId: string;
        rating: number;
        content: string;
        status: import(".prisma/client").$Enums.ReviewStatus;
        createdAt: Date;
    }>;
}
