# 🤖 MatFlow Chatbot System

## 🎯 **Tổng quan hệ thống Chatbot**

### **Mục tiêu**
Tích hợp chatbot thông minh cho website MatFlow với khả năng:
- Hiểu và nắm rõ cấu trúc trang web
- Tư vấn sản phẩm thông minh
- Chọn sản phẩm phù hợp cho khách hàng
- Tự động thêm sản phẩm vào giỏ hàng
- Hỗ trợ đa ngôn ngữ
- Tư vấn kỹ thuật chuyên sâu

### **Kiến trúc tổng thể**
```
Frontend (Chat UI) ↔ Backend API ↔ AI Service ↔ Database
     ↓                    ↓           ↓
  React/Vue           NestJS      OpenAI/Claude
  Chat Interface      REST API    LLM Processing
```

## 📋 **Các thành phần cần chuẩn bị**

### **A. Backend Infrastructure**

#### **1. Database Schema mở rộng**
```sql
-- Bảng lưu trữ cuộc trò chuyện
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID,
  session_id VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Bảng lưu trữ tin nhắn
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID,
  role ENUM('user', 'assistant', 'system'),
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMP
);

-- Bảng lưu trữ context sản phẩm
CREATE TABLE product_contexts (
  id UUID PRIMARY KEY,
  product_id UUID,
  context_data JSONB,
  embedding VECTOR(1536), -- Vector embedding cho semantic search
  created_at TIMESTAMP
);
```

#### **2. API Endpoints cần thiết**
```typescript
// Chat endpoints
POST /api/chat/send-message
GET /api/chat/conversations/:id
POST /api/chat/clear-conversation

// Product search & recommendation
POST /api/chat/search-products
POST /api/chat/recommend-products
POST /api/chat/add-to-cart

// Context management
GET /api/chat/product-context
POST /api/chat/update-context
```

### **B. AI/ML Components**

#### **1. LLM Service Options**
```typescript
// Option 1: OpenAI GPT-4
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Option 2: Anthropic Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Option 3: Local LLM (Ollama)
const ollama = new Ollama({
  model: 'llama2:13b'
});
```

#### **2. Vector Database cho Semantic Search**
```typescript
// Option 1: Pinecone
import { Pinecone } from '@pinecone-database/pinecone';

// Option 2: Weaviate
import weaviate from 'weaviate-ts-client';

// Option 3: Chroma (Open Source)
import { ChromaClient } from 'chromadb';
```

### **C. Frontend Components**

#### **1. Chat Widget**
```typescript
// ChatWidget.tsx
interface ChatWidgetProps {
  isOpen: boolean;
  onToggle: () => void;
  onAddToCart: (productId: string, quantity: number) => void;
}

// ChatMessage.tsx
interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}
```

## 🛠 **Implementation Plan**

### **Phase 1: Foundation (2-3 tuần)**

#### **1.1 Backend Setup**
```bash
# Cài đặt dependencies
npm install @pinecone-database/pinecone
npm install openai
npm install @anthropic-ai/sdk
npm install langchain
npm install @langchain/openai
```

#### **1.2 Database Schema**
```typescript
// prisma/schema.prisma
model Conversation {
  id        String   @id @default(cuid())
  userId    String?
  sessionId String
  messages  Message[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  role           MessageRole
  content        String
  metadata       Json?
  createdAt      DateTime     @default(now())
  conversation   Conversation @relation(fields: [conversationId], references: [id])
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}
```

#### **1.3 Basic Chat Service**
```typescript
// src/chat/chat.service.ts
@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private openai: OpenAI,
    private productService: ProductsService
  ) {}

  async sendMessage(conversationId: string, message: string) {
    // 1. Lưu tin nhắn user
    // 2. Xử lý với LLM
    // 3. Lưu response
    // 4. Trả về kết quả
  }

  async searchProducts(query: string) {
    // Semantic search trong products
  }

  async recommendProducts(context: any) {
    // AI recommendation dựa trên context
  }
}
```

### **Phase 2: AI Integration (3-4 tuần)**

#### **2.1 Product Knowledge Base**
```typescript
// Tạo vector embeddings cho sản phẩm
async function createProductEmbeddings() {
  const products = await this.productService.findAll();
  
  for (const product of products) {
    const embedding = await this.openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: `${product.name} ${product.description} ${product.category.name}`
    });
    
    await this.vectorStore.upsert({
      id: product.id,
      values: embedding.data[0].embedding,
      metadata: {
        name: product.name,
        price: product.price,
        category: product.category.name,
        description: product.description
      }
    });
  }
}
```

#### **2.2 Smart Product Search**
```typescript
async searchProductsByIntent(userMessage: string) {
  // 1. Phân tích intent từ tin nhắn
  const intent = await this.analyzeIntent(userMessage);
  
  // 2. Tìm kiếm semantic
  const searchResults = await this.vectorStore.query({
    vector: await this.getEmbedding(userMessage),
    topK: 5,
    filter: intent.filters
  });
  
  // 3. Xếp hạng kết quả
  return this.rankProducts(searchResults);
}
```

