- Windows 10/11 hoặc Linux/macOS
- Docker Desktop
- Node.js (version 16 trở lên)
- npm hoặc yarn

## Bước 1: Cài đặt Docker

1. Tải và cài đặt Docker Desktop từ [docker.com](https://www.docker.com/products/docker-desktop)
2. Khởi động Docker Desktop
3. Đảm bảo Docker đang chạy

## Bước 2: Cài đặt Node.js

1. Tải và cài đặt Node.js từ [nodejs.org](https://nodejs.org/)
2. Kiểm tra cài đặt:

   ```bash
   node --version
   npm --version
   ```

## Bước 3: Clone và cài đặt dự án

1. Clone repository:

   ```bash
   git clone <repository-url>
   cd capstone1
   ```

2. Tạo file .env trong thư mục backend:

   ```bash
   cd backend
   copy env.example .env
   ```

3. Chỉnh sửa file .env với thông tin database:

   ```env
   DATABASE_URL="postgresql://capstone1_user:capstone1_password@localhost:5432/capstone1_db?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-here"
   JWT_EXPIRES_IN="7d"
   PORT=3000
   NODE_ENV=development
   ```

## Bước 4: Khởi động database

1. Khởi động PostgreSQL:

   ```bash
   docker-compose up -d postgres
   ```

2. Chờ database khởi động hoàn tất (khoảng 10-15 giây)

3. Kiểm tra database:

   ```bash
   docker ps
   ```

## Bước 5: Cài đặt và khởi động backend

1. Cài đặt dependencies:

   ```bash
   cd backend
   npm install
   ```

2. Tạo Prisma client:

   ```bash
   npm run prisma:generate
   ```

3. Chạy migration (nếu cần):

   ```bash
   npm run prisma:migrate
   ```

4. Khởi động backend:

   ```bash
   npm run start:dev
   ```

Backend sẽ chạy tại: <http://localhost:3000>
API Documentation: <http://localhost:3000/api>

## Bước 6: Mở frontend

1. Mở file `frontend/index.html` trong trình duyệt
2. Hoặc sử dụng Live Server extension trong VS Code

## Cách sử dụng nhanh (Windows)

1. Chạy file `start.bat` để tự động khởi động toàn bộ dự án
2. Script sẽ tự động:
   - Khởi động PostgreSQL
   - Cài đặt dependencies
   - Khởi động backend
   - Mở frontend

## Kiểm tra hoạt động

### Backend

- Truy cập: <http://localhost:3000>
- API Docs: <http://localhost:3000/api>
- Health check: <http://localhost:3000/health>

### Database

- PostgreSQL: localhost:5432
- PgAdmin: <http://localhost:5050>
  - Email: <admin@capstone1.com>
  - Password: admin123

### Database không kết nối được

```bash

# Kiểm tra Docker containers
docker ps

# Restart PostgreSQL
docker-compose restart postgres

# Kiểm tra logs
docker-compose logs postgres
```

### Port 3000 đã được sử dụng

```bash
# Thay đổi port trong file .env
PORT=3001

# Hoặc tìm và dừng process đang sử dụng port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Dependencies không cài đặt được

```bash
# Xóa node_modules và package-lock.json
rm -rf node_modules package-lock.json

# Cài đặt lại
npm install
```

### Thêm sản phẩm mới

1. Cập nhật Prisma schema trong `backend/prisma/schema.prisma`
2. Chạy migration: `npm run prisma:migrate`
3. Tạo service và controller mới

### Thêm tính năng mới

1. Tạo module mới trong `backend/src/`
2. Cập nhật `backend/src/app.module.ts`
3. Thêm API endpoints
4. Cập nhật frontend tương ứng

## Hỗ trợ

Nếu gặp vấn đề, hãy kiểm tra:

1. Docker đang chạy
2. Ports không bị conflict
3. Database đã khởi động
4. Dependencies đã cài đặt đầy đủ

## Liên hệ

- Email: <ngotam120704@gmail.com>
- GitHub: [https://github.com/jawinsss/capstone1]
