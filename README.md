# 🚀 MatFlow - Hệ Thống Bán Vật Tư

> **Hệ thống e-commerce hoàn chỉnh với Admin Panel real-time và tự động hóa**

## ✨ Tính Năng Nổi Bật

### 🎯 Admin Panel (NEW!)

- **Real-time Data**: Dữ liệu tự động cập nhật theo thời gian thực
- **Auto-refresh**: Làm mới thông minh với tần suất khác nhau cho từng module
- **Dynamic Dashboard**: Biểu đồ và thống kê tương tác
- **Notification System**: Thông báo tự động với animation
- **Responsive Design**: Tương thích mọi thiết bị
- **Complete CRUD**: Đầy đủ chức năng quản lý

### 🛒 E-commerce Core

- Quản lý sản phẩm, đơn hàng, thanh toán
- Hệ thống người dùng với phân quyền
- Reviews và ratings
- Return/refund system
- Ticket support system

## 🛠️ Công nghệ sử dụng

### Frontend

- **HTML5, CSS3, JavaScript (ES6+)** - Core technologies
- **Font Awesome** - Icons
- **Responsive Design** - Mobile-first approach
- **Real-time Updates** - Auto-refresh system
- **Modern UI/UX** - Clean and intuitive interface

### Backend

- **NestJS** - Framework Node.js hiện đại
- **TypeScript** - Type-safe development
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Robust database
- **JWT** - Secure authentication
- **bcrypt** - Password hashing
- **Swagger** - API documentation

### Database

- **PostgreSQL 15** - Production-ready database
- **Docker Compose** - Container orchestration
- **Prisma Migrations** - Database versioning
- **Seeding** - Sample data generation

## 📁 Cấu trúc dự án

capstone1/
├── frontend/                 # Giao diện người dùng
│   ├── index.html           # Trang chính
│   ├── styles/
│   │   └── main.css        # CSS chính
│   └── js/
│       ├── config.js       # Cấu hình
│       ├── api.js          # Service API
│       └── main.js         # Logic chính
├── backend/                 # API Backend
│   ├── src/
│   │   ├── auth/           # Xác thực
│   │   ├── users/          # Quản lý người dùng
│   │   ├── prisma/         # Database service
│   │   ├── app.module.ts   # Module chính
│   │   └── main.ts         # Entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   ├── package.json        # Dependencies
│   └── .env.example        # Environment variables
├── database/
│   └── init.sql            # Khởi tạo database
├── docker-compose.yml       # Docker services
├── start.bat               # Script khởi động (Windows)
└── README.md               # Tài liệu dự án


🚀 Cách chạy dự án

### Yêu cầu hệ thống

- **Windows 10/11**
- **Docker Desktop** (đang chạy)
- **Node.js 16+** và **npm 8+**

### ⚡ Khởi động nhanh (Khuyến nghị)

```bash
# Chỉ cần double-click file này:
start.bat
```

**Hoặc từ terminal:**

```bash
./start.bat
```

### 🔧 Chạy thủ công

```bash
# 1. Khởi động database
docker-compose up -d

# 2. Cài đặt và chạy backend
cd backend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run start:dev

# 3. Mở admin panel
# frontend/Page/adminpage/admin.html
```

## 🔐 Tài khoản đăng nhập

### Admin Panel

- **URL**: `frontend/Page/adminpage/admin.html`
- **Email**: `admin@matflow.com`
- **Password**: `admin123`

### Test Users

- **User 1**: `user1@example.com` / `user123`
- **User 2**: `user2@example.com` / `user123`

## 🌐 Services & URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Admin Panel** | `frontend/Page/adminpage/admin.html` | 🎯 Real-time admin dashboard |
| **Homepage** | `frontend/index.html` | 🏠 Customer frontend |
| **Backend API** | `http://localhost:3000` | 🔧 REST API server |
| **Swagger Docs** | `http://localhost:3000/api` | 📚 API documentation |
| **Database** | `localhost:5432` | 🗄️ PostgreSQL |
| **pgAdmin** | `http://localhost:5050` | 🔍 Database admin |

## 📊 Admin Panel Features

### 🏠 Dashboard Overview

- **KPI Cards**: GMV, Pending orders, Products, Tickets
- **Revenue Charts**: Day/Week/Month views
- **Real-time updates**: Every 30 seconds

### 🛒 Order Management

- **Order List**: All orders with details
- **Status Tracking**: PENDING → CONFIRMED → SHIPPING → COMPLETED
- **Auto-refresh**: Every 15 seconds