#### **2.3 Context-Aware Responses**
```typescript
async generateResponse(conversation: Message[], searchResults: any[]) {
  const systemPrompt = `
    Bạn là chatbot tư vấn sản phẩm cho MatFlow - cửa hàng vật tư xây dựng.
    
    Thông tin sản phẩm hiện có:
    ${JSON.stringify(searchResults, null, 2)}
    
    Nhiệm vụ:
    1. Tư vấn sản phẩm phù hợp
    2. Giải thích đặc điểm, ưu điểm
    3. So sánh các sản phẩm
    4. Hướng dẫn sử dụng
    5. Đề xuất thêm vào giỏ hàng nếu phù hợp
  `;
  
  const response = await this.openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversation
    ],
    temperature: 0.7
  });
  
  return response.choices[0].message.content;
}
```

### **Phase 3: Advanced Features (2-3 tuần)**

#### **3.1 Cart Integration**
```typescript
// Tự động thêm vào giỏ hàng
async addToCartFromChat(productId: string, quantity: number, userId?: string) {
  if (userId) {
    // Thêm vào database cart
    return await this.cartService.addItem(userId, productId, quantity);
  } else {
    // Thêm vào localStorage cart
    return await this.cartService.addToLocalCart(productId, quantity);
  }
}
```

#### **3.2 Smart Recommendations**
```typescript
async getSmartRecommendations(conversationHistory: Message[]) {
  // Phân tích nhu cầu từ cuộc trò chuyện
  const needs = await this.extractNeeds(conversationHistory);
  
  // Tìm sản phẩm phù hợp
  const recommendations = await this.productService.findByCriteria({
    category: needs.category,
    priceRange: needs.priceRange,
    features: needs.features
  });
  
  return recommendations;
}
```

#### **3.3 Multi-language Support**
```typescript
async detectLanguage(message: string) {
  // Sử dụng OpenAI để detect language
  const response = await this.openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'user', content: `Detect language: "${message}"` }
    ]
  });
  
  return response.choices[0].message.content;
}
```

## 💰 **Cost Estimation**

### **Monthly Costs (ước tính)**
- **OpenAI API**: $50-200 (tùy usage)
- **Pinecone**: $25-100 (tùy data size)
- **Server**: $20-50 (tùy traffic)
- **Total**: $95-350/tháng

### **Development Time**
- **Phase 1**: 2-3 tuần
- **Phase 2**: 3-4 tuần  
- **Phase 3**: 2-3 tuần
- **Total**: 7-10 tuần

## 🚀 **Next Steps**

### **Immediate Actions**
1. **Setup development environment**
2. **Choose LLM provider** (OpenAI/Anthropic)
3. **Design database schema**
4. **Create basic chat UI**

### **Technical Decisions**
1. **LLM Provider**: OpenAI GPT-4 (recommended)
2. **Vector DB**: Pinecone (easiest) hoặc Chroma (free)
3. **Frontend**: React component trong existing site
4. **Backend**: NestJS service mới

## 🎨 **UI/UX Design**

### **Chat Widget Features**
- **Floating button** ở góc phải màn hình
- **Expandable chat window** với animation mượt
- **Message bubbles** với styling đẹp
- **Typing indicator** khi AI đang xử lý
- **Quick actions** (Add to cart, View product, etc.)
- **File upload** cho hình ảnh sản phẩm
- **Voice input** (optional)

### **Responsive Design**
- **Mobile-first** approach
- **Touch-friendly** interface
- **Keyboard shortcuts** cho desktop
- **Dark/Light mode** support

## 🔧 **Technical Requirements**

### **Backend Dependencies**
```json
{
  "dependencies": {
    "@pinecone-database/pinecone": "^1.1.0",
    "openai": "^4.20.0",
    "@anthropic-ai/sdk": "^0.9.0",
    "langchain": "^0.0.200",
    "@langchain/openai": "^0.0.14",
    "chromadb": "^1.7.0",
    "socket.io": "^4.7.0"
  }
}
```

### **Frontend Dependencies**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "socket.io-client": "^4.7.0",
    "framer-motion": "^10.16.0",
    "react-markdown": "^9.0.0",
    "react-syntax-highlighter": "^15.5.0"
  }
}
```

## 📊 **Success Metrics**

### **Key Performance Indicators (KPIs)**
- **Response Time**: < 2 seconds
- **Accuracy**: > 85% correct product recommendations
- **User Satisfaction**: > 4.5/5 rating
- **Cart Conversion**: > 15% increase
- **Session Duration**: > 30% increase

### **Analytics Tracking**
- **Message volume** per day
- **Popular queries** and patterns
- **Product recommendation** success rate
- **Cart addition** from chat
- **User engagement** metrics

## 🔒 **Security & Privacy**

### **Data Protection**
- **Encrypt** all conversation data
- **Anonymize** user data when possible
- **GDPR compliance** for EU users
- **Data retention** policies
- **Secure API** endpoints

### **Rate Limiting**
- **Message limits** per user
- **API rate limiting** to prevent abuse
- **Spam detection** and filtering
- **Content moderation** for inappropriate messages

## 🌟 **Future Enhancements**

### **Advanced Features**
- **Voice chat** integration
- **Video call** support
- **AR product visualization**
- **Multi-agent** system
- **Integration** with CRM systems
- **Advanced analytics** dashboard

### **AI Improvements**
- **Fine-tuned models** for construction materials
- **Custom embeddings** for Vietnamese language
- **Context-aware** memory
- **Emotional intelligence** in responses
- **Predictive** product suggestions

---

**Tác giả**: MatFlow Development Team  
**Ngày tạo**: 2024  
**Phiên bản**: 1.0  
**Trạng thái**: Planning Phase
