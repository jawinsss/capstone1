# 🛠️ Hướng dẫn sử dụng Admin Panel - MatFlow

## 📋 Tổng quan

Admin panel đã được thiết lập để quản lý toàn bộ hệ thống MatFlow. Dữ liệu mẫu đã được xóa sạch để bạn có thể thêm sản phẩm thực tế.

## 🗑️ Dữ liệu đã xóa

✅ **39 sản phẩm mẫu** - Đã xóa hoàn toàn  
✅ **11 categories mẫu** - Đã thay thế bằng categories cơ bản  
✅ **2 user thường** - Chỉ giữ lại admin accounts  
✅ **1 review mẫu** - Đã xóa  
✅ **39 product images** - Đã xóa  

## 📁 Categories hiện tại

Hệ thống đã tạo 10 categories cơ bản:

1. **Sắt Thép** - Các loại sắt thép xây dựng
2. **Xi Măng** - Xi măng và vật liệu kết dính  
3. **Gạch Đá** - Gạch, đá và vật liệu xây dựng
4. **Gỗ** - Gỗ và sản phẩm từ gỗ
5. **Nhựa** - Nhựa và sản phẩm từ nhựa
6. **Kim Loại** - Kim loại và hợp kim
7. **Điện Tử** - Thiết bị điện tử
8. **Cơ Khí** - Thiết bị cơ khí
9. **Hóa Chất** - Hóa chất công nghiệp
10. **Bảo Hộ** - Thiết bị bảo hộ lao động

## 👥 Admin Accounts

**Account 1:**
- Username: `ngotam`
- Password: `password`

**Account 2:**  
- Username: `nguyenkhoa`
- Password: `tamdeptrai`

## 📝 Cách thêm sản phẩm mới

### 1. Đăng nhập Admin
1. Truy cập: `frontend/Page/adminpage/admin-login.html`
2. Đăng nhập bằng một trong 2 tài khoản admin ở trên

### 2. Thêm sản phẩm
1. Click vào **"Sản phẩm"** trong sidebar
2. Click **"Thêm sản phẩm"** tab
3. Điền thông tin:
   - ✅ **Tên sản phẩm*** (bắt buộc)
   - ✅ **Giá bán** (VND)
   - ✅ **Danh mục*** (chọn từ 10 categories có sẵn)
   - ✅ **Số lượng** (kho)
   - ✅ **Mô tả*** (bắt buộc)
   - ✅ **Hình ảnh** (tùy chọn, tối đa 10 ảnh)

4. Click **"Thêm sản phẩm"** để lưu

### 3. Quản lý sản phẩm
- Xem danh sách trong tab **"Danh sách sản phẩm"**
- **Chỉnh sửa** hoặc **Xóa** sản phẩm
- Thống kê tự động cập nhật

## 🛠️ Scripts hữu ích

```bash
# Xóa tất cả dữ liệu mẫu
npm run db:clear

# Tạo lại categories cơ bản  
npm run db:categories

# Seed dữ liệu mẫu (nếu cần)
npm run db:seed
```

## 🚀 Tính năng Admin Panel

### ✅ Đã hoạt động:
- 🔐 **Authentication** - Đăng nhập admin
- 📦 **Product Management** - Thêm/sửa/xóa sản phẩm
- 📁 **Category Management** - 10 categories cơ bản
- 🖼️ **Image Upload** - Upload tối đa 10 ảnh/sản phẩm
- 📊 **Statistics** - Thống kê real-time
- 🎨 **UI/UX** - Giao diện hiện đại, responsive

### 🔄 Features khác:
- 📋 **Orders** - Quản lý đơn hàng  
- 👥 **Users** - Quản lý người dùng
- 💳 **Payments** - Quản lý thanh toán
- 📞 **Support** - Hỗ trợ khách hàng
- 📈 **Reports** - Báo cáo chi tiết

## 🎯 Bước tiếp theo

1. **Thêm sản phẩm đầu tiên** qua admin panel
2. **Kiểm tra hiển thị** trên trang chủ và trang sản phẩm  
3. **Test chức năng** thêm vào giỏ hàng
4. **Tùy chỉnh categories** nếu cần

## 💡 Lưu ý

- ⚠️ **Dữ liệu mẫu đã bị xóa** - Cần thêm sản phẩm thật
- 🔐 **Chỉ admin mới thêm được sản phẩm** - Cần đăng nhập admin
- 🖼️ **Hình ảnh** - Sẽ hiển thị icon MatFlow nếu không upload ảnh
- 📱 **Responsive** - Admin panel hoạt động trên mobile

---
**🎉 Chúc bạn thành công với MatFlow Admin!**


