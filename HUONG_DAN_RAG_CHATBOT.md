# 🤖 Hướng dẫn tích hợp RAG Chatbot vào MatFlow

## 📋 Mục lục
1. [Giới thiệu](#giới-thiệu)
2. [Kiến trúc tích hợp](#kiến-trúc-tích-hợp)
3. [Chuẩn bị môi trường](#chuẩn-bị-môi-trường)
4. [Bước 1: Cài đặt dependencies](#bước-1-cài-đặt-dependencies)
5. [Bước 2: Tạo modules mới](#bước-2-tạo-modules-mới)
6. [Bước 3: Xử lý dữ liệu và embeddings](#bước-3-xử-lý-dữ-liệu-và-embeddings)
7. [Bước 4: Tích hợp Frontend](#bước-4-tích-hợp-frontend)
8. [Testing & Deployment](#testing--deployment)
9. [Tối ưu hóa](#tối-ưu-hóa)

---

## 🎯 Giới thiệu

### Mục tiêu
Tích hợp **RAG Chatbot** vào hệ thống MatFlow hiện có để:
- ✅ Tư vấn sản phẩm vật tư xây dựng thông minh
- ✅ Trả lời câu hỏi dựa trên database products có sẵn
- ✅ Sử dụng Local LLM (không cần API key)
- ✅ Không làm ảnh hưởng đến hệ thống hiện tại

### RAG (Retrieval Augmented Generation)
- **Retrieval**: Tìm sản phẩm liên quan từ PostgreSQL
- **Augmented**: Bổ sung context vào prompt
- **Generation**: AI tạo câu trả lời tư vấn

---

## 🏗️ Kiến trúc tích hợp

```
MatFlow Backend (NestJS - Port 3000)
├── Modules hiện có
│   ├── Products, Categories, Orders...
│   └── Prisma + PostgreSQL
│
└── 🆕 Modules mới cho RAG
    ├── ChatModule          → API endpoint /api/chatbot/*
    ├── LlmModule           → Gọi Ollama (port 11434)
    ├── VectorModule        → Tìm kiếm semantic
    └── EmbeddingModule     → Tạo embeddings (Python microservice port 5000)

Luồng hoạt động:
User → Frontend → /api/chatbot/chat → ChatService 
  ↓
VectorService → Tìm sản phẩm liên quan trong DB
  ↓
LlmService → Ollama → Tạo câu trả lời
  ↓
Response với nguồn tham khảo
```

---

## 📦 Chuẩn bị môi trường

### Yêu cầu hệ thống
- **RAM**: Tối thiểu 8GB (khuyên dùng 16GB)
- **OS**: Windows 10/11, macOS, Linux
- **Node.js**: 16+ (đã có)
- **Python**: 3.10+ (cần cài thêm)
- **PostgreSQL**: Đang chạy (đã có)

### 1. Cài đặt Ollama

**Windows:**
```bash
# Download và cài đặt từ: https://ollama.ai/download
# Sau khi cài, mở PowerShell:

# Pull model tiếng Việt nhẹ (3-4GB)
ollama pull llama3.2:3b

# Hoặc model tốt hơn (8GB RAM+)
ollama pull llama3.1:8b

# Test
ollama run llama3.2:3b
>>> Xin chào, bạn là ai?
>>> /bye
```

### 2. Cài đặt Python & Dependencies

```bash
# Kiểm tra Python
python --version  # Cần 3.10+

# Nếu chưa có, download tại: https://www.python.org/downloads/

# Cài các thư viện cần thiết
pip install flask
pip install sentence-transformers
pip install chromadb
pip install psycopg2-binary
pip install python-dotenv
```

---

## 🔨 Bước 1: Cài đặt dependencies

### 1.1. Cài packages cho NestJS

```bash
cd backend

# LangChain và Ollama integration
npm install langchain @langchain/community @langchain/core

# Axios để call Ollama API
npm install axios

# Cache manager (tùy chọn, để optimize)
npm install @nestjs/cache-manager cache-manager

# Fetch polyfill (nếu cần)
npm install node-fetch
```

### 1.2. Kiểm tra cấu trúc hiện tại

```bash
# Đảm bảo backend đang chạy được
npm run start:dev

# Kiểm tra PostgreSQL
# Đảm bảo có data sản phẩm trong database
```

---

## 🔨 Bước 2: Tạo modules mới

### 2.1. Tạo Chat Module

```bash
cd src

# Tạo module chat
nest g module chatbot
nest g service chatbot
nest g controller chatbot
```

Sau khi chạy lệnh trên, tạo các file sau:

#### `src/chatbot/chatbot.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { VectorService } from '../vector/vector.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatResponse {
  message: string;
  sources: Array<{
    productId: string;
    productName: string;
    category: string;
    price: number;
    relevanceScore: number;
  }>;
  conversationId?: string;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private conversations = new Map<string, ChatMessage[]>();

  constructor(
    private prisma: PrismaService,
    private llmService: LlmService,
    private vectorService: VectorService,
  ) {}

  async chat(
    message: string,
    conversationId?: string,
  ): Promise<ChatResponse> {
    this.logger.log(`Received message: ${message}`);
    const startTime = Date.now();

    try {
      // 1. Lưu tin nhắn user
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      if (!conversationId) {
        conversationId = this.generateConversationId();
        this.conversations.set(conversationId, []);
      }

      const history = this.conversations.get(conversationId) || [];
      history.push(userMessage);

      // 2. Tìm kiếm sản phẩm liên quan
      const relevantProducts = await this.vectorService.searchRelevantProducts(
        message,
        5,
      );

      this.logger.log(`Found ${relevantProducts.length} relevant products`);

      // 3. Tạo context từ sản phẩm
      const context = this.buildContext(relevantProducts);

      // 4. Gọi LLM để tạo câu trả lời
      const aiResponse = await this.llmService.generateResponse(
        message,
        context,
        history.slice(-4), // Lấy 4 tin nhắn gần nhất
      );

      // 5. Lưu câu trả lời
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      history.push(assistantMessage);

      // Giới hạn history (100 tin nhắn)
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }

      const duration = Date.now() - startTime;
      this.logger.log(`Response generated in ${duration}ms`);

      return {
        message: aiResponse,
        sources: relevantProducts.map((p) => ({
          productId: p.id,
          productName: p.name,
          category: p.category?.name || 'N/A',
          price: p.price,
          relevanceScore: p.score,
        })),
        conversationId,
      };
    } catch (error) {
      this.logger.error('Chat error:', error);
      throw new Error('Không thể xử lý tin nhắn. Vui lòng thử lại.');
    }
  }

  private buildContext(products: any[]): string {
    if (products.length === 0) {
      return 'Không tìm thấy sản phẩm liên quan trong hệ thống.';
    }

    const context = products
      .map((p, idx) => {
        return `
[Sản phẩm ${idx + 1}]
- Tên: ${p.name}
- Danh mục: ${p.category?.name || 'N/A'}
- Giá: ${p.price.toLocaleString('vi-VN')} VND
- Tồn kho: ${p.stock} sản phẩm
- Mô tả: ${p.description || 'Không có mô tả'}
`.trim();
      })
      .join('\n\n');

    return context;
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  async getSystemStatus() {
    const llmStatus = await this.llmService.checkStatus();
    const productsCount = await this.prisma.product.count({
      where: { isActive: true },
    });

    return {
      llm: llmStatus,
      database: {
        connected: true,
        productsCount,
      },
      status: llmStatus.available ? 'ready' : 'llm_unavailable',
    };
  }
}
```

#### `src/chatbot/chatbot.controller.ts`

```typescript
import { Controller, Post, Get, Body, Query, Delete } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

class ChatRequestDto {
  message: string;
  conversationId?: string;
}

@ApiTags('Chatbot')
@Controller('api/chatbot')
export class ChatbotController {
  constructor(private chatbotService: ChatbotService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Gửi tin nhắn đến chatbot' })
  @ApiResponse({ status: 200, description: 'Trả về câu trả lời từ AI' })
  async chat(@Body() body: ChatRequestDto) {
    return this.chatbotService.chat(body.message, body.conversationId);
  }

  @Get('status')
  @ApiOperation({ summary: 'Kiểm tra trạng thái chatbot' })
  async getStatus() {
    return this.chatbotService.getSystemStatus();
  }

  @Delete('conversation')
  @ApiOperation({ summary: 'Xóa lịch sử hội thoại' })
  async clearConversation(@Query('id') conversationId: string) {
    this.chatbotService.clearConversation(conversationId);
    return { message: 'Conversation cleared' };
  }
}
```

### 2.2. Tạo LLM Module (Ollama Integration)

```bash
nest g module llm
nest g service llm
```

#### `src/llm/llm.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly ollamaUrl = 'http://localhost:11434/api/generate';
  private readonly model = 'llama3.2:3b'; // Đổi thành 'llama3.1:8b' nếu RAM đủ

  async generateResponse(
    userMessage: string,
    context: string,
    history: ChatMessage[] = [],
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(userMessage, context, history);

    try {
      const response = await axios.post(
        this.ollamaUrl,
        {
          model: this.model,
          prompt: systemPrompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            num_predict: 500, // Giới hạn độ dài câu trả lời
          },
        },
        {
          timeout: 60000, // 60s timeout
        },
      );

      return response.data.response.trim();
    } catch (error) {
      this.logger.error('Ollama API error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error(
          'Không thể kết nối với Ollama. Vui lòng đảm bảo Ollama đang chạy.',
        );
      }
      
      throw new Error('Lỗi xử lý AI. Vui lòng thử lại sau.');
    }
  }

  private buildSystemPrompt(
    userMessage: string,
    context: string,
    history: ChatMessage[],
  ): string {
    let prompt = `Bạn là trợ lý ảo tư vấn của MatFlow - chuyên về vật liệu xây dựng và thiết bị công nghiệp.

THÔNG TIN SẢN PHẨM LIÊN QUAN:
${context}

NHIỆM VỤ:
- Trả lời câu hỏi của khách hàng dựa trên THÔNG TIN SẢN PHẨM ở trên
- Nếu không có thông tin phù hợp, hãy nói rõ và gợi ý khách hàng tìm theo cách khác
- Trả lời bằng tiếng Việt, thân thiện, chuyên nghiệp
- Đưa ra thông tin cụ thể về giá, đặc điểm sản phẩm
- Có thể so sánh nhiều sản phẩm nếu khách hàng hỏi
- Gợi ý sản phẩm phù hợp với nhu cầu

`;

    // Thêm lịch sử hội thoại
    if (history.length > 0) {
      prompt += '\nLỊCH SỬ HỘI THOẠI:\n';
      history.forEach((msg) => {
        const role = msg.role === 'user' ? 'Khách hàng' : 'Bạn';
        prompt += `${role}: ${msg.content}\n`;
      });
      prompt += '\n';
    }

    prompt += `CÂU HỎI HIỆN TẠI: ${userMessage}

TRẢ LỜI (chỉ trả lời, không thêm meta text):`;

    return prompt;
  }

  async checkStatus() {
    try {
      const response = await axios.get('http://localhost:11434/api/tags', {
        timeout: 5000,
      });
      
      const models = response.data.models || [];
      const hasModel = models.some((m) => m.name.includes(this.model.split(':')[0]));

      return {
        available: true,
        model: this.model,
        modelInstalled: hasModel,
        modelsAvailable: models.map((m) => m.name),
      };
    } catch (error) {
      return {
        available: false,
        error: 'Ollama không chạy hoặc không có model',
      };
    }
  }
}
```

#### `src/llm/llm.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';

@Module({
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
```

### 2.3. Tạo Vector Module (Semantic Search)

```bash
nest g module vector
nest g service vector
```

#### `src/vector/vector.service.ts`

```typescript
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
   * Tìm kiếm sản phẩm liên quan sử dụng Full-Text Search của PostgreSQL
   * Trong tương lai có thể nâng cấp lên vector embeddings với ChromaDB
   */
  async searchRelevantProducts(
    query: string,
    limit: number = 5,
  ): Promise<SearchResult[]> {
    try {
      // Chuẩn hóa query
      const normalizedQuery = query
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .trim();

      // Tách thành keywords
      const keywords = normalizedQuery.split(/\s+/).filter((k) => k.length > 2);

      if (keywords.length === 0) {
        return this.getTopProducts(limit);
      }

      this.logger.log(`Searching for keywords: ${keywords.join(', ')}`);

      // Tìm kiếm trong products
      const products = await this.prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            {
              name: {
                contains: normalizedQuery,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: normalizedQuery,
                mode: 'insensitive',
              },
            },
            {
              category: {
                name: {
                  contains: normalizedQuery,
                  mode: 'insensitive',
                },
              },
            },
            // Tìm theo từng keyword
            ...keywords.map((keyword) => ({
              name: {
                contains: keyword,
                mode: 'insensitive',
              },
            })),
          ],
        },
        include: {
          category: true,
        },
        take: limit * 2, // Lấy nhiều hơn để filter sau
      });

      // Tính relevance score
      const scoredProducts = products.map((product) => {
        let score = 0;

        // Khớp chính xác query
        if (product.name.toLowerCase().includes(normalizedQuery)) {
          score += 10;
        }
        if (product.description?.toLowerCase().includes(normalizedQuery)) {
          score += 5;
        }

        // Khớp từng keyword
        keywords.forEach((keyword) => {
          if (product.name.toLowerCase().includes(keyword)) {
            score += 3;
          }
          if (product.description?.toLowerCase().includes(keyword)) {
            score += 1;
          }
          if (product.category?.name.toLowerCase().includes(keyword)) {
            score += 2;
          }
        });

        // Boost sản phẩm còn hàng
        if (product.stock > 0) {
          score += 2;
        }

        return {
          ...product,
          score,
        };
      });

      // Sắp xếp theo score và lấy top results
      const topResults = scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      this.logger.log(
        `Found ${topResults.length} products with scores: ${topResults.map((p) => p.score).join(', ')}`,
      );

      return topResults;
    } catch (error) {
      this.logger.error('Search error:', error);
      return this.getTopProducts(limit);
    }
  }

  private async getTopProducts(limit: number): Promise<SearchResult[]> {
    // Fallback: trả về sản phẩm bán chạy hoặc mới nhất
    const products = await this.prisma.product.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return products.map((p) => ({ ...p, score: 1.0 }));
  }
}
```

#### `src/vector/vector.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { VectorService } from './vector.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VectorService],
  exports: [VectorService],
})
export class VectorModule {}
```

### 2.4. Cập nhật Chatbot Module

#### `src/chatbot/chatbot.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LlmModule } from '../llm/llm.module';
import { VectorModule } from '../vector/vector.module';

