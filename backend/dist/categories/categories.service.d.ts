import { PrismaService } from '../prisma/prisma.service';
export interface CreateCategoryDto {
    name: string;
    description?: string;
}
export declare class CategoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        slug: string;
        parentId: string | null;
    }[]>;
    create(dto: CreateCategoryDto): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        slug: string;
        parentId: string | null;
    }>;
    private generateUniqueSlug;
}