### 💰 Payment Management

- **Pending Payments**: Awaiting confirmation
- **One-click Confirm**: Instant payment approval
- **Auto-refresh**: Every 10 seconds (highest priority)

### 📦 Product Management

- **Product CRUD**: Create, Read, Update, Delete
- **Image Upload**: Drag & drop multiple images
- **Category Management**: Organized product categories
- **Real-time Preview**: Live form preview

### 👥 User Management

- **User List**: All registered users
- **Status Control**: Active/Inactive users
- **Registration Tracking**: Sign-up dates and activity

### 🔄 Returns & Refunds

- **Return Requests**: Customer return requests
- **Approval Workflow**: PENDING → PROCESSING → APPROVED/REJECTED
- **Refund Processing**: Automated refund calculations

### 💬 Support & Feedback

- **Ticket System**: Customer support tickets
- **Review Management**: Product reviews moderation
- **Multi-tab Interface**: Messages/Reviews/Tickets

### 📈 Reports & Analytics

- **Sales Reports**: Revenue analytics
- **Performance Metrics**: System statistics
- **Export Functions**: Data export capabilities

## ⚡ Real-time Features

### Auto-refresh Intervals

- **Payments**: 10s (critical)
- **Orders**: 15s (high)
- **Returns**: 20s (medium)
- **Overview**: 30s (standard)
- **Users/Products**: 60s (low)

### Smart Refresh System

- ✅ Pauses when tab is hidden
- ✅ Only refreshes active views
- ✅ Stops all intervals on page unload
- ✅ Visual loading indicators

### Notification System

- 🔔 Success/Error notifications
- 🎨 Smooth slide animations
- ⏰ Auto-hide after 3 seconds
- 🎯 Context-aware messages

## 🛠️ Development Commands

```bash
# Database operations
cd backend
npx prisma generate          # Generate Prisma client
npx prisma db push          # Push schema to database
npx prisma db seed          # Seed with sample data
npx prisma studio           # Open database browser
npx prisma migrate dev      # Create new migration

# Backend development
npm run start:dev           # Start with hot reload
npm run start:debug         # Start with debugging
npm run build              # Build for production

# Database management
docker-compose up -d        # Start database
docker-compose down         # Stop database
docker-compose logs         # View logs
```

## 📱 Mobile Support

- ✅ **Responsive Design**: Works on all devices
- ✅ **Touch-friendly**: Optimized for mobile interaction
- ✅ **Adaptive Layout**: Sidebar collapses on mobile
- ✅ **Fast Loading**: Optimized performance

## 🔍 API Documentation

### Swagger UI

- **URL**: `http://localhost:3000/api`
- **Features**: Interactive API testing
- **Authentication**: Bearer token support

### Key Endpoints

```
GET    /dashboard/overview     # Dashboard KPIs
GET    /dashboard/revenue      # Revenue data
GET    /orders                 # List orders
GET    /products               # List products
GET    /users                  # List users
GET    /payments/pending       # Pending payments
PATCH  /payments/:id/confirm   # Confirm payment
GET    /returns                # Return requests
GET    /tickets                # Support tickets
GET    /reviews                # Product reviews
```

## 🎯 Project Highlights

### ✨ What Makes This Special

1. **🔄 Real-time Everything**
   - Live data updates without page refresh
   - Smart refresh intervals based on data importance
   - Automatic pause/resume based on tab visibility

2. **🎨 Modern UI/UX**
   - Clean, professional admin interface
   - Responsive design for all devices
   - Smooth animations and transitions
   - Intuitive navigation and workflows

3. **⚡ Performance Optimized**
   - Efficient API calls with caching
   - Lazy loading for large datasets
   - Optimized database queries
   - Fast startup with Docker

4. **🔧 Developer Friendly**
   - TypeScript for type safety
   - Comprehensive API documentation
   - Easy setup with automated scripts
   - Well-structured codebase

5. **📊 Business Ready**
   - Complete e-commerce functionality
   - Advanced admin panel
   - Real-time analytics
   - Scalable architecture

## 📚 Documentation

- **[Admin Guide](ADMIN_GUIDE.md)** - Detailed admin panel usage
- **[API Docs](http://localhost:3000/api)** - Swagger documentation
- **[Setup Guide](SETUP.md)** - Installation instructions

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- **NestJS Team** - Amazing framework
- **Prisma Team** - Excellent ORM
- **PostgreSQL** - Reliable database
- **Docker** - Containerization made easy

---

**🚀 Happy Coding with MatFlow!**