@Module({
  imports: [PrismaModule, LlmModule, VectorModule],
  providers: [ChatbotService],
  controllers: [ChatbotController],
  exports: [ChatbotService],
})
export class ChatbotModule {}
```

### 2.5. Cập nhật App Module

#### `src/app.module.ts`

Thêm ChatbotModule vào imports:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthController } from './health/health.controller';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OrdersModule } from './orders/orders.module';
import { ReturnsModule } from './returns/returns.module';
import { TicketsModule } from './tickets/tickets.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ContactModule } from './contact/contact.module';
import { LocationsModule } from './locations/locations.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { PaymentsModule } from './payments/payments.module';
import { PaymentGatewayModule } from './payments-gateway/payment-gateway.module';
import { ReportsModule } from './reports/reports.module';
import { ChatbotModule } from './chatbot/chatbot.module'; // 🆕 Thêm dòng này

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    DashboardModule,
    OrdersModule,
    ReturnsModule,
    TicketsModule,
    ReviewsModule,
    ContactModule,
    LocationsModule,
    NotificationsModule,
    AuditModule,
    PaymentsModule,
    PaymentGatewayModule,
    ReportsModule,
    ChatbotModule, // 🆕 Thêm dòng này
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

---

## 🔨 Bước 3: Xử lý dữ liệu và embeddings

### 3.1. Script export dữ liệu sản phẩm (Tùy chọn)

Tạo `backend/scripts/export-products-for-training.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportProducts() {
  console.log('📦 Exporting products for training...');

  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      images: true,
    },
  });

  const documents = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.category?.name || 'Uncategorized',
    price: p.price,
    stock: p.stock,
    text: `${p.name}. ${p.description || ''}. Danh mục: ${p.category?.name || 'N/A'}. Giá: ${p.price} VND.`,
  }));

  const outputDir = path.join(__dirname, '../data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'products-export.json');
  fs.writeFileSync(outputPath, JSON.stringify(documents, null, 2), 'utf-8');

  console.log(`✅ Exported ${documents.length} products to ${outputPath}`);
}

