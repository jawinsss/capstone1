import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContactService } from '../contact/contact.service';
import { OrdersService } from '../orders/orders.service';
import { UsersService } from '../users/users.service';

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

@Injectable()
export class ToolsService {
  private readonly logger = new Logger(ToolsService.name);

  constructor(
    private prisma: PrismaService,
    private contactService: ContactService,
    private ordersService: OrdersService,
    private usersService: UsersService,
  ) {}

  /**
   * Get all available tools for AI
   */
  getAvailableTools(): Tool[] {
    return [
      {
        name: 'search_products',
        description: 'Smart product search in database by name, description, category, price range, and sort. Supports: newest, cheapest, most expensive, most stock.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Từ khóa tìm kiếm sản phẩm (tên hoặc mô tả). Có thể để trống để lấy tất cả sản phẩm.',
            },
            category: {
              type: 'string',
              description: 'Lọc theo danh mục (tùy chọn)',
            },
            minPrice: {
              type: 'number',
              description: 'Giá tối thiểu (VND) - tùy chọn',
            },
            maxPrice: {
              type: 'number',
              description: 'Giá tối đa (VND) - tùy chọn',
            },
            sortBy: {
              type: 'string',
              description: 'Sắp xếp theo: "newest" (mới nhất), "price_asc" (rẻ nhất), "price_desc" (đắt nhất), "stock_desc" (nhiều hàng nhất)',
              enum: ['newest', 'price_asc', 'price_desc', 'stock_desc'],
            },
            limit: {
              type: 'number',
              description: 'Số lượng sản phẩm tối đa trả về (mặc định 10, tối đa 50)',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_product_details',
        description: 'Lấy thông tin chi tiết của một sản phẩm cụ thể theo ID hoặc slug.',
        parameters: {
          type: 'object',
          properties: {
            productId: {
              type: 'string',
              description: 'ID hoặc slug của sản phẩm',
            },
          },
          required: ['productId'],
        },
      },
      {
        name: 'add_to_cart',
        description: 'Add product to cart. ONLY use when user explicitly REQUESTS it. Must parse quantity from user input.',
        parameters: {
          type: 'object',
          properties: {
            productId: {
              type: 'string',
              description: 'ID hoặc số thứ tự của sản phẩm từ danh sách hiển thị (1, 2, 3...)',
            },
            quantity: {
              type: 'number',
              description: 'Số lượng sản phẩm cần thêm. Parse từ user: "40 cái"→40, "số lượng 25"→25, "100 sản phẩm"→100, không nói→1 (mặc định)',
            },
            userId: {
              type: 'string',
              description: 'ID người dùng (nếu đã đăng nhập)',
            },
          },
          required: ['productId'],
        },
      },
      {
        name: 'add_multiple_to_cart',
        description: 'Add MULTIPLE products to cart. Use when user requests 2+ products.',
        parameters: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              description: 'Danh sách sản phẩm cần thêm',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string' },
                  quantity: { type: 'number' },
                },
              },
            },
            userId: {
              type: 'string',
              description: 'ID người dùng (nếu đã đăng nhập)',
            },
          },
          required: ['products'],
        },
      },
      {
        name: 'update_user_profile',
        description: 'Cập nhật thông tin cá nhân của người dùng (tên, email, số điện thoại, địa chỉ, v.v.). CHỈ sử dụng khi người dùng YÊU CẦU cập nhật.',
        parameters: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'ID người dùng',
            },
            fullName: {
              type: 'string',
              description: 'Họ và tên đầy đủ',
            },
            phone: {
              type: 'string',
              description: 'Số điện thoại',
            },
            email: {
              type: 'string',
              description: 'Email',
            },
            street: {
              type: 'string',
              description: 'Địa chỉ đường phố',
            },
            ward: {
              type: 'string',
              description: 'Phường/Xã',
            },
            district: {
              type: 'string',
              description: 'Quận/Huyện',
            },
            province: {
              type: 'string',
              description: 'Tỉnh/Thành phố',
            },
          },
          required: ['userId'],
        },
      },
      {
        name: 'send_contact_email',
        description: 'Gửi email liên hệ đến MatFlow thay mặt người dùng. CHỈ sử dụng khi người dùng YÊU CẦU gửi email.',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Tên người gửi',
            },
            email: {
              type: 'string',
              description: 'Email người gửi',
            },
            subject: {
              type: 'string',
              description: 'Tiêu đề email',
            },
            message: {
              type: 'string',
              description: 'Nội dung email',
            },
          },
          required: ['name', 'email', 'subject', 'message'],
        },
      },
      {
        name: 'get_user_orders',
        description: 'Lấy danh sách đơn hàng của NGƯỜI DÙNG HIỆN TẠI. Nếu không truyền userId, hệ thống sẽ dùng userId đã đăng nhập.',
        parameters: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'ID người dùng (tùy chọn, mặc định dùng người dùng hiện tại)',
            },
            limit: {
              type: 'number',
              description: 'Số lượng đơn hàng tối đa (mặc định 10)',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_order_status',
        description: 'Kiểm tra trạng thái đơn hàng theo mã đơn hàng.',
        parameters: {
          type: 'object',
          properties: {
            orderCode: {
              type: 'string',
              description: 'Mã đơn hàng',
            },
          },
          required: ['orderCode'],
        },
      },
      {
        name: 'check_product_stock',
        description: 'Kiểm tra tồn kho của một hoặc nhiều sản phẩm.',
        parameters: {
          type: 'object',
          properties: {
            productIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'Danh sách ID sản phẩm cần kiểm tra',
            },
          },
          required: ['productIds'],
        },
      },
      // ========== ADVANCED DATABASE TOOLS ==========
      {
        name: 'get_categories',
        description: 'Lấy danh sách tất cả danh mục sản phẩm, bao gồm cả danh mục con.',
        parameters: {
          type: 'object',
          properties: {
            includeInactive: {
              type: 'boolean',
              description: 'Bao gồm cả danh mục không hoạt động (mặc định false)',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_product_reviews',
        description: 'Lấy đánh giá của một sản phẩm cụ thể.',
        parameters: {
          type: 'object',
          properties: {
            productId: {
              type: 'string',
              description: 'ID sản phẩm',
            },
            limit: {
              type: 'number',
              description: 'Số lượng đánh giá tối đa (mặc định 10)',
            },
          },
          required: ['productId'],
        },
      },
      {
        name: 'query_database',
        description: 'Truy vấn database với điều kiện tùy chỉnh (dùng cho câu hỏi phức tạp). Hỗ trợ: products, orders, users (chỉ số lượng), categories, reviews.',
        parameters: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Tên bảng: products, orders, users, categories, reviews',
              enum: ['products', 'orders', 'users', 'categories', 'reviews'],
            },
            filters: {
              type: 'object',
              description: 'Các điều kiện lọc (ví dụ: { "price": { "gte": 100000 }, "stock": { "gt": 0 } })',
            },
            orderBy: {
              type: 'string',
              description: 'Sắp xếp theo trường. Valid fields: products=[price,stock,createdAt,updatedAt,name], orders=[createdAt,updatedAt,totalAmount,status], categories=[name,createdAt,updatedAt], reviews=[rating,createdAt]',
            },
            limit: {
              type: 'number',
              description: 'Giới hạn kết quả (mặc định 10, tối đa 50)',
            },
          },
          required: ['table'],
        },
      },
      {
        name: 'get_statistics',
        description: 'Lấy thống kê tổng quan về hệ thống (số sản phẩm, đơn hàng, người dùng, doanh thu, v.v.).',
        parameters: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              description: 'Loại thống kê: overview, products, orders, revenue',
              enum: ['overview', 'products', 'orders', 'revenue'],
            },
            period: {
              type: 'string',
              description: 'Khoảng thời gian: today, week, month, year (mặc định month)',
            },
          },
          required: ['type'],
        },
      },
    ];
  }

  /**
   * Execute a tool call
   */
  async executeTool(toolCall: ToolCall, userId?: string): Promise<ToolResult> {
    this.logger.log(`Executing tool: ${toolCall.name} with args: ${JSON.stringify(toolCall.arguments)}`);

    try {
      switch (toolCall.name) {
        case 'search_products':
          return await this.searchProducts(toolCall.arguments);
        
        case 'get_product_details':
          return await this.getProductDetails(toolCall.arguments);
        
        case 'add_to_cart':
          return await this.addToCart(toolCall.arguments, userId);
        
        case 'add_multiple_to_cart':
          return await this.addMultipleToCart(toolCall.arguments, userId);
        
        case 'update_user_profile':
          return await this.updateUserProfile(toolCall.arguments, userId);
        
        case 'send_contact_email':
          return await this.sendContactEmail(toolCall.arguments);
        
        case 'get_user_orders':
          return await this.getUserOrders({ ...toolCall.arguments, userId: toolCall.arguments.userId || userId });
        
        case 'get_order_status':
          return await this.getOrderStatus(toolCall.arguments);
        
        case 'check_product_stock':
          return await this.checkProductStock(toolCall.arguments);
        
        case 'get_categories':
          return await this.getCategories(toolCall.arguments);
        
        case 'get_product_reviews':
          return await this.getProductReviews(toolCall.arguments);
        
        case 'query_database':
          return await this.queryDatabase(toolCall.arguments);
        
        case 'get_statistics':
          return await this.getStatistics(toolCall.arguments);
        
        default:
          return {
            success: false,
            error: `Unknown tool: ${toolCall.name}`,
          };
      }
    } catch (error) {
      this.logger.error(`Tool execution error: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message || 'Lỗi khi thực thi công cụ',
      };
    }
  }

  /**
   * TOOL IMPLEMENTATIONS
   */

  private async searchProducts(args: any): Promise<ToolResult> {
    const { query, category, minPrice, maxPrice, sortBy, limit = 10 } = args;
    
    // Max limit 50 products
    const maxLimit = Math.min(limit || 10, 50);

    // Build price filter
    const priceFilter: any = {};
    if (minPrice !== undefined && minPrice !== null) {
      priceFilter.gte = Number(minPrice);
    }
    if (maxPrice !== undefined && maxPrice !== null) {
      priceFilter.lte = Number(maxPrice);
    }

    // Build orderBy based on sortBy parameter
    let orderBy: any = { createdAt: 'desc' }; // Default: mới nhất
    
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'stock_desc':
        orderBy = { stock: 'desc' };
        break;
      default:
        // Nếu không có sortBy, ưu tiên sản phẩm còn hàng
        orderBy = [{ stock: 'desc' }, { createdAt: 'desc' }];
    }

    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        AND: [
          query ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          } : {},
          category ? {
            category: {
              name: { contains: category, mode: 'insensitive' },
            },
          } : {},
          // Price range filter
          Object.keys(priceFilter).length > 0 ? {
            price: priceFilter,
          } : {},
        ],
      },
      include: {
        category: true,
        images: { take: 1 },
      },
      take: maxLimit,
      orderBy: orderBy,
    });

    // Build descriptive message
    let message = `Tìm thấy ${products.length} sản phẩm`;
    
    // Thêm thông tin sắp xếp
    const sortMessages: Record<string, string> = {
      'newest': '(mới nhất)',
      'price_asc': '(giá thấp đến cao)',
      'price_desc': '(giá cao đến thấp)',
      'stock_desc': '(nhiều hàng nhất)',
    };
    
    if (sortBy && sortMessages[sortBy]) {
      message += ` ${sortMessages[sortBy]}`;
    }
    
    // Thêm thông tin giá
    if (minPrice || maxPrice) {
      const priceRange = [];
      if (minPrice) priceRange.push(`từ ${minPrice.toLocaleString('vi-VN')} VND`);
      if (maxPrice) priceRange.push(`đến ${maxPrice.toLocaleString('vi-VN')} VND`);
      message += ` trong khoảng giá ${priceRange.join(' ')}`;
    }
    
    message += '.';

    return {
      success: true,
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        category: p.category?.name,
        description: p.description?.substring(0, 200),
        image: p.images[0]?.url,
      })),
      message,
    };
  }

  private async getProductDetails(args: any): Promise<ToolResult> {
    const { productId } = args;

    const product = await this.prisma.product.findFirst({
      where: {
        OR: [
          { id: productId },
          { slug: productId },
        ],
        isActive: true,
      },
      include: {
        category: true,
        images: true,
        reviews: {
          where: { status: 'PUBLISHED' },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      return {
        success: false,
        error: 'Không tìm thấy sản phẩm',
      };
    }

    return {
      success: true,
      data: {
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        description: product.description,
        category: product.category?.name,
        images: product.images.map(img => img.url),
        avgRating: product.reviews.length > 0 
          ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length 
          : 0,
        reviewCount: product.reviews.length,
      },
      message: 'Lấy thông tin sản phẩm thành công',
    };
  }

  private async addToCart(args: any, userId?: string): Promise<ToolResult> {
    const { productId, quantity = 1 } = args;
    const targetUserId = args.userId || userId;

    this.logger.log(`addToCart called with productId: ${productId}, quantity: ${quantity}`);

    // Guest users can add to cart (localStorage)
    // if (!targetUserId) {
    //   return {
    //     success: false,
    //     error: 'Cần đăng nhập để thêm vào giỏ hàng',
    //     message: 'Vui lòng đăng nhập trước khi thêm sản phẩm vào giỏ hàng.',
    //   };
    // }

    // Verify product exists and has stock
    const product = await this.prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      this.logger.warn(`Product not found: ${productId}`);
      return {
        success: false,
        error: 'Sản phẩm không tồn tại hoặc không còn kinh doanh',
        message: 'Xin lỗi, sản phẩm này hiện không có sẵn.',
      };
    }

    if (product.stock < quantity) {
      this.logger.warn(`Insufficient stock for ${product.name}: requested ${quantity}, available ${product.stock}`);
      return {
        success: false,
        error: `Chỉ còn ${product.stock} sản phẩm trong kho`,
        message: product.stock > 0
          ? `Xin lỗi, sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho. Bạn có muốn thêm ${product.stock} sản phẩm không?`
          : `Xin lỗi, sản phẩm "${product.name}" hiện tạm hết hàng. Bạn có muốn xem sản phẩm tương tự không?`,
      };
    }

    this.logger.log(`Added to cart: ${product.name} (${productId}) x${quantity}`);

    // Calculate remaining stock
    const remainingStock = product.stock - quantity;

    // Return cart item data (frontend will handle localStorage)
    return {
      success: true,
      data: {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity,
        stock: product.stock,
        remainingStock,
      },
      message: quantity === 1 
        ? `Đã thêm "${product.name}" vào giỏ hàng!`
        : `Đã thêm ${quantity}x "${product.name}" vào giỏ hàng! (Còn lại ${remainingStock} trong kho)`,
    };
  }

  private async addMultipleToCart(args: any, userId?: string): Promise<ToolResult> {
    const { products } = args;
    const targetUserId = args.userId || userId;

    this.logger.log(`addMultipleToCart called with ${products?.length || 0} products`);

    if (!products || products.length === 0) {
      this.logger.warn('Empty products list provided');
      return {
        success: false,
        error: 'Danh sách sản phẩm trống',
      };
    }

    const results = [];
    const successProducts = [];
    const failedProducts = [];

    // Process each product
    for (const item of products) {
      this.logger.log(`   Processing: ${item.productId} x${item.quantity || 1}`);
      
      const result = await this.addToCart(
        { productId: item.productId, quantity: item.quantity || 1 },
        targetUserId,
      );

      if (result.success) {
        successProducts.push(result.data.productName);
        results.push(result.data);
      } else {
        this.logger.warn(`   Failed: ${result.error}`);
        failedProducts.push({ name: item.productId, error: result.error });
      }
    }

    if (successProducts.length === 0) {
      this.logger.error('All products failed to add');
      return {
        success: false,
        error: 'Không thể thêm sản phẩm nào vào giỏ hàng',
        message: `Không thể thêm sản phẩm. ${failedProducts[0]?.error || 'Vui lòng thử lại.'}`,
      };
    }

    const message = successProducts.length === products.length
      ? `Đã thêm ${successProducts.length} sản phẩm vào giỏ hàng: ${successProducts.join(', ')}`
      : `Đã thêm ${successProducts.length}/${products.length} sản phẩm vào giỏ hàng. Một số sản phẩm không thể thêm.`;

    this.logger.log(`Successfully added ${successProducts.length}/${products.length} products`);
    this.logger.log(`Returning data array with ${results.length} items`);

    return {
      success: true,
      data: results, // Array of product data
      message,
    };
  }

  private async updateUserProfile(args: any, userId?: string): Promise<ToolResult> {
    const targetUserId = args.userId || userId;

    if (!targetUserId) {
      return {
        success: false,
        error: 'Cần đăng nhập để cập nhật thông tin',
      };
    }

    // Remove userId from args to avoid passing it to update
    const updateData = { ...args };
    delete updateData.userId;

    // Get current user info for authorization
    const currentUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, username: true },
    });

    if (!currentUser) {
      return {
        success: false,
        error: 'Người dùng không tồn tại',
      };
    }

    // Update user profile
    const updatedUser = await this.usersService.update(
      targetUserId,
      updateData,
      currentUser,
    );

    return {
      success: true,
      data: updatedUser,
      message: 'Đã cập nhật thông tin cá nhân thành công!',
    };
  }

  private async sendContactEmail(args: any): Promise<ToolResult> {
    const { name, email, subject, message } = args;

    await this.contactService.sendContactMessage({
      name,
      email,
      subject,
      message,
    });

    return {
      success: true,
      message: `Đã gửi email liên hệ đến MatFlow thành công! Chúng tôi sẽ phản hồi sớm nhất có thể.`,
    };
  }

  private async getUserOrders(args: any): Promise<ToolResult> {
    const { userId, limit = 10 } = args;

    if (!userId) {
      return {
        success: false,
        error: 'Thiếu thông tin người dùng',
        message: 'Không xác định được người dùng hiện tại. Vui lòng đăng nhập lại.',
      };
    }

    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return {
      success: true,
      data: orders.map(order => ({
        code: order.code,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        itemCount: order.items.length,
      })),
      message: `Tìm thấy ${orders.length} đơn hàng.`,
    };
  }

  private async getOrderStatus(args: any): Promise<ToolResult> {
    const { orderCode } = args;

    const order = await this.prisma.order.findUnique({
      where: { code: orderCode },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return {
        success: false,
        error: 'Không tìm thấy đơn hàng',
        message: `Không tìm thấy đơn hàng với mã "${orderCode}".`,
      };
    }

    const statusMap = {
      PENDING: 'Đang chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      SHIPPING: 'Đang giao hàng',
      COMPLETED: 'Đã hoàn thành',
      CANCELLED: 'Đã hủy',
      RETURNED: 'Đã trả hàng',
    };

    return {
      success: true,
      data: {
        code: order.code,
        status: order.status,
        statusText: statusMap[order.status],
        totalAmount: order.totalAmount,
        isPaid: order.isPaid,
        createdAt: order.createdAt,
        items: order.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })),
      },
      message: `Đơn hàng ${orderCode} đang ở trạng thái: ${statusMap[order.status]}`,
    };
  }

  private async checkProductStock(args: any): Promise<ToolResult> {
    const { productIds } = args;

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        stock: true,
        price: true,
      },
    });

    return {
      success: true,
      data: products.map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        available: p.stock > 0,
      })),
      message: `Đã kiểm tra tồn kho ${products.length} sản phẩm.`,
    };
  }

  // ========== ADVANCED DATABASE TOOL IMPLEMENTATIONS ==========

  private async getCategories(args: any): Promise<ToolResult> {
    const { includeInactive = false } = args;

    const categories = await this.prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
        children: {
          where: includeInactive ? {} : { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return {
      success: true,
      data: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        productCount: cat._count.products,
        hasChildren: cat.children.length > 0,
        children: cat.children,
      })),
      message: `Tìm thấy ${categories.length} danh mục.`,
    };
  }

  private async getProductReviews(args: any): Promise<ToolResult> {
    const { productId, limit = 10 } = args;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { name: true },
    });

    if (!product) {
      return {
        success: false,
        error: 'Không tìm thấy sản phẩm',
      };
    }

    const reviews = await this.prisma.review.findMany({
      where: { productId, status: 'PUBLISHED' },
      include: {
        user: {
          select: { fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return {
      success: true,
      data: {
        productName: product.name,
        totalReviews: reviews.length,
        avgRating: avgRating.toFixed(1),
        reviews: reviews.map(r => ({
          rating: r.rating,
          content: r.content,
          author: r.user.fullName,
          createdAt: r.createdAt,
        })),
      },
      message: `Sản phẩm "${product.name}" có ${reviews.length} đánh giá với điểm trung bình ${avgRating.toFixed(1)}/5.`,
    };
  }

  private async queryDatabase(args: any): Promise<ToolResult> {
    const { table, filters = {}, orderBy, limit = 10 } = args;
    const maxLimit = Math.min(limit, 50); // Giới hạn tối đa 50 để tránh overload

    try {
      switch (table) {
        case 'products': {
          // ✅ Validate orderBy field - chỉ cho phép các field hợp lệ
          const validProductOrderFields = ['price', 'stock', 'createdAt', 'updatedAt', 'name'];
          let validOrderBy = 'createdAt'; // default
          
          if (orderBy && validProductOrderFields.includes(orderBy)) {
            validOrderBy = orderBy;
          } else if (orderBy && !validProductOrderFields.includes(orderBy)) {
            this.logger.warn(`⚠️ Invalid orderBy field "${orderBy}" for products. Using default: createdAt`);
          }

          const products = await this.prisma.product.findMany({
            where: {
              isActive: true,
              ...filters,
            },
            include: {
              category: true,
              _count: { select: { reviews: true } },
            },
            orderBy: { [validOrderBy]: 'desc' },
            take: maxLimit,
          });

          return {
            success: true,
            data: products.map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              stock: p.stock,
              category: p.category?.name,
              reviewCount: p._count.reviews,
            })),
            message: `Tìm thấy ${products.length} sản phẩm.`,
          };
        }

        case 'orders': {
          // ✅ Validate orderBy field
          const validOrderOrderFields = ['createdAt', 'updatedAt', 'totalAmount', 'status'];
          let validOrderOrderBy = 'createdAt';
          
          if (orderBy && validOrderOrderFields.includes(orderBy)) {
            validOrderOrderBy = orderBy;
          } else if (orderBy && !validOrderOrderFields.includes(orderBy)) {
            this.logger.warn(`⚠️ Invalid orderBy field "${orderBy}" for orders. Using default: createdAt`);
          }

          const orders = await this.prisma.order.findMany({
            where: filters,
            include: {
              user: { select: { fullName: true, email: true } },
              _count: { select: { items: true } },
            },
            orderBy: { [validOrderOrderBy]: 'desc' },
            take: maxLimit,
          });

          return {
            success: true,
            data: orders.map(o => ({
              code: o.code,
              status: o.status,
              totalAmount: o.totalAmount,
              itemCount: o._count.items,
              customer: o.user.fullName,
              createdAt: o.createdAt,
            })),
            message: `Tìm thấy ${orders.length} đơn hàng.`,
          };
        }

        case 'users': {
          // CHỈ trả về thống kê, không trả về thông tin cá nhân
          const count = await this.prisma.user.count({ where: filters });
          return {
            success: true,
            data: { totalUsers: count },
            message: `Có ${count} người dùng.`,
          };
        }

        case 'categories': {
          // ✅ Validate orderBy field
          const validCategoryOrderFields = ['name', 'createdAt', 'updatedAt'];
          let validCategoryOrderBy = 'name';
          
          if (orderBy && validCategoryOrderFields.includes(orderBy)) {
            validCategoryOrderBy = orderBy;
          } else if (orderBy && !validCategoryOrderFields.includes(orderBy)) {
            this.logger.warn(`⚠️ Invalid orderBy field "${orderBy}" for categories. Using default: name`);
          }

          const categories = await this.prisma.category.findMany({
            where: { isActive: true, ...filters },
            include: {
              _count: { select: { products: true } },
            },
            orderBy: { [validCategoryOrderBy]: orderBy === 'name' ? 'asc' : 'desc' },
            take: maxLimit,
          });

          return {
            success: true,
            data: categories.map(c => ({
              name: c.name,
              productCount: c._count.products,
            })),
            message: `Tìm thấy ${categories.length} danh mục.`,
          };
        }

        case 'reviews': {
          // ✅ Validate orderBy field
          const validReviewOrderFields = ['rating', 'createdAt'];
          let validReviewOrderBy = 'createdAt';
          
          if (orderBy && validReviewOrderFields.includes(orderBy)) {
            validReviewOrderBy = orderBy;
          } else if (orderBy && !validReviewOrderFields.includes(orderBy)) {
            this.logger.warn(`⚠️ Invalid orderBy field "${orderBy}" for reviews. Using default: createdAt`);
          }

          const reviews = await this.prisma.review.findMany({
            where: { status: 'PUBLISHED', ...filters },
            include: {
              product: { select: { name: true } },
              user: { select: { fullName: true } },
            },
            orderBy: { [validReviewOrderBy]: 'desc' },
            take: maxLimit,
          });

          return {
            success: true,
            data: reviews.map(r => ({
              product: r.product.name,
              rating: r.rating,
              content: r.content.substring(0, 200),
              author: r.user.fullName,
            })),
            message: `Tìm thấy ${reviews.length} đánh giá.`,
          };
        }

        default:
          return {
            success: false,
            error: `Bảng không được hỗ trợ: ${table}`,
          };
      }
    } catch (error) {
      this.logger.error(`Query database error for table ${table}:`, error);
      return {
        success: false,
        error: `Lỗi khi truy vấn bảng ${table}: ${error.message}`,
      };
    }
  }

  private async getStatistics(args: any): Promise<ToolResult> {
    const { type, period = 'month' } = args;

    try {
      // Calculate date filter based on period
      const now = new Date();
      let dateFilter: Date;
      
      switch (period) {
        case 'today':
          dateFilter = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          dateFilter = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          dateFilter = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          dateFilter = new Date(now.setMonth(now.getMonth() - 1));
      }

      switch (type) {
        case 'overview': {
          const [productsCount, ordersCount, usersCount, activeProducts] = await Promise.all([
            this.prisma.product.count(),
            this.prisma.order.count({ where: { createdAt: { gte: dateFilter } } }),
            this.prisma.user.count(),
            this.prisma.product.count({ where: { isActive: true, stock: { gt: 0 } } }),
          ]);

          return {
            success: true,
            data: {
              totalProducts: productsCount,
              activeProducts,
              totalOrders: ordersCount,
              totalUsers: usersCount,
              period,
            },
            message: `Tổng quan: ${productsCount} sản phẩm, ${ordersCount} đơn hàng (${period}), ${usersCount} người dùng.`,
          };
        }

        case 'products': {
          const [total, active, outOfStock, avgPrice] = await Promise.all([
            this.prisma.product.count(),
            this.prisma.product.count({ where: { isActive: true, stock: { gt: 0 } } }),
            this.prisma.product.count({ where: { stock: 0 } }),
            this.prisma.product.aggregate({ _avg: { price: true } }),
          ]);

          return {
            success: true,
            data: {
              total,
              active,
              outOfStock,
              avgPrice: avgPrice._avg.price || 0,
            },
            message: `Sản phẩm: ${total} tổng, ${active} còn hàng, ${outOfStock} hết hàng.`,
          };
        }

        case 'orders': {
          const orders = await this.prisma.order.findMany({
            where: { createdAt: { gte: dateFilter } },
            select: { status: true },
          });

          const statusCount = orders.reduce((acc, o) => {
            acc[o.status] = (acc[o.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return {
            success: true,
            data: {
              total: orders.length,
              byStatus: statusCount,
              period,
            },
            message: `Đơn hàng (${period}): ${orders.length} đơn.`,
          };
        }

        case 'revenue': {
          const orders = await this.prisma.order.findMany({
            where: {
              createdAt: { gte: dateFilter },
              status: { in: ['COMPLETED', 'CONFIRMED', 'SHIPPING'] },
            },
            select: { totalAmount: true, isPaid: true },
          });

          const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
          const paidRevenue = orders.filter(o => o.isPaid).reduce((sum, o) => sum + o.totalAmount, 0);

          return {
            success: true,
            data: {
              totalRevenue,
              paidRevenue,
              unpaidRevenue: totalRevenue - paidRevenue,
              orderCount: orders.length,
              period,
            },
            message: `Doanh thu (${period}): ${totalRevenue.toLocaleString('vi-VN')} VND từ ${orders.length} đơn hàng.`,
          };
        }

        default:
          return {
            success: false,
            error: `Loại thống kê không hợp lệ: ${type}`,
          };
      }
    } catch (error) {
      this.logger.error(`Get statistics error for type ${type}:`, error);
      return {
        success: false,
        error: `Lỗi khi lấy thống kê: ${error.message}`,
      };
    }
  }
}

