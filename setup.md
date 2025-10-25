# 🚀 Hướng Dẫn Setup Dự Án MatFlow

## ⚠️ LƯU Ý QUAN TRỌNG

**Migrations chỉ đồng bộ CẤU TRÚC database, KHÔNG đồng bộ dữ liệu thực tế!**
- ✅ Schema (bảng, cột, indexes) → ĐỒNG BỘ qua migrations
- ❌ Data (sản phẩm, đơn hàng, users) → KHÔNG đồng bộ
- 🌱 Dữ liệu mẫu → Chạy seed scripts

---

## 📋 Setup Lần Đầu

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd capstone1
```

### Bước 2: Cài đặt dependencies
```bash
cd backend
npm install
```

### Bước 3: Tạo file .env
```bash
# Tạo file .env với nội dung:
DATABASE_URL="postgresql://capstone1_user:capstone1_password@localhost:5432/capstone1_db"
JWT_SECRET="your-secret-key-here"
PORT=3000
```

### Bước 4: Khởi động Database (Docker)
```bash
cd ..
docker-compose up -d postgres

# Kiểm tra database đã chạy
docker ps
```

### Bước 5: ⭐ Chạy Migrations (TẠO SCHEMA)
```bash
cd backend

# LÀM THEO 1 TRONG 2 CÁCH:

# Cách 1: Deploy migrations (AN TOÀN - dành cho team members)
npx prisma migrate deploy

# Cách 2: Dev mode (CHỈ dùng khi PHÁT TRIỂN migration mới)
npm run prisma:migrate
```

**Sau bước này database sẽ có:**
- ✅ Cấu trúc bảng (users, products, orders...)
- ❌ CHƯA có dữ liệu (database rỗng)

### Bước 6: 🌱 Seed Dữ Liệu Mẫu

```bash
# Option 1: Seed cơ bản (2 admin users)
npx prisma db seed

# Option 2: Seed đầy đủ (users, products, orders...)
npm run db:seed

# Kết quả:
# - 2 admin users: ngotam, nguyenkhoa (password: tamdeptrai)
# - Dữ liệu mẫu khác (tùy script)
```

### Bước 7: Generate Prisma Client
```bash
npx prisma generate
```

### Bước 8: 🚀 Start Backend
```bash
npm run start:dev

# Backend chạy tại: http://localhost:3000
# Swagger API: http://localhost:3000/api
```

---

## 🔄 Khi Pull Code Mới (Có Migrations Mới)

```bash
# 1. Pull code từ GitHub
git pull

# 2. Cài đặt packages mới (nếu có)
cd backend
npm install

# 3. ⭐ Chạy migrations mới (QUAN TRỌNG!)
npx prisma migrate deploy

# 4. Generate Prisma Client
npx prisma generate

# 5. Restart backend
npm run start:dev
```

---

## 🛠️ Các Lệnh Hữu Ích

```bash
# Xem database với UI
npx prisma studio

# Reset database (XÓA TẤT CẢ + chạy lại migrations + seed)
npx prisma migrate reset

# Kiểm tra trạng thái migrations
npx prisma migrate status

# Xem logs Docker
docker logs capstone1_postgres

# Dừng database
docker-compose down

# Xóa database và bắt đầu lại
docker-compose down -v
docker-compose up -d postgres
```

---

## 🆘 Troubleshooting

### Lỗi: "Database does not exist"
```bash
# Chạy lại Docker
docker-compose down
docker-compose up -d postgres
```

### Lỗi: "Prisma Client not generated"
```bash
npx prisma generate
```

### Lỗi: "Migration failed"
```bash
# Xem chi tiết
npx prisma migrate status

# Reset nếu cần
npx prisma migrate reset
```

---

## 📊 Admin Credentials

Sau khi seed:
- **Username:** ngotam | **Password:** tamdeptrai
- **Username:** nguyenkhoa | **Password:** tamdeptrai

---

## 🔗 URLs

- **Backend API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api
- **Prisma Studio:** http://localhost:5555 (khi chạy `npx prisma studio`)
- **PgAdmin:** http://localhost:5050