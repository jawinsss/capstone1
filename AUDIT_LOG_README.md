# Audit Log System

## Tổng quan
Hệ thống Audit Log được thiết kế để theo dõi và ghi lại tất cả các hoạt động quan trọng trong hệ thống MatFlow. Điều này giúp quản trị viên có thể theo dõi, kiểm tra và phân tích các hoạt động của người dùng.

## Tính năng chính

### 1. Backend API
- **GET /audit** - Lấy danh sách audit logs với phân trang và bộ lọc
- **GET /audit/stats** - Lấy thống kê audit logs
- **GET /audit/:id** - Lấy chi tiết một audit log cụ thể
- **POST /audit** - Tạo audit log mới (chỉ dành cho hệ thống)

### 2. Frontend Admin Panel
- **Dashboard thống kê**: Hiển thị tổng số log, log hôm nay, hoạt động phổ biến
- **Bộ lọc nâng cao**: Lọc theo người dùng, hành động, tài nguyên, thời gian
- **Tìm kiếm**: Tìm kiếm trong nội dung audit log
- **Chi tiết log**: Xem chi tiết đầy đủ của từng audit log
- **Phân trang**: Hỗ trợ phân trang với nhiều tùy chọn hiển thị

## Cấu trúc dữ liệu

### AuditLog Model
```typescript
{
  id: string;           // ID duy nhất
  userId: string;       // ID người thực hiện
  action: string;       // Hành động (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW)
  resource: string;     // Tài nguyên (USER, PRODUCT, ORDER, CATEGORY, PAYMENT)
  resourceId?: string;  // ID của tài nguyên bị ảnh hưởng
  details?: any;        // Chi tiết bổ sung (JSON)
  ipAddress?: string;   // Địa chỉ IP
  userAgent?: string;   // User Agent
  timestamp: Date;      // Thời gian thực hiện
  user: User;           // Thông tin người dùng
}
```

## Cách sử dụng

### 1. Truy cập Audit Log
1. Đăng nhập vào admin panel
2. Click vào menu "Audit Log" trong sidebar
3. Hệ thống sẽ tự động tải dữ liệu audit log

### 2. Sử dụng bộ lọc
- **Người dùng**: Chọn người dùng cụ thể để xem log
- **Hành động**: Lọc theo loại hành động (Tạo mới, Cập nhật, Xóa, Đăng nhập, v.v.)
- **Tài nguyên**: Lọc theo loại tài nguyên (Người dùng, Sản phẩm, Đơn hàng, v.v.)
- **Tìm kiếm**: Nhập từ khóa để tìm kiếm trong nội dung
- **Thời gian**: Chọn khoảng thời gian cụ thể
- **Số lượng**: Chọn số lượng hiển thị (20, 50, 100)

### 3. Xem chi tiết
- Click vào bất kỳ audit log nào để xem chi tiết đầy đủ
- Modal sẽ hiển thị tất cả thông tin bao gồm:
  - Hành động và tài nguyên
  - Thông tin người thực hiện
  - Thời gian chính xác
  - Địa chỉ IP và User Agent
  - Chi tiết bổ sung (nếu có)

## Tích hợp vào hệ thống

### 1. Tự động ghi log
Để tự động ghi audit log khi có hoạt động, bạn có thể sử dụng service:

```typescript
// Trong controller hoặc service
await this.auditService.createAuditLog({
  userId: user.id,
  action: 'CREATE',
  resource: 'PRODUCT',
  resourceId: product.id,
  details: { name: product.name, price: product.price },
  ipAddress: request.ip,
  userAgent: request.headers['user-agent']
});
```

### 2. Middleware tự động
Có thể tạo middleware để tự động ghi log cho các hoạt động quan trọng:

```typescript
@Injectable()
export class AuditMiddleware implements NestMiddleware {
  constructor(private auditService: AuditService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Ghi log cho các hoạt động quan trọng
    if (req.method !== 'GET') {
      this.auditService.createAuditLog({
        userId: req.user?.id,
        action: req.method,
        resource: req.route?.path,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }
    next();
  }
}
```

## Bảo mật

- Chỉ admin mới có thể truy cập audit log
- Tất cả API đều được bảo vệ bởi JWT authentication
- Audit log không thể bị xóa hoặc chỉnh sửa (read-only)

## Hiệu suất

- Hỗ trợ phân trang để tối ưu hiệu suất
- Index database cho các trường thường được tìm kiếm
- Cache thống kê để giảm tải database

## Mở rộng

### Thêm loại hành động mới
1. Cập nhật enum trong frontend
2. Thêm icon và màu sắc tương ứng trong CSS
3. Cập nhật logic xử lý trong JavaScript

### Thêm loại tài nguyên mới
1. Cập nhật dropdown filter trong HTML
2. Thêm logic xử lý trong JavaScript
3. Cập nhật backend nếu cần

## Troubleshooting

### Lỗi thường gặp
1. **Không hiển thị audit log**: Kiểm tra quyền admin và kết nối API
2. **Lỗi phân trang**: Kiểm tra tham số page và limit
3. **Bộ lọc không hoạt động**: Kiểm tra tên trường và giá trị

### Debug
- Mở Developer Tools để xem lỗi console
- Kiểm tra Network tab để xem API calls
- Kiểm tra database để đảm bảo dữ liệu được lưu đúng