exportProducts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Chạy script:
```bash
npx ts-node scripts/export-products-for-training.ts
```

### 3.2. Python Embedding Service (Nâng cao - Optional)

Nếu muốn sử dụng vector embeddings thay vì text search, tạo file `backend/scripts/embedding-service.py`:

```python
from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import chromadb
import json
import os

app = Flask(__name__)

# Load embedding model
print("Loading embedding model...")
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
print("Model loaded!")

# ChromaDB client
CHROMA_PATH = os.path.join(os.path.dirname(__file__), '../data/chroma')
os.makedirs(CHROMA_PATH, exist_ok=True)
chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'model': 'all-MiniLM-L6-v2'})

@app.route('/embed', methods=['POST'])
def create_embedding():
    """Tạo embedding cho text"""
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'Text is required'}), 400
    
    embedding = model.encode(text).tolist()
    
    return jsonify({'embedding': embedding, 'dimension': len(embedding)})

@app.route('/search', methods=['POST'])
def search_similar():
    """Tìm kiếm documents tương tự"""
    data = request.json
    query = data.get('query', '')
    top_k = data.get('top_k', 5)
    collection_name = data.get('collection', 'matflow_products')
    
    try:
        # Get collection
        collection = chroma_client.get_collection(name=collection_name)
        
        # Create query embedding
        query_embedding = model.encode(query).tolist()
        
        # Search
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        
        return jsonify({
            'results': results,
            'count': len(results['ids'][0]) if results['ids'] else 0
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/index', methods=['POST'])
def index_documents():
    """Index documents vào ChromaDB"""
    data = request.json
    documents = data.get('documents', [])
    collection_name = data.get('collection', 'matflow_products')
    
    if not documents:
        return jsonify({'error': 'Documents are required'}), 400
    
    try:
        # Create or get collection
        collection = chroma_client.get_or_create_collection(
            name=collection_name,
            metadata={"description": "MatFlow product embeddings"}
        )
        
        # Prepare data
        ids = [doc['id'] for doc in documents]
        texts = [doc['text'] for doc in documents]
        metadatas = [{
            'name': doc.get('name', ''),
            'category': doc.get('category', ''),
            'price': doc.get('price', 0)
        } for doc in documents]
        
        # Create embeddings
        embeddings = model.encode(texts).tolist()
        
        # Add to collection
        collection.add(
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
            ids=ids
        )
        
        return jsonify({
            'message': f'Indexed {len(documents)} documents',
            'collection': collection_name
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Embedding Service on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
```

