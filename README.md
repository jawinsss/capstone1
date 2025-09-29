# 🏗️ MatFlow - Hệ thống quản lý bán hàng vật liệu xây dựng

<div align="center">
  <img src="frontend/assets/Icon MatFlow.png" alt="MatFlow Logo" width="120" height="120">
  
  **Nền tảng thương mại điện tử chuyên về vật liệu xây dựng và thiết bị công nghiệp**
  
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Node.js](https://img.shields.io/badge/node.js-16+-green.svg)](https://nodejs.org/)
  [![NestJS](https://img.shields.io/badge/NestJS-10+-red.svg)](https://nestjs.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://postgresql.org/)
</div>

## 🌟 Giới thiệu

**MatFlow** là một hệ thống quản lý bán hàng chuyên nghiệp được thiết kế đặc biệt cho ngành vật liệu xây dựng. Với giao diện thân thiện và tính năng mạnh mẽ, MatFlow giúp doanh nghiệp quản lý sản phẩm, đơn hàng và khách hàng một cách hiệu quả.

## ✨ Tính năng nổi bật

### 🛍️ **Quản lý sản phẩm thông minh**
- **Danh mục đa cấp**: Hệ thống phân loại sản phẩm theo danh mục và danh mục con
- **Tìm kiếm nâng cao**: Tìm kiếm sản phẩm theo tên, danh mục, giá cả
- **Quản lý kho**: Theo dõi tồn kho, cập nhật số lượng tự động
- **Hình ảnh sản phẩm**: Upload và quản lý nhiều hình ảnh cho mỗi sản phẩm

### 🛒 **Hệ thống đặt hàng hoàn chỉnh**
- **Giỏ hàng thông minh**: Lưu trữ sản phẩm, tính toán tổng tiền tự động
- **Quy trình đặt hàng**: Từ giỏ hàng đến thanh toán và xác nhận
- **Theo dõi đơn hàng**: Trạng thái đơn hàng real-time (Chờ xác nhận, Đang giao, Hoàn thành)
- **Lịch sử đơn hàng**: Xem lại tất cả đơn hàng đã đặt

### 💳 **Thanh toán linh hoạt**
- **Nhiều phương thức**: Thanh toán khi nhận hàng, chuyển khoản
- **Quản lý thanh toán**: Theo dõi trạng thái thanh toán
- **Báo cáo tài chính**: Thống kê doanh thu, đơn hàng

### 👥 **Quản lý người dùng**
- **Đăng ký/Đăng nhập**: Hệ thống xác thực bảo mật với JWT
- **Phân quyền**: Phân biệt người dùng thường và quản trị viên
- **Hồ sơ cá nhân**: Quản lý thông tin, địa chỉ giao hàng

### 🎯 **Dashboard quản trị**
- **Thống kê tổng quan**: Doanh thu, đơn hàng, sản phẩm bán chạy
- **Quản lý sản phẩm**: Thêm, sửa, xóa sản phẩm và danh mục
- **Quản lý đơn hàng**: Xem, cập nhật trạng thái đơn hàng
- **Quản lý người dùng**: Xem danh sách và thông tin khách hàng

### 🔧 **Hỗ trợ khách hàng**
- **Hệ thống ticket**: Khách hàng có thể gửi yêu cầu hỗ trợ
- **Đánh giá sản phẩm**: Khách hàng đánh giá và bình luận sản phẩm
- **Chính sách rõ ràng**: Đổi trả, hoàn tiền, vận chuyển

### 📱 **Giao diện responsive**
- **Thiết kế hiện đại**: Giao diện đẹp mắt, dễ sử dụng
- **Responsive**: Tương thích với mọi thiết bị (desktop, tablet, mobile)
- **Trải nghiệm mượt mà**: Tối ưu hóa tốc độ tải trang

## 🏗️ Kiến trúc hệ thống

```
MatFlow/
├── frontend/           # Giao diện người dùng (HTML, CSS, JavaScript)
├── backend/            # API Server (NestJS + Prisma)
├── database/           # Database PostgreSQL (Docker)
└── docker-compose.yml  # Cấu hình Docker services
```

## 🛠️ Công nghệ sử dụng

### **Frontend**
- **HTML5, CSS3, JavaScript ES6+**
- **Font Awesome** - Icons
- **Responsive Design** - Mobile-first approach

### **Backend**
- **NestJS** - Framework Node.js mạnh mẽ
- **Prisma** - ORM hiện đại cho database
- **JWT** - Xác thực và phân quyền
- **TypeScript** - Type safety

### **Database**
- **PostgreSQL** - Database quan hệ mạnh mẽ
- **Docker** - Containerization
- **PgAdmin** - Quản lý database

### **DevOps**
- **Docker Compose** - Multi-container orchestration
- **Git** - Version control
- **GitHub** - Code repository

## 🚀 Cách chạy dự án

Xem file [run.md](run.md) để biết hướng dẫn chi tiết.

### **Khởi động nhanh:**
```bash
# 1. Clone repository
git clone <repository-url>
cd capstone1

# 2. Cài đặt và chạy
cd backend && npm install && copy .env.example .env
cd .. && docker-compose up -d postgres
cd backend && npm run prisma:migrate && npm run prisma:seed && npm run start:dev

# 3. Mở frontend
# Mở file frontend/index.html trong trình duyệt
```

## 📊 Cấu trúc dữ liệu

### **Các bảng chính:**
- **Users** - Thông tin người dùng
- **Categories** - Danh mục sản phẩm (có thể lồng nhau)
- **Products** - Thông tin sản phẩm
- **Orders** - Đơn hàng
- **Payments** - Thanh toán
- **Reviews** - Đánh giá sản phẩm
- **Tickets** - Hỗ trợ khách hàng

## 🎯 Mục tiêu dự án

- **Tự động hóa** quy trình bán hàng vật liệu xây dựng
- **Tối ưu hóa** trải nghiệm mua sắm cho khách hàng
- **Nâng cao** hiệu quả quản lý cho doanh nghiệp
- **Mở rộng** thị trường bán hàng online

## 👥 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp từ cộng đồng! Hãy tạo issue hoặc pull request để cải thiện dự án.

## 📄 License

Dự án được phát hành dưới [MIT License](LICENSE).

---

<div align="center">
  <p>Được phát triển với ❤️ bởi team Capstone1</p>
  <p>📧 Liên hệ: ngotam120704@gmail.com</p>
</div>