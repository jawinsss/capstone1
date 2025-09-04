# 🚀 MatFlow Admin Panel - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

MatFlow Admin Panel là hệ thống quản trị toàn diện với **real-time data** và **tự động hóa** cho việc quản lý hệ thống bán vật tư.

### ✨ Tính Năng Chính

- 🔄 **Real-time Data**: Dữ liệu tự động cập nhật theo thời gian thực
- 📊 **Dashboard Tương Tác**: Biểu đồ và thống kê động
- 🔔 **Thông Báo**: Hệ thống notification tự động
- 📱 **Responsive**: Tương thích mọi thiết bị
- ⚡ **Auto-refresh**: Tự động làm mới dữ liệu

## 🚀 Khởi Động Nhanh

### 1. Chạy Tự Động
```bash
# Chỉ cần double-click file này:
start.bat
```

### 2. Hoặc Chạy Thủ Công
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

## 🔐 Đăng Nhập

### Tài Khoản Admin Mặc Định
- **Email**: `admin@matflow.com`
- **Password**: `admin123`

### Tài Khoản Test
- **User 1**: `user1@example.com` / `user123`
- **User 2**: `user2@example.com` / `user123`

## 📊 Các Module Chính

### 1. 🏠 Tổng Quan (Overview)
- **KPI Cards**: GMV, Đơn hàng chờ, Sản phẩm chờ duyệt, Ticket mở
- **Biểu Đồ Doanh Thu**: Theo ngày/tuần/tháng
- **Auto-refresh**: 30 giây

**Real-time Features:**
- Cập nhật KPI tự động
- Biểu đồ doanh thu động
- Thống kê theo thời gian thực

### 2. 🛒 Quản Lý Đơn Hàng
- **Danh Sách Đơn Hàng**: Hiển thị tất cả đơn hàng
- **Thống Kê**: Tổng đơn, chờ xác nhận, đang giao, hoàn thành
- **Chi Tiết**: Thông tin khách hàng, sản phẩm, tổng tiền
- **Auto-refresh**: 15 giây

**Tính Năng:**
- Xem chi tiết đơn hàng
- Theo dõi trạng thái real-time
- Xuất Excel (coming soon)

### 3. 💰 Quản Lý Thanh Toán
- **Xác Nhận Thanh Toán**: Danh sách chờ xác nhận
- **Thống Kê**: Chờ xác nhận, đã xác nhận, công nợ
- **Auto-refresh**: 10 giây (nhanh nhất)

**Workflow:**
1. Khách hàng thanh toán → Status: PENDING
2. Admin xác nhận → Status: CONFIRMED
3. Cập nhật đơn hàng tự động

### 4. 📦 Quản Lý Sản Phẩm
- **Danh Sách Sản Phẩm**: Hiển thị tất cả sản phẩm
- **Thêm Sản Phẩm**: Form tạo sản phẩm mới
- **Upload Hình Ảnh**: Drag & drop hoặc chọn file
- **Auto-refresh**: 60 giây

**Tính Năng:**
- Tabs: Danh sách / Thêm mới
- Preview thông tin real-time
- Validation form tự động
- Upload multiple images

### 5. 👥 Quản Lý Người Dùng
- **Danh Sách Users**: Tất cả người dùng
- **Trạng Thái**: Hoạt động / Đã khóa
- **Thông Tin**: Email, ngày đăng ký
- **Auto-refresh**: 60 giây

### 6. 🔄 Trả Hàng & Hoàn Tiền
- **Yêu Cầu Trả Hàng**: Danh sách requests
- **Thống Kê**: Tổng, chờ xử lý, đang xử lý, đã duyệt
- **Hành Động**: Duyệt / Từ chối
- **Auto-refresh**: 20 giây

**Workflow:**
1. Khách hàng tạo yêu cầu → PENDING
2. Admin xem xét → PROCESSING
3. Quyết định → APPROVED/REJECTED

### 7. 💬 Hỗ Trợ & Khiếu Nại
- **3 Tabs**: Tin nhắn / Đánh giá / Tickets
- **Quản Lý Reviews**: Hiển thị/Ẩn đánh giá
- **Ticket System**: Hỗ trợ khách hàng
- **Auto-refresh**: 30 giây

### 8. 📈 Báo Cáo & Thống Kê
- **Dashboard Analytics**: Tổng hợp dữ liệu
- **Biểu Đồ**: Charts, Analytics, Pie charts
- **Export**: Tạo báo cáo (coming soon)