Chạy service:
```bash
cd backend/scripts
python embedding-service.py
```

---

## 🔨 Bước 4: Tích hợp Frontend

### 4.1. Tạo file chatbot UI

Tạo `frontend/Page/homepage/chatbot.html`:

```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chatbot Tư Vấn - MatFlow</title>
    <link rel="stylesheet" href="../../styles/main.css">
    <link rel="stylesheet" href="../../styles/chatbot.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="shortcut icon" href="../../assets/Favicon MatFlow.png" type="image/x-icon">
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="header-container">
            <div class="logo">
                <img src="../../assets/Icon MatFlow.png" alt="MatFlow">
                <span>MatFlow AI Assistant</span>
            </div>
            <nav>
                <a href="homepage.html">Trang chủ</a>
                <a href="products.html">Sản phẩm</a>
            </nav>
        </div>
    </header>

    <!-- Chatbot Container -->
    <div class="chatbot-container">
        <div class="chat-header">
            <h2><i class="fas fa-robot"></i> Trợ lý AI MatFlow</h2>
            <p>Tôi có thể giúp bạn tìm vật tư xây dựng phù hợp</p>
            <button id="clearChat" class="btn-clear">
                <i class="fas fa-trash"></i> Xóa hội thoại
            </button>
        </div>

        <div class="chat-messages" id="chatMessages">
            <div class="message bot">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>Xin chào! Tôi là trợ lý AI của MatFlow. Tôi có thể giúp bạn:</p>
                    <ul>
                        <li>🔍 Tìm sản phẩm phù hợp</li>
                        <li>💰 So sánh giá cả</li>
                        <li>📊 Tư vấn vật tư xây dựng</li>
                        <li>❓ Trả lời thắc mắc</li>
                    </ul>
                    <p>Bạn cần tư vấn gì?</p>
                </div>
            </div>
        </div>

        <div class="chat-input-container">
            <textarea 
                id="chatInput" 
                placeholder="Nhập câu hỏi của bạn..."
                rows="1"
            ></textarea>
            <button id="sendMessage" class="btn-send">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>

        <div class="typing-indicator hidden" id="typingIndicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    </div>

    <script src="../../js/config.js"></script>
    <script src="../../js/chatbot.js"></script>
</body>
</html>
```

