import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SearchResult {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  category: any;
  score: number;
}

@Injectable()
export class VectorService {
  private readonly logger = new Logger(VectorService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Tìm kiếm sản phẩm liên quan sử dụng Semantic Search nâng cao
   * Kết hợp: Full-Text Search + Keyword Matching + Smart Ranking + Category Diversity
   */
  async searchRelevantProducts(
    query: string,
    limit: number = 5,
  ): Promise<SearchResult[]> {
    try {
      //  Chuẩn hóa query (hỗ trợ tiếng Việt)
      const normalizedQuery = query
        .toLowerCase()
        .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, ' ')
        .trim();

      //  Tách thành keywords (loại bỏ stop words)
      const stopWords = ['của', 'cho', 'và', 'có', 'này', 'được', 'là', 'trong', 'với', 'tôi', 'bạn', 'gì', 'những'];
      const keywords = normalizedQuery
        .split(/\s+/)
        .filter((k) => k.length > 2 && !stopWords.includes(k));

      if (keywords.length === 0) {
        return this.getTopProducts(limit);
      }

      this.logger.log(`🔍 Searching for keywords: ${keywords.join(', ')}`);

      // 🚀 Tìm kiếm RỘNG hơn để có kết quả đa dạng (lấy 3x limit)
      const products = await this.prisma.product.findMany({
        where: {
          isActive: true,
          //  Ensure product has valid category
          category: {
            isActive: true, // Category must be active
          },
          OR: [
            {
              name: {
                contains: normalizedQuery,
                mode: 'insensitive' as const,
              },
            },
            {
              description: {
                contains: normalizedQuery,
                mode: 'insensitive' as const,
              },
            },
            {
              category: {
                name: {
                  contains: normalizedQuery,
                  mode: 'insensitive' as const,
                },
              },
            },
            // Tìm theo từng keyword
            ...keywords.map((keyword) => ({
              name: {
                contains: keyword,
                mode: 'insensitive' as const,
              },
            })),
          ],
        },
        include: {
          category: true,
        },
        take: limit * 3, // 🚀 Lấy nhiều hơn để đa dạng hóa (3x thay vì 2x)
      });

      //  SEMANTIC SCORING - Tính relevance score thông minh
      const scoredProducts = products.map((product) => {
        let score = 0;
        const productName = product.name.toLowerCase();
        const productDesc = product.description?.toLowerCase() || '';
        const categoryName = product.category?.name.toLowerCase() || '';

        // 1. 🔥 Exact match (quan trọng nhất) - Nhiều cấp độ
        if (productName === normalizedQuery) {
          score += 150; // Perfect exact match
        } else if (productName.includes(normalizedQuery)) {
          score += 80; // Contains full query in name
        } else if (normalizedQuery.includes(productName.substring(0, Math.min(10, productName.length)))) {
          score += 60; // Query contains product name start
        }

        // 2.  Category match
        if (categoryName.includes(normalizedQuery)) {
          score += 30; // Category relevant
        }

        // 3.  Description match
        if (productDesc.includes(normalizedQuery)) {
          score += 15; // Found in description
        }

        // 4.  Keyword scoring (multiple keywords)
        keywords.forEach((keyword) => {
          // Name match là quan trọng nhất
          if (productName.includes(keyword)) {
            score += 20;
            // Bonus nếu keyword ở đầu tên
            if (productName.startsWith(keyword)) {
              score += 10;
            }
          }
          // Category match
          if (categoryName.includes(keyword)) {
            score += 10;
          }
          // Description match
          if (productDesc.includes(keyword)) {
            score += 5;
          }
        });

        // 5.  Business logic bonuses
        if (product.stock > 0) {
          score += 15; // Ưu tiên sản phẩm còn hàng
        }
        if (product.stock > 50) {
          score += 5; // Bonus cho sản phẩm có nhiều tồn kho
        }

        // 6.  Penalty cho sản phẩm hết hàng
        if (product.stock === 0) {
          score = score * 0.3; // Giảm 70% điểm nếu hết hàng
        }

        return {
          ...product,
          score: Math.round(score),
        };
      });

      // 🎯 ĐA DẠNG HÓA CATEGORY - Đảm bảo có sản phẩm từ nhiều danh mục
      const sortedProducts = scoredProducts.sort((a, b) => b.score - a.score);
      
      const diversifiedResults: typeof scoredProducts = [];
      const categoriesUsed = new Set<string>();
      const maxPerCategory = Math.ceil(limit / 2); // Tối đa 50% sản phẩm từ 1 category
      const categoryCount = new Map<string, number>();
      
      // Pass 1: Lấy sản phẩm có score cao từ các category khác nhau
      for (const product of sortedProducts) {
        const categoryId = product.categoryId;
        const currentCount = categoryCount.get(categoryId) || 0;
        
        if (diversifiedResults.length >= limit) break;
        
        // Ưu tiên category mới, hoặc category chưa đủ quota
        if (!categoriesUsed.has(categoryId) || currentCount < maxPerCategory) {
          diversifiedResults.push(product);
          categoriesUsed.add(categoryId);
          categoryCount.set(categoryId, currentCount + 1);
        }
      }
      
      // Pass 2: Nếu chưa đủ limit, thêm các sản phẩm còn lại (theo score)
      if (diversifiedResults.length < limit) {
        for (const product of sortedProducts) {
          if (diversifiedResults.length >= limit) break;
          if (!diversifiedResults.includes(product)) {
            diversifiedResults.push(product);
          }
        }
      }
      
      const topResults = diversifiedResults.slice(0, limit);
      const categoryNames = [...new Set(topResults.map(p => p.category?.name))];
      
      this.logger.log(
        `✅ Found ${topResults.length} products from ${categoryNames.length} categories: ${categoryNames.join(', ')}`,
      );
      this.logger.log(
        `📊 Scores: ${topResults.map((p) => p.score).join(', ')}`,
      );

      return topResults;
    } catch (error) {
      this.logger.error('Search error:', error);
      return this.getTopProducts(limit);
    }
  }

