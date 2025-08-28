# MatFlow - Hệ Thống Bán Vật Tư

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

## Cách chạy dự án


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



# Tạo migration mới
cd backend
npx prisma migrate dev --name update_name

# Reset database
npx prisma migrate reset

# Xem database
npx prisma studio
```


Set-Location D:\Project\capstone1\backend; node dist/main.js