### 4.2. Tạo CSS cho chatbot

Tạo `frontend/styles/chatbot.css`:

```css
.chatbot-container {
    max-width: 900px;
    margin: 2rem auto;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    overflow: hidden;
}

.chat-header {
    background: linear-gradient(135deg, #00695C 0%, #00897B 100%);
    color: white;
    padding: 1.5rem;
    text-align: center;
}

.chat-header h2 {
    margin: 0;
    font-size: 1.5rem;
}

.chat-header p {
    margin: 0.5rem 0;
    opacity: 0.9;
}

.btn-clear {
    margin-top: 1rem;
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.3);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-clear:hover {
    background: rgba(255,255,255,0.3);
}

.chat-messages {
    height: 500px;
    overflow-y: auto;
    padding: 1.5rem;
    background: #f5f5f5;
}

.message {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.message.user {
    flex-direction: row-reverse;
}

.message-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
}

.message.bot .message-avatar {
    background: #00695C;
    color: white;
}

.message.user .message-avatar {
    background: #2196F3;
    color: white;
}

.message-content {
    background: white;
    padding: 1rem;
    border-radius: 12px;
    max-width: 70%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.message.user .message-content {
    background: #2196F3;
    color: white;
}

.message-content ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
}

.message-content li {
    margin: 0.3rem 0;
}

.product-sources {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
}

.product-sources h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    color: #666;
}

.product-source {
    background: #f9f9f9;
    padding: 0.5rem;
    margin: 0.3rem 0;
    border-radius: 6px;
    font-size: 0.85rem;
}

.product-source strong {
    color: #00695C;
}

.chat-input-container {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    background: white;
    border-top: 1px solid #eee;
}

#chatInput {
    flex: 1;
    padding: 0.8rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    resize: none;
    font-family: inherit;
    font-size: 1rem;
    transition: border-color 0.3s;
}

#chatInput:focus {
    outline: none;
    border-color: #00695C;
}

.btn-send {
    width: 50px;
    height: 50px;
    background: #00695C;
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: all 0.3s;
}

.btn-send:hover {
    background: #004D40;
    transform: scale(1.05);
}

.btn-send:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: scale(1);
}

.typing-indicator {
    display: flex;
    gap: 0.3rem;
    padding: 1rem;
    justify-content: center;
}

.typing-indicator span {
    width: 8px;
    height: 8px;
    background: #00695C;
    border-radius: 50%;
    animation: bounce 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes bounce {
    0%, 60%, 100% {
        transform: translateY(0);
    }
    30% {
        transform: translateY(-10px);
    }
}

.hidden {
    display: none !important;
}

/* Responsive */
@media (max-width: 768px) {
    .chatbot-container {
        margin: 0;
        border-radius: 0;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .chat-messages {
        flex: 1;
        height: auto;
    }

    .message-content {
        max-width: 85%;
    }
}
```