  private async getTopProducts(limit: number): Promise<SearchResult[]> {
    // Fallback: trả về sản phẩm phổ biến nhất (nhiều tồn kho, mới)
    this.logger.log('Using fallback: returning top products by stock and recency');
    
    const products = await this.prisma.product.findMany({
      where: { 
        isActive: true, 
        stock: { gt: 0 },
        //  Ensure product has valid category
        category: {
          isActive: true,
        },
      },
      include: { category: true },
      orderBy: [
        { stock: 'desc' as const }, // Ưu tiên sản phẩm có nhiều hàng
        { createdAt: 'desc' as const }, // Sản phẩm mới
      ],
      take: limit,
    });

    return products.map((p) => ({ ...p, score: 5 })); // Score thấp để biểu thị kết quả fallback
  }
  
  /**
   * Tìm sản phẩm tương tự khi không tìm thấy sản phẩm chính xác
   */
  async findSimilarProducts(
    categoryName: string,
    limit: number = 5,
  ): Promise<SearchResult[]> {
    try {
      this.logger.log(`Finding similar products in category: ${categoryName}`);
      
      const products = await this.prisma.product.findMany({
        where: {
          isActive: true,
          category: {
            isActive: true, //  Category must be active
            name: {
              contains: categoryName,
              mode: 'insensitive' as const,
            },
          },
        },
        include: { category: true },
        orderBy: [
          { stock: 'desc' as const },
          { createdAt: 'desc' as const },
        ],
        take: limit,
      });

      return products.map((p) => ({
        ...p,
        score: 10, // Score trung bình cho sản phẩm tương tự
      }));
    } catch (error) {
      this.logger.error('Find similar products error:', error);
      return [];
    }
  }
}

