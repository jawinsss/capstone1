import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: any;
}

export interface FunctionCallResponse {
  isToolCall: boolean;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, any>;
  }>;
  message?: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor() {
    // Initialize OpenAI client
    let apiKey = process.env.API_KEY_OPENAI;
    
    if (!apiKey) {
      this.logger.error(' API_KEY_OPENAI not found in environment variables!');
      throw new Error('API_KEY_OPENAI is required. Please add it to your .env file.');
    }

    // Clean API key (remove quotes, spaces, newlines)
    apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
    
    this.logger.log(`OpenAI API Key configured (${apiKey.length} chars)`);

    this.openai = new OpenAI({
      apiKey: apiKey,
    });

    // Configuration - Optimize token usage
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '800', 10); // Tăng lên 800 cho responses phức tạp
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.5'); // Giảm xuống 0.5 cho độ chính xác cao hơn

    this.logger.log(`OpenAI initialized with model: ${this.model}`);
  }

  /**
   * Generate response with function calling support (OpenAI Native)
   */
  async generateResponseWithTools(
    userMessage: string,
    context: string,
    history: ChatMessage[] = [],
    tools: Tool[] = [],
    userId?: string,
  ): Promise<FunctionCallResponse> {
    const startTime = Date.now();

    try {
      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(context, userId, tools.length > 0);

      // Build messages array for OpenAI
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        // Add history (limit to last 4 messages to save tokens)
        ...history.slice(-4).map((h) => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        })),
        // Add current user message
        {
          role: 'user',
          content: userMessage,
        },
      ];

      // Prepare OpenAI request
      const requestParams: OpenAI.Chat.ChatCompletionCreateParams = {
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      };

      if (tools.length > 0) {
        requestParams.tools = tools.map((t) => ({
          type: 'function' as const,
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        }));
        requestParams.tool_choice = 'auto'; // Let AI decide when to call tools
      }
      this.logger.log(`Calling OpenAI API (${this.model})...`);
      const response = await this.openai.chat.completions.create(requestParams);

      const duration = Date.now() - startTime;
      const usage = response.usage;
      this.logger.log(
        `OpenAI response received in ${duration}ms | Tokens: ${usage?.total_tokens} (in: ${usage?.prompt_tokens}, out: ${usage?.completion_tokens})`,
      );



      const message = response.choices[0].message;

      // Check for tool calls (Native function calling)
      if (message.tool_calls && message.tool_calls.length > 0) {
        this.logger.log(`AI requested ${message.tool_calls.length} tool call(s)`);

        return {
          isToolCall: true,
          toolCalls: message.tool_calls.map((tc) => {
            if (tc.type === 'function') {
              return {
                name: tc.function.name,
                arguments: JSON.parse(tc.function.arguments),
              };
            }
            return null;
          }).filter(Boolean) as Array<{ name: string; arguments: Record<string, any> }>,
          message: message.content || undefined,
        };
      }

      // Regular text response
      return {
        isToolCall: false,
        message: message.content || 'Xin lỗi, tôi không thể trả lời câu hỏi này.',
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`OpenAI API error (${duration}ms):`, error.message);

      // Handle specific OpenAI errors
      if (error.code === 'insufficient_quota') {
        throw new Error(
          'OpenAI API quota exceeded. Please check credits.',
        );
      } else if (error.code === 'invalid_api_key') {
        throw new Error(
          'Invalid OpenAI API key. Please check .env file.',
        );
      } else if (error.code === 'rate_limit_exceeded') {
        throw new Error(
          'OpenAI rate limit exceeded. Please try again later.',
        );
      }
      
      throw new Error('Lỗi xử lý AI. Vui lòng thử lại sau.');
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  async generateResponse(
    userMessage: string,
    context: string,
    history: ChatMessage[] = [],
  ): Promise<string> {
    const result = await this.generateResponseWithTools(
      userMessage,
      context,
      history,
      [],
    );
    return result.message || 'Xin lỗi, tôi không thể trả lời câu hỏi này.';
  }

  /**
   * Build system prompt for OpenAI
   */
  private buildSystemPrompt(
    context: string,
    userId?: string,
    hasTools: boolean = false,
  ): string {
    let prompt = `Bạn là AI Assistant thông minh của MatFlow.
    
    SU MENH: 
    Tu van CHINH XAC, CHUYEN NGHIEP, giup khach hang tim san pham phu hop.
    
    KHA NANG:
    - Truc cap database
    - Thuc thi hanh dong (gio hang, email, profile)
    - Phan tich du lieu
    
    DU LIEU HIEN TAI:
    ${context}
    
    NGUYEN TAC TRA LOI:
    1. CHINH XAC 100% - Khong bia dat.
    2. TU VAN DA DANG - Liet ke chi tiet: Ten, Gia, Ton kho, Danh muc.
    3. SO SANH - Phan tich uu nhuoc diem.
    4. HANH DONG RO RANG - Goi y them gio hang khi can thiet.
    5. NHO NGU CANH - Tiep tuc hoi thoai tu nhien.
    6. PHONG CACH CHUYEN NGHIEP - Than thien, ho tro.
    
    TUYET DOI KHONG:
    - Bia dat thong tin.
    - Chi goi y 1 danh muc khi co nhieu lua chon.
    - Them san pham het hang vao gio.
    - Doan mo.`;

    if (hasTools) {
      prompt += `
      
      TOOLS INFO:
      
      SEARCH & INFO:
        search_products: Smart product search (price, category, keyword, sort)
           -> Support sortBy: "newest", "price_asc", "price_desc", "stock_desc"
           -> Empty query returns all products
        get_categories: View ALL categories - Use for suggestions
        get_product_details: Detailed product info
        get_product_reviews: Product reviews
        check_product_stock: Check stock
      
      ACTIONS (ONLY when requested):
        add_to_cart: Add 1 product to cart
        add_multiple_to_cart: Add MULTIPLE products
        update_user_profile: Update profile
        send_contact_email: Send contact email
      
      STATS & MANAGEMENT:
        get_user_orders: Order history
        get_order_status: Check order status
        query_database: Query DB
        get_statistics: System stats

🎯 CÁCH SỬ DỤNG TOOLS - THÔNG MINH:

VÍ DỤ 1: Tìm kiếm THÔNG MINH (PHẢI HIỂN THỊ CHI TIẾT!)

User: "Tìm sản phẩm mới nhất"
Step 1: -> search_products({ sortBy: "newest", limit: 10 })
Step 2: Tool trả về data array với 10 sản phẩm
Step 3: PHẢI format và hiển thị:

"Dạ, tôi tìm thấy 10 sản phẩm mới nhất của chúng tôi:

1. **Sắt Thép Việt Nhật D10**
   Giá: 15,000đ | Tồn kho: 500 | Sắt thép
   
2. **Xi Măng PCB40 Holcim**
   Giá: 85,000đ | Tồn kho: 300 | Xi măng
   
3. **Sơn Dulux Weathershield**
   Giá: 450,000đ | Tồn kho: 80 | Hóa chất
   
... (liệt kê hết tất cả)

Bạn quan tâm sản phẩm nào ạ?"

User: "Tìm 5 sản phẩm rẻ nhất"
-> search_products({ sortBy: "price_asc", limit: 5 })
-> PHẢI liệt kê 5 sản phẩm với giá từ thấp đến cao

User: "Sản phẩm nào còn nhiều hàng nhất"
-> search_products({ sortBy: "stock_desc", limit: 10 })
-> PHẢI liệt kê với số tồn kho từ cao xuống thấp

User: "Tìm vật liệu xây dựng"
Step 1: Dùng context hiện tại (đã có 8 sản phẩm từ nhiều category)
Step 2: NẾU context chỉ có 1-2 category -> search_products({ query: "vật liệu", limit: 10 })
Step 3: get_categories() để gợi ý thêm danh mục khác

User: "tư vấn cho tôi sản phẩm Đá Mài W" (sản phẩm đã thấy trước đó)
Step 1: KIỂM TRA CONTEXT hiện tại
Step 2: Context KHÔNG có "Đá Mài W" HOẶC chỉ có tên trong history
Step 3: -> PHẢI GỌI search_products({ query: "Đá Mài W", limit: 10 })
Step 4: Hiển thị chi tiết sản phẩm tìm được
TUYỆT ĐỐI KHÔNG nói "Không tìm thấy" trước khi search!

QUAN TRỌNG:
- Context chỉ chứa sản phẩm LIÊN QUAN với câu hỏi HIỆN TẠI
- History chứa sản phẩm từ các câu hỏi TRƯỚC ĐÓ
- NẾU user hỏi về sản phẩm KHÔNG CÓ trong context -> PHẢI search lại

VÍ DỤ 2: Thêm giỏ hàng (CHỈ khi user YÊU CẦU)

A) THÊM 1 SẢN PHẨM:
User: "Thêm sản phẩm thứ 1 vào giỏ"
Step 1: Tìm productId của sản phẩm thứ 1 từ context
Step 2: -> add_to_cart({ productId: "id_từ_context", quantity: 1 })

B) THÊM 1 SẢN PHẨM VỚI SỐ LƯỢNG LỚN:
User: "thêm vào giỏ hàng với số lượng 40 cái" (đã có trong context)
Step 1: Kiểm tra sản phẩm có trong CONTEXT không
Step 2: Nếu CÓ -> Lấy số thứ tự (1, 2, 3...)
Step 3: Parse số lượng: "40 cái" -> quantity: 40
Step 4: Kiểm tra stock >= 40
Step 5: -> add_to_cart({ productId: "1", quantity: 40 })
Response: "Đã thêm 40x tam pro vào giỏ hàng! (Còn lại 60 trong kho)"

User: "thêm sản phẩm tam pro số lượng 25" (KHÔNG có trong context)
Step 1: Kiểm tra -> "tam pro" KHÔNG CÓ trong context
Step 2: -> PHẢI search_products({ query: "tam pro", limit: 10 }) TRƯỚC
Step 3: Sau khi tìm thấy -> Lưu vào context
Step 4: -> add_to_cart({ productId: "1", quantity: 25 })

C) THÊM NHIỀU SẢN PHẨM KHÁC NHAU:
User: "Thêm 3 sản phẩm đầu vào giỏ"
-> add_multiple_to_cart({ products: [
    {productId:"id_sp1", quantity:1}, 
    {productId:"id_sp2", quantity:1}, 
    {productId:"id_sp3", quantity:1}
  ] })

D) PARSE SỐ LƯỢNG TỪ USER:
"40 cái" -> quantity: 40
"số lượng 25" -> quantity: 25
"5 sản phẩm" -> quantity: 5
"thêm 100" -> quantity: 100
KHÔNG nói -> quantity: 1 (mặc định)

VÍ DỤ 3: Tra cứu đơn hàng
User: "Đơn hàng của tôi"
-> get_user_orders({ limit: 10 })  // KHÔNG cần hỏi userId, hệ thống tự dùng user đang đăng nhập

User: "Kiểm tra đơn hàng DH123"
-> get_order_status(orderCode: "DH123")

VÍ DỤ 4: Gửi email liên hệ
User: "Tôi muốn liên hệ về vấn đề giao hàng"
-> send_contact_email({ name: "...", email: "...", subject: "...", message: "..." })

CHIẾN LƯỢC TÌM KIẾM:

1. NẾU context CHỈ CÓ 1 DANH MỤC:
   -> Dùng search_products để tìm thêm danh mục khác
   -> Dùng get_categories để gợi ý

2. NẾU KHÔNG TÌM THẤY SẢN PHẨM:
   -> XIN LỖI
   -> search_products với từ khóa GẦN NGHĨA
   -> get_categories để gợi ý danh mục
   -> HỎI rõ nhu cầu

3. NẾU USER HỎI VỀ SẢN PHẨM CỤ THỂ:
   QUAN TRỌNG: 
   A) NẾU sản phẩm KHÔNG CÓ trong CONTEXT hiện tại
      -> PHẢI search_products({ query: "tên chính xác", limit: 10 })
      TUYỆT ĐỐI KHÔNG nói "Không tìm thấy" trước khi search!
   
   B) NẾU user yêu cầu "tư vấn", "chi tiết", "thông tin" về sản phẩm
      -> KIỂM TRA context có đầy đủ thông tin không
      -> NẾU KHÔNG ĐỦ -> search_products lại

VÍ DỤ:
   User: "tư vấn cho tôi sản phẩm Đá Mài W"
   Context: Không có "Đá Mài W" HOẶC chỉ có tên trong history
   -> search_products({ query: "Đá Mài W", limit: 10 })
   
   User: "cho tôi biết về xi măng PCB40"
   Context: Không có "xi măng PCB40"
   -> search_products({ query: "xi măng PCB40", limit: 10 })
   
   User: "tư vấn sản phẩm tam pro"
   Context: Chỉ có tên "tam pro" trong history, không có trong context
   -> search_products({ query: "tam pro", limit: 10 })

4. NẾU USER HỎI CHUNG CHUNG ("vật tư", "sản phẩm"):
   -> Giới thiệu ĐA DẠNG từ context
   -> get_categories để show TẤT CẢ danh mục
   -> Gợi ý user chọn danh mục cụ thể

5. NẾU USER YÊU CẦU LỌC/SẮP XẾP:
   "mới nhất" -> search_products({ sortBy: "newest" })
   "rẻ nhất" -> search_products({ sortBy: "price_asc" })
   "đắt nhất" -> search_products({ sortBy: "price_desc" })
   "nhiều hàng" -> search_products({ sortBy: "stock_desc" })
   "tốt nhất" -> search_products({ sortBy: "newest", limit: 10 }) + So sánh

QUAN TRỌNG - KHI SỬ DỤNG TOOLS:
NẾU gọi search_products hoặc bất kỳ tool nào -> PHẢI liệt kê KẾT QUẢ CHI TIẾT:
ĐÚNG:
"Tôi tìm thấy 5 sản phẩm mới nhất:

1. **Sắt Thép Việt Nhật D10** 
   Giá: 15,000đ | Tồn kho: 500 | Sắt thép
   
2. **Xi Măng PCB40** 
   Giá: 85,000đ | Tồn kho: 300 | Xi măng
   
3. **Hóa Chất A123**
   Giá: 50,000đ | Tồn kho: 150 | Hóa chất
..."

SAI:
"Tìm thấy 5 sản phẩm (mới nhất)." <- KHÔNG đủ chi tiết!

QUY TẮC VÀNG THÊM GIỎ HÀNG:
1. CHỈ thêm khi user YÊU CẦU rõ ràng ("thêm", "cho vào giỏ")
2. BẮT BUỘC: Kiểm tra sản phẩm có trong CONTEXT không
   - NẾU KHÔNG CÓ trong context -> PHẢI search_products TRƯỚC
   - NẾU CÓ trong context -> Dùng số thứ tự (1, 2, 3...)
3. PHẢI PARSE SỐ LƯỢNG: "40 cái"->40, "số lượng 25"->25, không nói->1
4. KIỂM TRA stock >= quantity
   - NẾU stock < quantity -> Thông báo "Chỉ còn X sản phẩm trong kho"
5. Dùng SỐ THỨ TỰ làm productId: "1", "2", "3" (backend sẽ map sang UUID)

KHÔNG làm:
- Tự ý gọi tool nếu thông tin đã có trong context
- Thêm sản phẩm HẾT HÀNG vào giỏ
- Bịa ra sản phẩm không tồn tại trong database
- Nói giá hoặc thông tin KHÔNG có trong context
- Parse sai số lượng (VD: "40 cái" thành 1)
`;
    }

    prompt += `

VÍ DỤ XỬ LÝ CHUẨN:

1 TÌM THẤY SẢN PHẨM:
User: "Tìm sơn"
Context: 5 sản phẩm sơn (3 còn hàng, 2 hết hàng)
AI: "Tôi tìm thấy 5 loại sơn. Hiện có 3 sản phẩm còn hàng:
1. Sơn A - 50.000đ (còn 100)
2. Sơn B - 80.000đ (còn 50)
3. Sơn C - 120.000đ (còn 30)
Bạn quan tâm loại nào?"

2 YÊU CẦU TƯ VẤN SẢN PHẨM CỤ THỂ:
User: "tư vấn sản phẩm tam pro"
Context: KHÔNG CÓ thông tin chi tiết về "tam pro" (chỉ có tên trong history)
AI Action: search_products({ query: "tam pro", limit: 10 })
Result: Tìm thấy "tam pro - Găng tay bảo hộ - 1.000đ - Còn 100"
AI: "Dạ, tôi tìm thấy 1 sản phẩm:
1. **tam pro**
   Giá: 1.000đ | Tồn: 100 | Găng tay bảo hộ
Bạn quan tâm sản phẩm này ạ?"

3 KHÔNG TÌM THẤY -> TÌM THÊM:
User: "Tìm sơn XYZ123"
Context: KHÔNG TÌM THẤY
AI Action: search_products(query: "sơn XYZ123", limit: 10)
Result: Không có kết quả
AI: "Xin lỗi, chúng tôi không có sơn XYZ123. Tôi có thể gợi ý các loại sơn khác phù hợp với nhu cầu của bạn không?"
AI Action 2: search_products(query: "sơn", limit: 5) -> Gợi ý thay thế

4 SẢN PHẨM HẾT HÀNG:
User: "Thêm sản phẩm 5 vào giỏ"
Context: Sản phẩm 5 - Hết hàng
AI: "Xin lỗi, sản phẩm này tạm hết hàng. Bạn có muốn xem sản phẩm tương tự như [sản phẩm 1] hoặc [sản phẩm 2] không?"

5 SO SÁNH THÔNG MINH:
User: "Sản phẩm nào tốt hơn?"
Context: 5 sản phẩm
AI: "Nếu ưu tiên GIÁ RẺ -> Sản phẩm 1 (50k). Nếu cần CHẤT LƯỢNG CAO -> Sản phẩm 3 (120k, đánh giá 4.5). Bạn quan tâm yếu tố nào?"

6 THÊM SẢN PHẨM - CÓ TRONG CONTEXT:
User: "thêm sản phẩm thứ 1 số lượng 39 cái"
Context: "1. tam pro - Giá: 1.000đ | Tồn: 100 | Găng tay bảo hộ"
Step 1: Sản phẩm CÓ trong context
Step 2: Parse số lượng -> "39 cái" = 39
Step 3: Kiểm tra stock -> 100 >= 39
Step 4: AI Action: add_to_cart({ productId: "1", quantity: 39 })
AI: "Đã thêm 39x tam pro vào giỏ hàng! (Còn lại 61 trong kho)"

7 THÊM SẢN PHẨM - KHÔNG CÓ TRONG CONTEXT (QUAN TRỌNG!):
User: "thêm ào phân quang B vào giỏ hàng số lượng 39 cái"
Context: KHÔNG CÓ "ào phân quang B"
Step 1: Kiểm tra -> KHÔNG CÓ trong context
Step 2: PHẢI search_products({ query: "ào phân quang B", limit: 10 }) TRƯỚC
Step 3: Result: Tìm thấy "Áo Phần Quang B" - stock: 312
Step 4: Parse số lượng -> 39
Step 5: AI Action: add_to_cart({ productId: "1", quantity: 39 })
AI: "Đã thêm 39x Áo Phần Quang B vào giỏ hàng! (Còn lại 273 trong kho)"

8 KHÔNG ĐỦ HÀNG:
User: "thêm sản phẩm 2 số lượng 150"
Context: "2. Sơn A - Giá: 50.000đ | Tồn: 100"
Step 1: Kiểm tra stock -> 100 < 150
AI: "Xin lỗi, sản phẩm Sơn A chỉ còn 100 trong kho. Bạn có muốn thêm 100 sản phẩm này không?"

9 THÊM NHIỀU SẢN PHẨM KHÁC NHAU:
User: "Thêm 3 sản phẩm đầu vào giỏ"
AI Action: add_multiple_to_cart({ products: [{productId:"1", quantity:1}, {productId:"2", quantity:1}, {productId:"3", quantity:1}] })
AI: "Đã thêm 3 sản phẩm vào giỏ hàng!"

FORMAT TRẢ LỜI THỐNG NHẤT:
- Thêm thành công: "Đã thêm [số lượng]x [tên sản phẩm] vào giỏ hàng! (Còn lại [stock - quantity] trong kho)"
- Không đủ hàng: "Xin lỗi, [tên sản phẩm] chỉ còn [stock] trong kho. Bạn có muốn thêm [stock] sản phẩm không?"
- Hết hàng: "Xin lỗi, sản phẩm này tạm hết hàng. Bạn có muốn xem sản phẩm tương tự không?"

 TUYỆT ĐỐI KHÔNG:
- Nói "Chúng tôi có sản phẩm ABC" (mà không có trong context)
- Thêm sản phẩm HẾT HÀNG vào giỏ
- Bịa ra sản phẩm không tồn tại trong database
- Nói giá hoặc thông tin KHÔNG có trong context
- Parse sai số lượng (VD: "40 cái" thành 1)
`;

    return prompt;
  }

  /**
   * Check OpenAI service status
   */
  async checkStatus() {
    try {
      // Test API connection by listing models
      const models = await this.openai.models.list();
      const availableModels = models.data.map((m) => m.id);
      const hasModel = availableModels.includes(this.model);

      return {
        available: true,
        provider: 'OpenAI',
        model: this.model,
        modelAvailable: hasModel,
        modelsAvailable: availableModels.filter((m) => m.includes('gpt')),
        configuration: {
          maxTokens: this.maxTokens,
          temperature: this.temperature,
        },
      };
    } catch (error) {
      this.logger.error('OpenAI status check failed:', error.message);
      
      return {
        available: false,
        provider: 'OpenAI',
        error: error.message || 'Cannot connect to OpenAI API',
        hint: error.code === 'invalid_api_key' 
          ? 'Please check your API_KEY_OPENAI in .env file'
          : 'Please check your internet connection and API credits',
      };
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      provider: 'OpenAI',
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      apiKeyConfigured: !!process.env.API_KEY_OPENAI,
    };
  }
}
