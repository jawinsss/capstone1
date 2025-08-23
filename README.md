# MatFlow - Hệ Thống Bán Vật Tư

Hệ thống quản lý bán vật tư đơn giản với chức năng đăng nhập và đăng ký người dùng.

## 🚀 Tính năng

- **Đăng ký người dùng**: Tạo tài khoản mới với thông tin cá nhân
- **Đăng nhập**: Xác thực người dùng với JWT
- **Quản lý người dùng**: Hỗ trợ 2 loại tài khoản: User và Admin
- **Giao diện hiện đại**: Thiết kế responsive với màu sắc teal đẹp mắt

## 🛠️ Công nghệ sử dụng

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Font Awesome icons
- Responsive design

### Backend
- **NestJS** - Framework Node.js
- **TypeScript** - Ngôn ngữ lập trình
- **Prisma** - ORM cho database
- **PostgreSQL** - Database chính
- **JWT** - Xác thực người dùng
- **bcrypt** - Mã hóa mật khẩu

### Database
- **PostgreSQL 15** - Chạy trên Docker
- **Docker Compose** - Quản lý container

## 📁 Cấu trúc dự án

```
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
```

## 🚀 Cách chạy dự án


### Yêu cầu hệ thống
- Windows 10/11
- Docker Desktop
- Node.js 16+ và npm 8+

### Cách 1: Sử dụng start.bat (Khuyến nghị)
1. Double-click vào file `start.bat`
2. Chờ quá trình khởi động hoàn tất
3. Frontend sẽ tự động mở trong trình duyệt

### Cách 2: chạy bằng terminal
1. ./start.bat

### Cách 2: Chạy thủ công
1. **Khởi động database:**
   ```bash
   docker-compose up -d
   ```

2. **Cài đặt backend:**
   ```bash
   cd backend
   npm install
   ```

3. **Khởi động backend:**
   ```bash
   npm run start:dev
   ```

4. **Mở frontend:**
   Mở file `frontend/index.html` trong trình duyệt

## 🔐 Tài khoản mặc định

### Admin
- **Username:** admin
- **Password:** admin123
- **Email:** admin@matflow.com

### User
- **Username:** user
- **Password:** user123
- **Email:** user@example.com

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Đăng ký người dùng mới
- `POST /auth/login` - Đăng nhập

### Users
- `GET /users` - Lấy danh sách người dùng (Admin only)
- `GET /users/:id` - Lấy thông tin người dùng
- `PUT /users/:id` - Cập nhật thông tin người dùng
- `DELETE /users/:id` - Xóa người dùng (Admin only)

## 🎨 Giao diện

- **Màu chủ đạo:** Teal (#20B2AA, #008080)
- **Layout:** 2 cột - Branding (trái) và Forms (phải)
- **Responsive:** Hỗ trợ mobile và desktop
- **Icons:** Font Awesome
- **Typography:** Segoe UI với kích cỡ font chuẩn

### Kích cỡ font chữ
- **Header title:** 28px
- **Brand name:** 48px
- **Brand tagline:** 20px
- **Form title:** 28px
- **Input fields:** 16px
- **Buttons:** 16px
- **Company name:** 16px
- **Company info:** 14px
- **Copyright:** 12px
- **Social links:** 14px

## 🏢 Thông tin công ty

- **Tên:** Công ty TNHH MatFlow
- **Địa chỉ:** 82 Nguyễn Công Triều
- **Chịu trách nhiệm quản lý nội dung:** Ngô Minh Tâm
- **Mạng xã hội:** Facebook, Instagram

## 🔧 Phát triển

### Backend
```bash
cd backend
npm run start:dev      # Development mode
npm run build          # Build production
npm run prisma:studio  # Database viewer
```

### Database
```bash
# Tạo migration mới
cd backend
npx prisma migrate dev --name update_name

# Reset database
npx prisma migrate reset

# Xem database
npx prisma studio
```

## 📝 Ghi chú

- Dự án này chỉ bao gồm chức năng cơ bản đăng nhập/đăng ký
- Các chức năng khác sẽ được thêm vào theo yêu cầu
- Frontend sử dụng vanilla JavaScript, không có framework
- Backend tuân theo kiến trúc NestJS với Prisma ORM
- Giao diện được thiết kế theo đúng yêu cầu với kích cỡ font chuẩn

## 🤝 Đóng góp

Dự án này được phát triển để học tập và nghiên cứu. Mọi đóng góp đều được chào đón!

## 📄 License

Dự án này được phát triển cho mục đích học tập.
