# 🚀 Hướng dẫn chạy dự án Capstone1

## ⚡ Khởi động nhanh

### 1. Clone và cài đặt
```bash
git clone <repository-url>
cd capstone1
```

### 2. Cài đặt Backend
```bash
cd backend
npm install
copy .env.example .env
```

### 3. Khởi động Database
```bash
cd ..
docker-compose up -d postgres
```

### 4. Chạy Backend
```bash
cd backend
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

### 5. Mở Frontend
- Mở `frontend/index.html` trong trình duyệt
- Hoặc dùng Live Server extension

## 🔧 Yêu cầu hệ thống
- Docker Desktop
- Node.js 16+
- npm

## 📝 Lưu ý
- Database tự động tạo qua Prisma migrations
- Dữ liệu mẫu được seed tự động
- Backend chạy tại: http://localhost:3000
- API chạy tại: http://localhost:3000/api
- PgAdmin: http://localhost:5050

## 🆘 Lỗi thường gặp
- Nếu lỗi database: Chạy `docker-compose down` rồi `docker-compose up -d postgres`
- Nếu lỗi Prisma: Chạy `npm run prisma:generate`