### 9. 🎯 Banner & Khuyến Mại
- **Quản Lý Banner**: Upload và quản lý
- **Promotion**: Tạo sự kiện giảm giá
- **Thumbnail Grid**: Hiển thị preview

## ⚡ Real-Time Features

### Auto-Refresh Rates
- **Payments**: 10 giây (ưu tiên cao)
- **Orders**: 15 giây
- **Returns**: 20 giây
- **Overview**: 30 giây
- **Feedbacks**: 30 giây
- **Users**: 60 giây
- **Products**: 60 giây

### Smart Refresh
- Tự động tạm dừng khi tab ẩn
- Chỉ refresh khi tab đang active
- Dừng tất cả khi rời trang

### Notification System
- Thông báo thành công/lỗi
- Animation slide-in/out
- Auto-hide sau 3 giây
- 4 loại: success, error, warning, info

## 🎨 UI/UX Features

### Responsive Design
- Desktop: Full layout với sidebar
- Tablet: Collapsible sidebar
- Mobile: Hamburger menu

### Keyboard Shortcuts
- `Ctrl/Cmd + K`: Focus search box
- `Esc`: Close modals/dropdowns

### Visual Indicators
- **Chips**: Trạng thái với màu sắc
  - 🟢 Green: Active/Published/Completed
  - 🔴 Red: Inactive/Hidden/Cancelled
  - 🟡 Yellow: Pending/Open
  - 🔵 Blue: Processing/In Progress

### Loading States
- Skeleton loading cho data
- Progress indicators
- Smooth transitions

## 🔧 API Endpoints

### Dashboard
- `GET /dashboard/overview` - KPI data
- `GET /dashboard/revenue?range=day|week|month` - Revenue charts

### Orders
- `GET /orders` - List all orders
- `PATCH /orders/:id/status` - Update order status

### Payments
- `GET /payments/pending` - Pending payments
- `PATCH /payments/:id/confirm` - Confirm payment

### Products
- `GET /products` - List products
- `POST /products` - Create product
- `GET /categories` - List categories

### Users
- `GET /users` - List users
- `PATCH /users/:id/status` - Update user status

### Returns
- `GET /returns` - List return requests
- `PATCH /returns/:id/status` - Update return status

### Reviews & Tickets
- `GET /reviews` - List reviews
- `GET /tickets` - List tickets
- `PATCH /reviews/:id/status` - Update review status

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Kiểm tra Docker
   docker ps
   # Restart database
   docker-compose restart
   ```

2. **Backend Not Starting**
   ```bash
   # Kiểm tra port 3000
   netstat -an | findstr :3000
   # Kill process nếu cần
   taskkill /f /im node.exe
   ```

3. **Frontend Not Loading Data**
   - Kiểm tra Network tab trong DevTools
   - Verify API endpoints
   - Check authentication token

4. **Real-time Not Working**
   - Kiểm tra tab visibility
   - Check console errors
   - Verify WebSocket connections

### Debug Mode
```javascript
// Trong browser console
localStorage.setItem('DEBUG', 'true');
// Reload page để thấy debug logs
```

## 📱 Mobile Support

### Responsive Breakpoints
- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px

### Touch Gestures
- Swipe để mở/đóng sidebar
- Pull-to-refresh (coming soon)
- Touch-friendly buttons

## 🔮 Upcoming Features

### Phase 2
- [ ] WebSocket real-time notifications
- [ ] Advanced filtering & search
- [ ] Bulk operations
- [ ] Export to Excel/PDF
- [ ] Email notifications

### Phase 3
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] AI-powered insights
- [ ] Multi-language support

## 📞 Support

### Development Team
- **Backend**: NestJS + Prisma + PostgreSQL
- **Frontend**: Vanilla JS + CSS3 + HTML5
- **Database**: PostgreSQL + Docker

### Contact
- **Email**: support@matflow.com
- **Documentation**: `/api` (Swagger)
- **Database Admin**: http://localhost:5050

---

## 🎉 Kết Luận

MatFlow Admin Panel cung cấp một giải pháp quản trị hoàn chỉnh với:

✅ **Real-time data** - Dữ liệu cập nhật tự động  
✅ **Modern UI/UX** - Giao diện hiện đại, responsive  
✅ **Complete CRUD** - Đầy đủ chức năng quản lý  
✅ **Auto-refresh** - Tự động làm mới thông minh  
✅ **Notification** - Hệ thống thông báo real-time  
✅ **Mobile-friendly** - Tương thích mobile  

**Happy Managing! 🚀**