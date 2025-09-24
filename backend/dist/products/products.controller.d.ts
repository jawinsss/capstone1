import { ProductsService, CreateProductDto, UpdateProductDto } from './products.service';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    findAll(query: any): Promise<{
        items: ({
            category: {
                id: string;
                name: string;
                slug: string;
                description: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                parentId: string | null;
            };
            images: {
                id: string;
                url: string;
                alt: string | null;
                order: number;
                productId: string;
            }[];
        } & {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            price: number;
            stock: number;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string;
        })[];
        total: number;
        page: number;
        take: number;
        pages: number;
    }>;
    findOne(id: string): Promise<{
        category: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            parentId: string | null;
        };
        images: {
            id: string;
            url: string;
            alt: string | null;
            order: number;
            productId: string;
        }[];
    } & {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        price: number;
        stock: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
    }>;
    create(dto: CreateProductDto): Promise<{
        category: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            parentId: string | null;
        };
        images: {
            id: string;
            url: string;
            alt: string | null;
            order: number;
            productId: string;
        }[];
    } & {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        price: number;
        stock: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
    }>;
    update(id: string, dto: UpdateProductDto): Promise<{
        category: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            parentId: string | null;
        };
        images: {
            id: string;
            url: string;
            alt: string | null;
            order: number;
            productId: string;
        }[];
    } & {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        price: number;
        stock: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        slug: string;
        description: string | null;
        price: number;
        stock: number;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
    }>;
}
