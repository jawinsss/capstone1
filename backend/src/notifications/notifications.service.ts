import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  getUserNotifications() {
    // Mock data for now - in real app, this would come from database
    const notifications = [
      {
        id: '1',
        title: 'Đơn hàng đã được xác nhận',
        message: 'Đơn hàng #ORD-001 của bạn đã được xác nhận và đang được chuẩn bị',
        type: 'order',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 phút trước
      },
      {
        id: '2',
        title: 'Chào mừng đến với MatfFlow',
        message: 'Cảm ơn bạn đã đăng ký tài khoản tại MatfFlow. Chúc bạn mua sắm vui vẻ!',
        type: 'welcome',
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 ngày trước
      },
      {
        id: '3',
        title: 'Sản phẩm mới',
        message: 'Chúng tôi vừa thêm sản phẩm mới mà bạn có thể quan tâm',
        type: 'product',
        isRead: false,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 giờ trước
      }
    ];

    return {
      success: true,
      data: notifications,
      message: 'Danh sách thông báo của người dùng'
    };
  }

  markAsRead(id: string) {
    // Mock implementation - in real app, this would update database
    return {
      success: true,
      message: 'Thông báo đã được đánh dấu đã đọc'
    };
  }
}
