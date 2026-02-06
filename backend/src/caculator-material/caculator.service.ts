import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { VectorService } from '../vector/vector.service';

import {
  MaterialCalculatorRequestDto,
  MaterialType,
} from './dto/material-calculator-request.dto';

import {
  MaterialCalculatorResponseDto,
} from './dto/material-calculator-response.dto';

import { MaterialCalcFormDto } from './dto/material-calc-form.dto';

@Injectable()
export class CalculatorService {
  private readonly logger = new Logger(CalculatorService.name);

  constructor(
    private readonly llm: LlmService,
    private readonly vector: VectorService,
    private readonly prisma: PrismaService,
  ) { }

  // Natural Language Calculation
  async calculateMaterials(
    payload: MaterialCalculatorRequestDto,
  ): Promise<MaterialCalculatorResponseDto> {
    const { question, length } = payload;

    const parsePrompt = `
      Phân tích câu hỏi sau và trả về JSON:
      {
        "type": "water_pipe | electrical | steel | general",
        "floors": number | null,
        "length": number | null,
        "powerHP": number | null,
        "notes": string[]
      }
      Câu hỏi: "${question}"
    `;

    let aiParsed: any = {};
    try {
      const result = await this.llm.generateResponse(parsePrompt, '');
      aiParsed = JSON.parse(result);
    } catch {
      aiParsed = { type: MaterialType.GENERAL, length, notes: [] };
    }

    const type: MaterialType =
      (aiParsed.type as MaterialType) || MaterialType.GENERAL;

    // Apply business rules
    const ruleResult = await this.applyRules(type, {
      ...aiParsed,
      question,
    });

    // Vector search (IDs only)
    const vectorResults = await this.vector.searchRelevantProducts(
      ruleResult.searchQuery,
      20,
    );

    const ids = vectorResults.map((p: any) => p.id);

    // Fetch product details including images
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        category: true,
        images: { orderBy: { order: 'asc' } },
      },
    });

    const explanationPrompt = `Người dùng hỏi: "${question}". Hãy giải thích ngắn gọn và dễ hiểu.`;
    const aiExplanation = await this.llm.generateResponse(explanationPrompt, '');

    return {
      aiExplanation,
      suggestions: products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category?.name,
        specs: {},
        estimatedQuantity: ruleResult.estimatedQuantity,
        reasoning: ruleResult.reasoning,
        images:
          p.images?.map((img) => ({
            url: img.url.startsWith('/assets')
              ? img.url
              : img.url.startsWith('/')
                ? img.url
                : `/uploads/${img.url}`,
          })) || [],
        price: p.price,
        stock: p.stock,
      })),
      notes: ruleResult.notes,
    };
  }

  // Category Specifications
  async getCategorySpecifications(categoryId: string) {
    if (!categoryId) {
      return { success: false, message: 'categoryId is required' };
    }

    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { parent: true, children: true },
    });

    if (!category) {
      return { success: false, message: 'Category not found' };
    }

    /** Load specs */
    let requiredSpecifications: string[] =
      this.getDefaultSpecsForCategory(category.name);

    if (category.children?.length > 0) {
      requiredSpecifications = this.getDefaultSpecsForCategory(
        category.children[0].name,
      );
    }

    /** Load products */
    const subCategories = category.children?.map((c) => c.id) || [];
    const categoryIds =
      subCategories.length > 0 ? [category.id, ...subCategories] : [category.id];

    const products = await this.prisma.product.findMany({
      where: { categoryId: { in: categoryIds }, isActive: true },
      include: { images: true },
      take: 50,
    });

    return {
      success: true,
      data: {
        categoryId: category.id,
        categoryName: category.name,
        requiredSpecifications,
        totalProducts: products.length,
        sampleProducts: products.slice(0, 8).map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          stock: p.stock,
          images:
            p.images?.map((img) => ({
              url: img.url.startsWith('/assets')
                ? img.url
                : img.url.startsWith('/')
                  ? img.url
                  : `/uploads/${img.url}`,
            })) || [],
        })),
      },
    };
  }

  // Form Calculation with AI Analysis
  async calculateFromForm(payload: MaterialCalcFormDto) {
    this.logger.log('=== CALCULATOR FORM REQUEST ===');
    this.logger.log(`Payload: ${JSON.stringify(payload)}`);

    const {
      subCategoryId,
      productType,
      quantity, // Number of products user wants to see
    } = payload;

    // Get user requested quantity (default 5, max 20)
    const requestedQuantity = Math.min(Math.max(quantity || 5, 1), 20);

    this.logger.log(`User requested ${requestedQuantity} products`);

    /** Build comprehensive search query from ALL user inputs */
    const parts: string[] = [];

    // Prioritize productType/Subcategory for AI analysis
    // User wants AI to analyze from subcategory, not main category
    if (productType) {
      parts.push(productType);
      this.logger.log(`AI will analyze from productType: ${productType}`);
    } else if (subCategoryId) {
      // Fallback: get subcategory name if productType not provided
      const subCat = await this.prisma.category.findUnique({
        where: { id: subCategoryId },
      });
      if (subCat) {
        parts.push(subCat.name);
        this.logger.log(`AI will analyze from subcategory: ${subCat.name}`);
      }
    }

    // Add all specs (these are the most important for matching)
    const specs = (payload as any).specs || {};
    Object.entries(specs).forEach(([key, val]) => {
      if (val) parts.push(`${key} ${val}`);
    });

    const searchQuery = parts.join(' ');
    this.logger.log(`🔍 Search query: "${searchQuery}"`);
    this.logger.log(`📋 Specs: ${JSON.stringify(specs)}`);

    // Step 1: Broad search to get candidates for AI analysis
    let candidateProducts: any[] = [];

    try {
      // Vector search with higher limit to get diverse candidates
      this.logger.log('🔍 Starting vector search...');
      const vectorResults = await this.vector.searchRelevantProducts(
        searchQuery,
        50, // Get top 50 candidates for AI to analyze
      );

      this.logger.log(`Vector search returned ${vectorResults.length} results`);

      if (vectorResults.length > 0) {
        const ids = vectorResults.map((v) => v.id);
        candidateProducts = await this.prisma.product.findMany({
          where: { id: { in: ids }, isActive: true },
          include: { category: true, images: true },
        });
        this.logger.log(`Vector search found ${candidateProducts.length} active products`);
      }
    } catch (err) {
      this.logger.error('Vector search failed:', err);
    }

    // Step 2: Fallback if vector search returns few results
    if (candidateProducts.length < 20) {
      this.logger.log(`📦 Expanding search with category fallback (current: ${candidateProducts.length})`);

      // Get products from the selected category and related categories
      let categoryIds: string[] = [];

      if (subCategoryId) {
        const sub = await this.prisma.category.findUnique({
          where: { id: subCategoryId },
          include: { children: true, parent: true },
        });

        if (sub) {
          categoryIds = sub.children?.length
            ? [sub.id, ...sub.children.map((c) => c.id)]
            : sub.parentId
              ? [sub.id, sub.parentId]
              : [sub.id];

          this.logger.log(`Category IDs for fallback: ${categoryIds.join(', ')}`);
        }
      }

      // Get additional products from categories
      if (categoryIds.length > 0) {
        const categoryProducts = await this.prisma.product.findMany({
          where: {
            categoryId: { in: categoryIds },
            isActive: true,
            id: { notIn: candidateProducts.map(p => p.id) } // Don't duplicate
          },
          include: { category: true, images: true },
          take: 30,
        });

        candidateProducts = [...candidateProducts, ...categoryProducts];
        this.logger.log(`Added ${categoryProducts.length} from categories, total: ${candidateProducts.length}`);
      } else {
        this.logger.warn('No category IDs available for fallback');
      }
    }

    // Step 3: AI Deep Analysis
    let results: any[] = [];
    let aiSummary = '';

    this.logger.log(`🤖 Preparing AI analysis with ${candidateProducts.length} candidates`);

    if (candidateProducts.length > 0) {
      try {
        this.logger.log(`Sending ${candidateProducts.length} candidates to AI for deep analysis`);

        const aiAnalysis = await this.analyzeProductsWithAI(
          candidateProducts,
          payload,
          specs,
          requestedQuantity, // Tell AI how many to return
        );

        results = aiAnalysis.products;
        aiSummary = aiAnalysis.summary;

        this.logger.log(`AI returned ${results.length} products after deep analysis`);
      } catch (aiError) {
        // Fallback to basic results if AI fails
        this.logger.error('AI analysis failed, using basic results:', aiError);

        // Take top results based on vector score
        results = candidateProducts
          .slice(0, requestedQuantity)
          .map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            stock: p.stock,
            category: p.category?.name,
            calculatedQuantity: 1,
            relevanceScore: 50,
            aiReasoning: 'Kết quả tìm kiếm cơ bản (AI analysis failed)',
            matchedAttributes: [],
            images: p.images.map((img: any) => ({
              url: img.url.startsWith('/assets')
                ? img.url
                : img.url.startsWith('/')
                  ? img.url
                  : `/uploads/${img.url}`,
            })),
          }));
        aiSummary = `Đã tìm thấy ${results.length} sản phẩm phù hợp.`;
      }
    } else {
      this.logger.warn('No candidate products to analyze!');
    }

    this.logger.log(`📊 FINAL RESULTS: ${results.length} products`);

    return {
      success: true,
      totalProducts: results.length,
      results,
      aiSummary,
    };
  }

  // AI-Powered Product Analysis
  private async analyzeProductsWithAI(
    products: any[],
    userInput: MaterialCalcFormDto,
    userSpecs: Record<string, any>,
    requestedQuantity: number = 5,
  ) {
    const {
      productType,
      categoryId,
      subCategoryId,
    } = userInput;

    // Build user requirements description
    const requirements: string[] = [];
    if (productType) requirements.push(`Loại sản phẩm: ${productType}`);
    requirements.push(`Số lượng sản phẩm cần: ${requestedQuantity}`);

    // Add user specifications
    Object.entries(userSpecs).forEach(([key, value]) => {
      if (value) requirements.push(`${key}: ${value}`);
    });

    // Build product list for AI - include MORE products for better selection
    const maxProductsToAnalyze = Math.min(products.length, 50);
    const productList = products
      .slice(0, maxProductsToAnalyze)
      .map(
        (p, idx) => `
${idx + 1}. ID: ${p.id}
   Tên: ${p.name}
   **Mô tả chi tiết: ${p.description || 'Không có mô tả'}**
   Giá: ${p.price.toLocaleString()}đ
   Tồn kho: ${p.stock}
   Danh mục: ${p.category?.name || 'N/A'}`,
      )
      .join('\n\n');

    const prompt = `Bạn là chuyên gia vật liệu xây dựng với khả năng phân tích sâu. Hãy ĐÓNG VAI TRÒ TƯ VẤN VIÊN cho khách hàng.

YÊU CẦU CỦA KHÁCH HÀNG:
${requirements.join('\n')}

DANH SÁCH ${maxProductsToAnalyze} SẢN PHẨM CÓ SẴN:
${productList}

📋 NHIỆM VỤ QUAN TRỌNG:

1. **ĐỌC KỸ LƯỠNG phần "Mô tả chi tiết"** của TỪNG sản phẩm
   - Xác định size/kích thước từ mô tả
   - Xác định màu sắc, chất liệu, công dụng từ mô tả
   - Xác định các thông số kỹ thuật từ mô tả
   
2. **SO KHỚP CHÍNH XÁC** với yêu cầu khách hàng:
   - Nếu khách yêu cầu "size: xl" → tìm trong mô tả có "XL", "Extra Large", "size lớn"
   - Nếu khách yêu cầu "color: vàng" → tìm trong mô tả có "vàng", "yellow", "màu vàng"
   - Nếu khách yêu cầu "material: vải" → tìm trong mô tả có "vải", "fabric", "textile"
   
3. **TÍNH TOÁN SỐ LƯỢNG** phù hợp:
   - Nếu mô tả ghi "4m/cây" và khách cần 20m → quantity = 5
   - Nếu mô tả ghi "hộp 10 cái" và khách cần 30 cái → quantity = 3
   - Nếu không rõ → quantity = 1

4. **XẾP HẠNG ĐỘ PHÙ HỢP** (0-100):
   - 95-100: HOÀN HẢO - Khớp TẤT CẢ yêu cầu từ mô tả
   - 80-94: RẤT TỐT - Khớp hầu hết yêu cầu
   - 60-79: TỐT - Khớp một số yêu cầu quan trọng
   - 40-59: TRUNG BÌNH - Chỉ khớp 1-2 yêu cầu
   - <40: YẾU - Ít phù hợp

5. **GIẢI THÍCH CỤ THỂ** tại sao chọn:
   - Trích dẫn ĐÚNG từ mô tả sản phẩm
   - Giải thích rõ ràng điểm nào khớp
   - VD: "Sản phẩm có mô tả 'Size XL, màu vàng phản quang' khớp với yêu cầu size xl và color vàng"

⚠️ QUY TẮC BẮT BUỘC:
- TRẢ VỀ **ĐÚNG ${requestedQuantity} SẢN PHẨM** phù hợp nhất
- Sắp xếp theo relevanceScore từ CAO → THẤP
- Ưu tiên sản phẩm CÓ HÀNG (stock > 0)
- PHẢI đọc kỹ description, KHÔNG được chỉ dựa vào tên sản phẩm
- Giải thích PHẢI trích dẫn từ mô tả thực tế

📤 FORMAT JSON TRẢ VỀ (CHỈ JSON, KHÔNG TEXT THÊM):
{
  "products": [
    {
      "id": "product_id",
      "relevanceScore": 98,
      "calculatedQuantity": 5,
      "reasoning": "Mô tả sản phẩm ghi 'Size XL, vải polyester màu vàng phản quang, độ bền cao'. Khớp HOÀN HẢO với yêu cầu size xl và color vàng. Tồn kho 78 cái, đủ để cung cấp.",
      "matchedAttributes": ["size", "color", "material"]
    }
  ],
  "summary": "Đã phân tích ${maxProductsToAnalyze} sản phẩm và chọn ra ${requestedQuantity} sản phẩm PHÙ HỢP NHẤT dựa trên description. Top ${requestedQuantity} đều khớp với yêu cầu về [liệt kê yêu cầu đã khớp]."
}

🎯 HÃY BẮT ĐẦU PHÂN TÍCH NGAY!`;

    try {
      // Call LLM service
      this.logger.log('Calling AI for deep description analysis...');
      const aiResponse = await this.llm.generateResponse(prompt, '');

      // Parse JSON response
      let parsedResponse: any;
      try {
        // Extract JSON from response (in case LLM adds extra text)
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          parsedResponse = JSON.parse(aiResponse);
        }
      } catch (parseError) {
        this.logger.error('Failed to parse AI response as JSON:', parseError);
        this.logger.error('AI Response:', aiResponse);
        throw new Error('AI response parsing failed');
      }

      // Map AI results back to full product data
      const aiProducts = parsedResponse.products || [];

      // Ensure we return exactly requestedQuantity
      const limitedProducts = aiProducts.slice(0, requestedQuantity);

      const results = limitedProducts.map((aiProduct: any) => {
        const fullProduct = products.find((p) => p.id === aiProduct.id);
        if (!fullProduct) {
          this.logger.warn(`AI returned unknown product ID: ${aiProduct.id}`);
          return null;
        }

        return {
          id: fullProduct.id,
          name: fullProduct.name,
          description: fullProduct.description,
          price: fullProduct.price,
          stock: fullProduct.stock,
          category: fullProduct.category?.name,
          calculatedQuantity: aiProduct.calculatedQuantity || 1,
          relevanceScore: aiProduct.relevanceScore || 50,
          aiReasoning: aiProduct.reasoning || 'Sản phẩm phù hợp',
          matchedAttributes: aiProduct.matchedAttributes || [],
          images: fullProduct.images.map((img: any) => ({
            // Handle base64 images from admin uploads
            url: img.url.startsWith('data:')
              ? img.url // Base64 data URI - return as-is
              : img.url.startsWith('/assets')
              ? img.url // Seed products
              : img.url.startsWith('/')
              ? img.url // Already has leading slash
              : `/uploads/${img.url}`, // Admin file uploads
          })),
        };
      }).filter(Boolean); // Remove null entries

      this.logger.log(`AI selected ${results.length} products from ${products.length} candidates`);

      return {
        products: results,
        summary: parsedResponse.summary || `Đã chọn ${results.length} sản phẩm phù hợp nhất với yêu cầu của bạn.`,
      };
    } catch (error) {
      this.logger.error('AI analysis error:', error);
      throw error;
    }
  }

  /** =======================================================
   * Quantity estimation rule
   * =======================================================*/
  private computeQuantity(type: string, length: number) {
        if(type.toLowerCase().includes('ppr')) return Math.ceil((length ?? 10) / 4);
      if (type.toLowerCase().includes('thép')) return Math.ceil((length ?? 6) / 6);
      if (type.toLowerCase().includes('điện')) return Math.ceil(length ?? 10);
      return 1;
    }

  /** =======================================================
   * Rules for NL processing
   * =======================================================*/
  private async applyRules(type: MaterialType, parsed: any) {
    switch (type) {
      case MaterialType.WATER_PIPE:
        return this.ruleWaterPipe(parsed);
      case MaterialType.ELECTRICAL:
        return this.ruleElectrical(parsed);
      case MaterialType.STEEL:
        return this.ruleSteel(parsed);
      default:
        return {
          searchQuery: parsed.question,
          reasoning: 'Không xác định loại vật tư.',
          estimatedQuantity: 1,
          notes: [],
        };
    }
  }

  private ruleWaterPipe(parsed: any) {
    const floors = parsed.floors ?? 1;
    const length = parsed.length ?? 10;
    const pn = floors >= 3 ? 'PN25' : floors === 2 ? 'PN20' : 'PN16';
    const diameter = floors >= 3 ? 32 : floors === 2 ? 25 : 20;

    return {
      searchQuery: `ống PPR ${pn} D${diameter}`,
      reasoning: `Nhà ${floors} tầng → áp lực cao → chọn ${pn}.`,
      estimatedQuantity: Math.ceil(length / 4),
      notes: [`Chiều dài: ${length}m`],
    };
  }

  private ruleElectrical(parsed: any) {
    const hp = parsed.powerHP ?? 1;
    const length = parsed.length ?? 10;
    const mm2 = hp >= 3 ? 4 : hp >= 2 ? 2.5 : 1.5;

    return {
      searchQuery: `dây điện CV ${mm2}mm2`,
      reasoning: 'Chọn dây đúng tiết diện để tránh sụt áp.',
      estimatedQuantity: length,
      notes: [],
    };
  }

  private ruleSteel(parsed: any) {
    const length = parsed.length ?? 6;

    return {
      searchQuery: `thép hộp 20x20`,
      reasoning: 'Dùng trong dân dụng.',
      estimatedQuantity: Math.ceil(length / 6),
      notes: [],
    };
  }

  /** =======================================================
   * Category spec mapping
   * =======================================================*/
  private getDefaultSpecsForCategory(cat: string): string[] {
    const name = (cat || '').toLowerCase();

    if (name.includes('thép')) return ['chieuDai', 'chieuRong', 'chieuCao', 'trongLuong'];
    if (name.includes('bảo hộ')) return ['kichThuoc', 'chatLieu', 'mauSac'];
    if (name.includes('găng tay')) return ['kichThuoc', 'chatLieu', 'chieuDai', 'loai'];
    if (name.includes('xi măng')) return ['trongLuongBao', 'mác'];
    if (name.includes('ống')) return ['kichThuoc', 'chatLieu', 'tieuChuan'];

    return ['chieuDai', 'chieuRong', 'chieuCao', 'soLuong'];
  }
}
