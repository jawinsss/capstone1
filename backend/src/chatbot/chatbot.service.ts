import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { VectorService } from '../vector/vector.service';
import { ToolsService } from './tools.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatResponse {
  message: string;
  sources: Array<{
    productId: string;
    productName: string;
    category: string;
    price: number;
    relevanceScore: number;
  }>;
  conversationId: string;
  messageId: string;
  toolCalls?: Array<{
    tool: string;
    result: any;
  }>;
  actions?: Array<{
    type: string;
    data: any;
  }>;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private prisma: PrismaService,
    private llmService: LlmService,
    private vectorService: VectorService,
    private toolsService: ToolsService,
  ) {}

  async chat(
    message: string,
    conversationId?: string,
    userId?: string,
    sessionId?: string,
  ): Promise<ChatResponse> {
    this.logger.log(`Received message: ${message}`);
    const startTime = Date.now();

    // Validate message
    if (!message || message.trim().length === 0) {
      throw new Error('Tin nhắn không được để trống');
    }

    try {
      // 1. Get or create conversation
      let conversation;
      if (conversationId) {
        conversation = await this.prisma.conversation.findUnique({
          where: { id: conversationId },
          include: { 
            messages: { 
              orderBy: { createdAt: 'desc' }, 
              take: 10,
              // ✅ Include metadata để lấy products từ message trước
            } 
          },
        });
        
        if (!conversation) {
          throw new Error('Conversation not found');
        }
      } else {
        // Create new conversation
        const title = this.generateConversationTitle(message);
        conversation = await this.prisma.conversation.create({
          data: {
            title,
            userId: userId || null,
            sessionId: sessionId || null,
          },
          include: { messages: true },
        });
        conversationId = conversation.id;
      }

      // 2. Save user message to database
      const userMessage = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'USER',
          content: message,
        },
      });

      // 3. Get conversation history for context (⚡ Tối ưu token)
      const history: ChatMessage[] = conversation.messages
        .slice(0, 6) // ⚡ Giảm xuống 6 messages để tiết kiệm tokens
        .reverse()
        .map((m) => ({
          role: m.role.toLowerCase() as 'user' | 'assistant',
          content: m.content.length > 500 ? m.content.substring(0, 500) + '...' : m.content, // ⚡ Truncate long messages
        }));

      // 4. Smart search for relevant products
      this.logger.log('Searching for relevant products...');
      
      // ✅ FIX: Nếu message chỉ là "thêm", lấy products từ message trước đó
      let relevantProducts = [];
      const isAddToCartMessage = message.toLowerCase().includes('thêm') || 
                                  message.toLowerCase().includes('cho vào giỏ') ||
                                  message.toLowerCase().includes('add');
      
      if (isAddToCartMessage && conversation.messages.length > 0) {
        // Tìm message gần nhất có products trong metadata
        const recentMessagesWithProducts = conversation.messages
          .filter(m => m.metadata && (m.metadata as any).products)
          .slice(0, 1);
        
        if (recentMessagesWithProducts.length > 0) {
          const productsMetadata = (recentMessagesWithProducts[0].metadata as any).products;
          this.logger.log(`🔄 Reusing ${productsMetadata.length} products from previous message`);
          
          // Fetch full product data with category
          relevantProducts = await Promise.all(
            productsMetadata.map(async (p: any) => {
              const product = await this.prisma.product.findUnique({
                where: { id: p.id },
                include: { category: true },
              });
              
              if (product) {
                this.logger.log(`   ✅ Loaded: ${product.name} - Category: ${product.category?.name || 'NULL'}`);
                return { ...product, score: p.score || 10 };
              } else {
                this.logger.warn(`   ⚠️ Product not found: ${p.id}`);
                return null;
              }
            })
          );
          relevantProducts = relevantProducts.filter(p => p !== null);
          this.logger.log(`📦 Total valid products: ${relevantProducts.length}`);
        }
      }
      
      // Nếu không tìm thấy products từ history, search mới
      if (relevantProducts.length === 0) {
        relevantProducts = await this.vectorService.searchRelevantProducts(
          message,
          8, // 🚀 Tăng lên 8 để có nhiều lựa chọn đa dạng hơn từ nhiều category
        );
      }

      this.logger.log(`Found ${relevantProducts.length} relevant products`);
      
      // ✅ Debug: Log categories
      if (relevantProducts.length > 0) {
        relevantProducts.forEach((p, idx) => {
          this.logger.log(`   ${idx + 1}. ${p.name} - Category: ${p.category?.name || 'NULL'} (categoryId: ${(p as any).categoryId})`);
        });
      }

      // 5. Build context from products
      const context = this.buildContext(relevantProducts);

      // 6. Get available tools
      const tools = this.toolsService.getAvailableTools();

      // 7. Call LLM with function calling support (⚡ Smart context management)
      this.logger.log('Calling LLM service with tools...');
      const aiResponseData = await this.llmService.generateResponseWithTools(
        message,
        context,
        history.slice(-4), // ⚡ Chỉ gửi 4 messages gần nhất để giảm tokens
        tools,
        userId,
      );

      let finalMessage = aiResponseData.message || '';
      const toolResults: Array<{ tool: string; result: any }> = [];
      const actions: Array<{ type: string; data: any }> = [];

      // 8. Execute tool calls if needed
      if (aiResponseData.isToolCall && aiResponseData.toolCalls) {
        this.logger.log(`AI requested ${aiResponseData.toolCalls.length} tool call(s)`);
        
        for (const toolCall of aiResponseData.toolCalls) {
          this.logger.log(`Executing tool: ${toolCall.name} with args:`, JSON.stringify(toolCall.arguments));
          
          // ✅ FIX: Map product names/numbers to actual IDs
          if (toolCall.name === 'add_to_cart' && toolCall.arguments.productId) {
            const originalId = toolCall.arguments.productId;
            toolCall.arguments.productId = this.mapProductToId(
              toolCall.arguments.productId,
              relevantProducts,
            );
            this.logger.log(`🔍 Mapped productId: "${originalId}" → "${toolCall.arguments.productId}"`);
          }

          // ✅ FIX: Map multiple products for batch add
          if (toolCall.name === 'add_multiple_to_cart' && toolCall.arguments.products) {
            this.logger.log(`🔍 Mapping ${toolCall.arguments.products.length} products...`);
            toolCall.arguments.products = toolCall.arguments.products.map((p: any) => {
              const originalId = p.productId;
              const mappedId = this.mapProductToId(p.productId, relevantProducts);
              this.logger.log(`   "${originalId}" → "${mappedId}"`);
              return {
                productId: mappedId,
                quantity: p.quantity || 1,
              };
            });
          }
          
          const toolResult = await this.toolsService.executeTool(toolCall, userId);
          this.logger.log(`Tool result:`, JSON.stringify({ success: toolResult.success, dataLength: Array.isArray(toolResult.data) ? toolResult.data.length : 'single' }));
          
          toolResults.push({
            tool: toolCall.name,
            result: toolResult,
          });

          // Build response message with tool results
          if (toolResult.success) {
            // 🔥 SPECIAL: search_products → Format chi tiết sản phẩm + CẬP NHẬT relevantProducts
            if (toolCall.name === 'search_products' && toolResult.data && Array.isArray(toolResult.data)) {
              const products = toolResult.data;
              this.logger.log(`📋 Formatting ${products.length} products for display`);
              
              // ✅ CẬP NHẬT relevantProducts để có thể map productId đúng sau này
              relevantProducts = products;
              this.logger.log(`🔄 Updated relevantProducts with ${products.length} new products from search`);
              
              let formattedMessage = `Dạ, tôi tìm thấy ${products.length} sản phẩm:\n\n`;
              
              products.forEach((p: any, idx: number) => {
                const price = typeof p.price === 'number' ? p.price.toLocaleString('vi-VN') : (p.price || '0');
                const stock = p.stock !== undefined ? p.stock : 0;
                const category = p.category || 'Chưa phân loại';
                
                formattedMessage += `${idx + 1}. **${p.name}**\n`;
                formattedMessage += `   💰 Giá: ${price}đ`;
                formattedMessage += ` | 📦 Tồn: ${stock}`;
                formattedMessage += ` | 🏷️ ${category}\n\n`;
              });
              
              formattedMessage += `Bạn quan tâm sản phẩm nào ạ? Tôi có thể tư vấn chi tiết hoặc thêm vào giỏ hàng cho bạn! 🛒`;
              
              finalMessage = formattedMessage;
            } 
            // 🧾 SPECIAL: get_user_orders → Hiển thị chi tiết đơn hàng
            else if (toolCall.name === 'get_user_orders' && toolResult.data && Array.isArray(toolResult.data)) {
              const orders = toolResult.data;
              this.logger.log(`📋 Formatting ${orders.length} orders for display`);

              let formattedMessage = orders.length === 0
                ? 'Bạn chưa có đơn hàng nào.'
                : `Tôi tìm thấy ${orders.length} đơn hàng gần đây của bạn:\n\n`;

              const statusMap: Record<string, string> = {
                PENDING: 'Đang chờ xác nhận',
                CONFIRMED: 'Đã xác nhận',
                SHIPPING: 'Đang giao hàng',
                COMPLETED: 'Đã hoàn thành',
                CANCELLED: 'Đã hủy',
                RETURNED: 'Đã trả hàng',
              };

              orders.forEach((o: any, idx: number) => {
                const total = typeof o.totalAmount === 'number' ? o.totalAmount.toLocaleString('vi-VN') : (o.totalAmount || 0);
                const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '';
                const statusText = statusMap[o.status] || o.status || 'Không rõ';

                formattedMessage += `${idx + 1}. Mã: ${o.code || '—'}\n`;
                formattedMessage += `   📦 Số SP: ${o.itemCount || 0}`;
                formattedMessage += ` | 💰 Tổng: ${total}đ`;
                formattedMessage += ` | 🏷️ Trạng thái: ${statusText}`;
                formattedMessage += dateStr ? ` | 📅 ${dateStr}` : '';
                formattedMessage += `\n\n`;
              });

              finalMessage = formattedMessage;

              // Gửi action để frontend hiển thị nút xem đơn hàng
              actions.push({ type: 'view_orders', data: { count: orders.length } });
            }
            // ✅ Các tool khác dùng message từ tool result
            else if (toolResult.message) {
              finalMessage = toolResult.message;
            }
            
            // Add action for frontend
            if (toolCall.name === 'add_to_cart' || toolCall.name === 'add_multiple_to_cart') {
              this.logger.log(`🛒 Creating add_to_cart action with data:`, JSON.stringify(toolResult.data));
              actions.push({
                type: 'add_to_cart',
                data: toolResult.data,
              });
            } else if (toolCall.name === 'update_user_profile') {
              this.logger.log(`👤 Creating profile_updated action`);
              actions.push({
                type: 'profile_updated',
                data: toolResult.data,
              });
            } else if (toolCall.name === 'send_contact_email') {
              this.logger.log(`📧 Creating email_sent action`);
              actions.push({
                type: 'email_sent',
                data: { success: true },
              });
            }
          } else {
            finalMessage = `❌ ${toolResult.error || 'Xin lỗi, tôi không thể thực hiện yêu cầu này.'}`;
          }
        }
      }

      // 9. ✅ FINAL CLEANUP - Loại bỏ MỌI JSON còn sót lại
      finalMessage = this.cleanJsonFromMessage(finalMessage);
      
      // If no clear response, use default
      if (!finalMessage || finalMessage.trim().length === 0) {
        finalMessage = 'Tôi đã xử lý yêu cầu của bạn. Còn điều gì tôi có thể giúp không?';
      }

      // 10. Save assistant message to database
      const assistantMessage = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: finalMessage,
          metadata: {
            products: relevantProducts.map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              score: p.score,
            })),
            toolCalls: toolResults,
            actions,
          },
        },
      });

      // 11. Update conversation timestamp
      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      const duration = Date.now() - startTime;
      this.logger.log(`Response generated in ${duration}ms`);
      
      // Log actions being sent to frontend
      if (actions.length > 0) {
        this.logger.log(`📤 Sending ${actions.length} action(s) to frontend:`, actions.map(a => a.type));
      }

      return {
        message: finalMessage,
        sources: relevantProducts.map((p) => ({
          productId: p.id,
          productName: p.name,
          category: p.category?.name || 'Chưa phân loại',
          price: p.price,
          relevanceScore: p.score,
        })),
        conversationId: conversation.id,
        messageId: assistantMessage.id,
        toolCalls: toolResults.length > 0 ? toolResults : undefined,
        actions: actions.length > 0 ? actions : undefined,
      };
    } catch (error) {
      this.logger.error('Chat error:', error);
      this.logger.error('Error stack:', error.stack);
      
      const errorMessage = error.message || 'Không thể xử lý tin nhắn. Vui lòng thử lại.';
      throw new Error(errorMessage);
    }
  }

  private buildContext(products: any[]): string {
    if (products.length === 0) {
      return `KHÔNG TÌM THẤY sản phẩm phù hợp trong database.
      
HƯỚNG DẪN:
- XIN LỖI khách hàng và giải thích không có sản phẩm này
- GỢI Ý họ tìm kiếm sản phẩm khác hoặc danh mục khác
- HỎI rõ hơn về nhu cầu để tư vấn chính xác
- Đề xuất liên hệ trực tiếp nếu cần tư vấn chi tiết

VÍ DỤ: "Xin lỗi, hiện chúng tôi chưa có sản phẩm [tên] trong kho. Bạn có thể cho tôi biết rõ hơn về mục đích sử dụng để tôi gợi ý sản phẩm tương tự không?"`;
    }

    // ✅ Phân loại sản phẩm còn hàng và hết hàng
    const inStock = products.filter(p => p.stock > 0);
    const outOfStock = products.filter(p => p.stock === 0);

    // ✅ Build context với thông tin chi tiết hơn
    let context = `TÌM THẤY ${products.length} SẢN PHẨM LIÊN QUAN:\n\n`;

    // Sản phẩm còn hàng (ưu tiên)
    if (inStock.length > 0) {
      context += `✅ CÒN HÀNG (${inStock.length}):\n`;
      inStock.forEach((p, idx) => {
        const category = p.category?.name || 'Chưa phân loại';
        const description = p.description ? ` - ${p.description.substring(0, 80)}` : '';
        context += `${idx + 1}. ${p.name}\n`;
        context += `   💰 Giá: ${p.price.toLocaleString()}đ | 📦 Tồn: ${p.stock} | 🏷️ ${category}${description}\n`;
      });
    }

    // Sản phẩm hết hàng (thông tin thêm)
    if (outOfStock.length > 0) {
      context += `\n⚠️ HẾT HÀNG HIỆN TẠI (${outOfStock.length}):\n`;
      outOfStock.forEach((p, idx) => {
        context += `${inStock.length + idx + 1}. ${p.name} - ${p.price.toLocaleString()}đ (Tạm hết)\n`;
      });
    }

    // ✅ Hướng dẫn AI trả lời
    context += `\nHƯỚNG DẪN TRẢ LỜI:
- ƯU TIÊN giới thiệu sản phẩm CÒN HÀNG
- NÊU RÕ giá, tồn kho, danh mục
- SO SÁNH các sản phẩm nếu có nhiều lựa chọn
- GỢI Ý thêm vào giỏ hàng nếu phù hợp
- NẾU hết hàng: Xin lỗi và đề xuất sản phẩm thay thế`;

    return context;
  }

  private generateConversationTitle(message: string): string {
    // Generate title from first message (max 50 chars)
    const title = message.length > 50 ? message.substring(0, 47) + '...' : message;
    return title;
  }

  /**
   * ✅ TRIỆT ĐỂ loại bỏ JSON khỏi message
   */
  /**
   * Map product reference (name, number, or partial ID) to actual product ID
   */
  private mapProductToId(productRef: string, availableProducts: any[]): string {
    if (!productRef) {
      this.logger.warn('⚠️ Empty productRef provided');
      return '';
    }

    // Convert to string if it's a number
    const refString = String(productRef).toLowerCase().trim();

    this.logger.log(`🔍 Mapping productRef: "${productRef}" (type: ${typeof productRef})`);
    this.logger.log(`📦 Available products: ${availableProducts.length} items`);

    // Already a valid CUID (starts with 'c' and long enough)
    if (refString.startsWith('c') && refString.length >= 20) {
      this.logger.log(`✅ Already valid CUID: ${productRef}`);
      return productRef;
    }

    // Check if it's a number (1, 2, 3, 4, 5) referring to product list position
    const numberMatch = refString.match(/^\d+$/);
    if (numberMatch) {
      const index = parseInt(refString, 10) - 1; // Convert 1-based to 0-based
      
      if (index >= 0 && index < availableProducts.length) {
        const product = availableProducts[index];
        this.logger.log(`✅ Mapped number ${refString} (index ${index}) → ${product.name} (${product.id})`);
        return product.id;
      } else {
        this.logger.warn(`⚠️ Number ${refString} is out of range (0-${availableProducts.length - 1})`);
        
        // Fallback: if user says "5" but we only have 3, use the last one
        if (availableProducts.length > 0) {
          const lastProduct = availableProducts[availableProducts.length - 1];
          this.logger.log(`📍 Using last product as fallback: ${lastProduct.name}`);
          return lastProduct.id;
        }
      }
    }

    // Search by name match (partial or full)
    const foundProduct = availableProducts.find(p => {
      const productName = p.name.toLowerCase();
      return productName.includes(refString) || 
             refString.includes(productName.substring(0, Math.min(10, productName.length)));
    });

    if (foundProduct) {
      this.logger.log(`✅ Mapped by name "${productRef}" → ${foundProduct.name} (${foundProduct.id})`);
      return foundProduct.id;
    }

    // Fallback: return first available product
    if (availableProducts.length > 0) {
      const firstProduct = availableProducts[0];
      this.logger.warn(`⚠️ Could not map "${productRef}", using first product: ${firstProduct.name}`);
      return firstProduct.id;
    }

    // Last resort: return original (will likely fail in addToCart)
    this.logger.error(`❌ Could not map product reference "${productRef}" - no products available!`);
    return productRef;
  }

  private cleanJsonFromMessage(message: string): string {
    if (!message) return message;
    
    let cleaned = message;
    
    // Loại bỏ mọi JSON object
    cleaned = cleaned.replace(/\{[\s\S]*?\}/g, '');
    
    // Loại bỏ các pattern JSON thường gặp
    cleaned = cleaned.replace(/"action"\s*:\s*"[^"]+"/g, '');
    cleaned = cleaned.replace(/"tool"\s*:\s*"[^"]+"/g, '');
    cleaned = cleaned.replace(/"arguments"\s*:\s*\{[^}]*\}/g, '');
    
    // Loại bỏ line breaks thừa
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Trim
    cleaned = cleaned.trim();
    
    return cleaned;
  }

  async clearConversation(conversationId: string): Promise<void> {
    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });
  }

  async getUserConversations(userId: string, limit = 20) {
    return this.prisma.conversation.findMany({
      where: { userId, isActive: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get last message for preview
        },
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  async getConversationById(conversationId: string, userId?: string) {
    const where: any = { id: conversationId };
    if (userId) {
      where.userId = userId;
    }

    return this.prisma.conversation.findUnique({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async deleteConversation(conversationId: string, userId?: string) {
    const where: any = { id: conversationId };
    if (userId) {
      where.userId = userId;
    }

    return this.prisma.conversation.delete({ where });
  }

  async updateConversationTitle(conversationId: string, title: string, userId?: string) {
    const where: any = { id: conversationId };
    if (userId) {
      where.userId = userId;
    }

    return this.prisma.conversation.update({
      where,
      data: { title },
    });
  }

  async getSystemStatus() {
    const llmStatus = await this.llmService.checkStatus();
    const productsCount = await this.prisma.product.count({
      where: { isActive: true },
    });
    const conversationsCount = await this.prisma.conversation.count();
    const messagesCount = await this.prisma.message.count();

    return {
      llm: llmStatus,
      database: {
        connected: true,
        productsCount,
        conversationsCount,
        messagesCount,
      },
      status: llmStatus.available ? 'ready' : 'llm_unavailable',
    };
  }
}