### 4.3. Tạo JavaScript cho chatbot

Tạo `frontend/js/chatbot.js`:

```javascript
// Chatbot functionality
const API_URL = window.API_BASE_URL || 'http://localhost:3000';

class ChatbotManager {
    constructor() {
        this.messagesContainer = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendMessage');
        this.clearButton = document.getElementById('clearChat');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        this.conversationId = null;
        
        this.init();
    }

    init() {
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter (Shift+Enter for new line)
        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.chatInput.addEventListener('input', () => {
            this.chatInput.style.height = 'auto';
            this.chatInput.style.height = this.chatInput.scrollHeight + 'px';
        });
        
        // Clear conversation
        this.clearButton.addEventListener('click', () => this.clearConversation());
        
        // Check system status
        this.checkSystemStatus();
    }

    async checkSystemStatus() {
        try {
            const response = await fetch(`${API_URL}/api/chatbot/status`);
            const status = await response.json();
            
            console.log('Chatbot status:', status);
            
            if (status.status !== 'ready') {
                this.addBotMessage('⚠️ Hệ thống AI đang khởi động. Vui lòng đợi một chút...');
            }
        } catch (error) {
            console.error('Status check failed:', error);
            this.addBotMessage('⚠️ Không thể kết nối với hệ thống AI. Vui lòng kiểm tra lại.');
        }
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        
        if (!message) return;
        
        // Add user message to UI
        this.addUserMessage(message);
        
        // Clear input
        this.chatInput.value = '';
        this.chatInput.style.height = 'auto';
        
        // Disable input while processing
        this.setInputState(false);
        this.showTypingIndicator();
        
        try {
            const response = await fetch(`${API_URL}/api/chatbot/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    conversationId: this.conversationId,
                }),
            });
            
            if (!response.ok) {
                throw new Error('Server error');
            }
            
            const data = await response.json();
            
            // Save conversation ID
            if (data.conversationId) {
                this.conversationId = data.conversationId;
            }
            
            // Add bot response to UI
            this.addBotMessage(data.message, data.sources);
            
        } catch (error) {
            console.error('Chat error:', error);
            this.addBotMessage('😔 Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại sau.');
        } finally {
            this.hideTypingIndicator();
            this.setInputState(true);
            this.chatInput.focus();
        }
    }

    addUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addBotMessage(message, sources = []) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot';
        
        let sourcesHtml = '';
        if (sources && sources.length > 0) {
            sourcesHtml = `
                <div class="product-sources">
                    <h4>📚 Sản phẩm tham khảo:</h4>
                    ${sources.map((source, idx) => `
                        <div class="product-source">
                            <strong>${idx + 1}. ${this.escapeHtml(source.productName)}</strong><br>
                            <span>Danh mục: ${this.escapeHtml(source.category)} | 
                            Giá: ${source.price.toLocaleString('vi-VN')} VND</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <p>${this.formatMessage(message)}</p>
                ${sourcesHtml}
            </div>
        `;
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(message) {
        // Convert line breaks to <br>
        message = this.escapeHtml(message);
        message = message.replace(/\n/g, '<br>');
        
        // Bold text between **
        message = message.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        return message;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setInputState(enabled) {
        this.chatInput.disabled = !enabled;
        this.sendButton.disabled = !enabled;
    }

    showTypingIndicator() {
        this.typingIndicator.classList.remove('hidden');
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.classList.add('hidden');
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    async clearConversation() {
        if (!confirm('Bạn có chắc muốn xóa hội thoại?')) {
            return;
        }
        
        try {
            if (this.conversationId) {
                await fetch(`${API_URL}/api/chatbot/conversation?id=${this.conversationId}`, {
                    method: 'DELETE',
                });
            }
            
            // Clear UI
            this.messagesContainer.innerHTML = `
                <div class="message bot">
                    <div class="message-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="message-content">
                        <p>Hội thoại đã được xóa. Bạn có câu hỏi mới không?</p>
                    </div>
                </div>
            `;
            
            this.conversationId = null;
            
        } catch (error) {
            console.error('Clear conversation error:', error);
        }
    }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ChatbotManager();
});
```

### 4.4. Thêm link chatbot vào header

Cập nhật các file HTML homepage để thêm link đến chatbot:

```html
<!-- Thêm vào navigation menu -->
<nav>
    <a href="homepage.html">Trang chủ</a>
    <a href="products.html">Sản phẩm</a>
    <a href="chatbot.html">🤖 Chatbot AI</a> <!-- 🆕 -->
    <a href="contact.html">Liên hệ</a>
</nav>
```

### 4.5. Floating Chatbot Button (Tùy chọn)

Thêm vào `frontend/styles/main.css`:

```css
/* Floating Chatbot Button */
.chatbot-float-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #00695C 0%, #00897B 100%);
    color: white;
    border: none;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0,105,92,0.4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    z-index: 1000;
    transition: all 0.3s;
}

.chatbot-float-button:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0,105,92,0.6);
}
```

Thêm vào các file HTML:

```html
<!-- Thêm trước </body> -->
<a href="chatbot.html" class="chatbot-float-button" title="Chat với AI">
    <i class="fas fa-robot"></i>
</a>
```

---

## 🧪 Testing & Deployment

### Testing Local

#### 1. Khởi động Ollama
```bash
# Windows PowerShell
ollama serve

# Test model
ollama run llama3.2:3b
```

#### 2. Khởi động Backend
```bash
cd backend
npm run start:dev

# Kiểm tra logs để đảm bảo chatbot module đã load
```

#### 3. Test API với Postman/Thunder Client

```http
POST http://localhost:3000/api/chatbot/chat
Content-Type: application/json

{
  "message": "Tư vấn xi măng cho tôi"
}
```

#### 4. Kiểm tra status

```http
GET http://localhost:3000/api/chatbot/status
```

Response mong đợi:
```json
{
  "llm": {
    "available": true,
    "model": "llama3.2:3b",
    "modelInstalled": true
  },
  "database": {
    "connected": true,
    "productsCount": 150
  },
  "status": "ready"
}
```

#### 5. Test Frontend
```bash
# Mở file trong browser
frontend/Page/homepage/chatbot.html

# Hoặc dùng Live Server extension trong VS Code
```

### Test Cases

```
Test 1: Tìm sản phẩm cơ bản
Input: "Tôi cần mua xi măng"
Expected: Liệt kê các loại xi măng có trong hệ thống

Test 2: Hỏi giá
Input: "Giá thép xây dựng bao nhiêu?"
Expected: Trả về giá của các sản phẩm thép

Test 3: So sánh
Input: "So sánh gạch men và gạch granite"
Expected: So sánh ưu nhược điểm và giá

Test 4: Tư vấn
Input: "Xây nhà 2 tầng cần vật liệu gì?"
Expected: Gợi ý danh sách vật tư cần thiết

Test 5: Không có sản phẩm
Input: "Bạn có bán máy bay không?"
Expected: "Xin lỗi, chúng tôi không có sản phẩm này..."
```

---

## 🚀 Deployment

### Option 1: Deploy trên VPS

```bash
# 1. Setup server (Ubuntu)
sudo apt update
sudo apt install -y curl git

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Ollama
curl https://ollama.ai/install.sh | sh

# 4. Pull model
ollama pull llama3.2:3b

# 5. Clone repo
git clone <your-repo>
cd capstone1/backend

# 6. Install & build
npm install
npm run build

# 7. Setup PM2
npm install -g pm2
pm2 start dist/main.js --name matflow-backend
pm2 startup
pm2 save

# 8. Ollama as service
sudo systemctl enable ollama
sudo systemctl start ollama
```

### Option 2: Docker (Recommended)

Cập nhật `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: matflow
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/matflow
      NODE_ENV: production
    depends_on:
      - postgres
    volumes:
      - ./backend:/app
      - /app/node_modules

  # Ollama container (if you want to run in Docker)
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        limits:
          memory: 8G

volumes:
  postgres_data:
  ollama_data:
```

---

## ⚡ Tối ưu hóa

### 1. Caching Responses

Thêm vào `chatbot.service.ts`:

```typescript
import { Cache } from '@nestjs/cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class ChatbotService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    // ... other services
  ) {}

  async chat(message: string, conversationId?: string) {
    // Check cache
    const cacheKey = `chat:${message.toLowerCase().trim()}`;
    const cached = await this.cacheManager.get(cacheKey);
    
    if (cached) {
      this.logger.log('Returning cached response');
      return cached;
    }

    // ... generate response ...

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, response, 3600);
    
    return response;
  }
}
```

### 2. Rate Limiting

```bash
npm install @nestjs/throttler
```

Cập nhật `app.module.ts`:

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 10, // 10 requests per minute
    }]),
    // ... other modules
  ],
})
```

Thêm vào `chatbot.controller.ts`:

```typescript
import { UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@UseGuards(ThrottlerGuard)
@Controller('api/chatbot')
export class ChatbotController {
  // ...
}
```

### 3. Query Optimization

Cập nhật `vector.service.ts` để sử dụng full-text search tốt hơn:

```typescript
async searchRelevantProducts(query: string, limit: number = 5) {
  // Sử dụng PostgreSQL full-text search
  const products = await this.prisma.$queryRaw`
    SELECT 
      p.*,
      c.name as category_name,
      ts_rank(
        to_tsvector('simple', p.name || ' ' || COALESCE(p.description, '')),
        plainto_tsquery('simple', ${query})
      ) as rank
    FROM products p
    LEFT JOIN categories c ON p."categoryId" = c.id
    WHERE p."isActive" = true
    AND (
      to_tsvector('simple', p.name || ' ' || COALESCE(p.description, ''))
      @@ plainto_tsquery('simple', ${query})
    )
    ORDER BY rank DESC
    LIMIT ${limit}
  `;

  return products;
}
```

### 4. Monitoring & Logging

Thêm logging chi tiết:

```typescript
async chat(message: string, conversationId?: string) {
  const startTime = Date.now();
  
  try {
    // ... process ...
    
    const duration = Date.now() - startTime;
    this.logger.log({
      message: 'Chat completed',
      duration,
      messageLength: message.length,
      productsFound: relevantProducts.length,
      conversationId,
    });
    
  } catch (error) {
    this.logger.error({
      message: 'Chat failed',
      error: error.message,
      stack: error.stack,
      userMessage: message,
    });
    throw error;
  }
}
```

---

## 📚 Troubleshooting

### Lỗi thường gặp

#### 1. "Không thể kết nối với Ollama"
```bash
# Kiểm tra Ollama đang chạy
curl http://localhost:11434/api/tags

# Nếu lỗi, restart Ollama
ollama serve
```

#### 2. "Model not found"
```bash
# Kiểm tra models đã cài
ollama list

# Pull model nếu chưa có
ollama pull llama3.2:3b
```

#### 3. "Out of memory"
```bash
# Dùng model nhỏ hơn
ollama pull llama3.2:3b

# Hoặc tăng RAM cho Docker
# Trong Docker Desktop: Settings > Resources > Memory
```

#### 4. "Connection refused to backend"
```bash
# Kiểm tra backend đang chạy
curl http://localhost:3000/api/chatbot/status

# Kiểm tra logs
cd backend
npm run start:dev
```

#### 5. "CORS error"
- Đảm bảo CORS đã được config đúng trong `main.ts`
- Kiểm tra `API_BASE_URL` trong `config.js` frontend

---

## 🎉 Kết luận

Bạn đã hoàn thành việc tích hợp RAG Chatbot vào MatFlow! 

### ✅ Checklist hoàn thành:
- [x] Cài đặt Ollama và model
- [x] Tạo 3 modules mới: Chatbot, LLM, Vector
- [x] Tích hợp với PostgreSQL có sẵn
- [x] Xây dựng UI chatbot
- [x] Test đầy đủ các chức năng
- [x] Deploy và tối ưu hóa

### 🚀 Bước tiếp theo:
1. Thu thập feedback từ người dùng
2. Cải thiện prompt engineering
3. Thêm vector embeddings (ChromaDB) cho độ chính xác cao hơn
4. Tích hợp voice input/output
5. Analytics và monitoring

### 📞 Hỗ trợ
- Ollama Docs: https://ollama.ai/
- NestJS Docs: https://docs.nestjs.com/
- GitHub Issues: [Your repo]

---

**Tác giả**: MatFlow Development Team  
**Phiên bản**: 3.0 - Tích hợp RAG  
**Cập nhật**: October 2024
