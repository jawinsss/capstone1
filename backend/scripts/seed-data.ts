/**
 *  CẢNH BÁO:
 * - Script này sẽ TẠO THÊM data vào database, KHÔNG XÓA data cũ
 * - Nếu muốn reset database: npx prisma migrate reset
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Vietnamese provinces data (matching province.json)
const provinces = [
  { code: '11', name: 'Hà Nội' },
  { code: '12', name: 'Hồ Chí Minh' },
  { code: '13', name: 'Đà Nẵng' },
  { code: '14', name: 'Hải Phòng' },
  { code: '15', name: 'Cần Thơ' },
  { code: '16', name: 'Huế' },
  { code: '17', name: 'An Giang' },
  { code: '18', name: 'Bà Rịa - Vũng Tàu' },
  { code: '19', name: 'Bắc Giang' },
  { code: '20', name: 'Bắc Kạn' },
  { code: '21', name: 'Bạc Liêu' },
  { code: '22', name: 'Bắc Ninh' },
  { code: '23', name: 'Bến Tre' },
  { code: '24', name: 'Bình Định' },
  { code: '25', name: 'Bình Dương' },
  { code: '26', name: 'Bình Phước' },
  { code: '27', name: 'Bình Thuận' },
  { code: '28', name: 'Cà Mau' },
  { code: '29', name: 'Cao Bằng' },
  { code: '30', name: 'Đắk Lắk' },
  { code: '31', name: 'Đắk Nông' },
  { code: '32', name: 'Điện Biên' },
  { code: '33', name: 'Đồng Nai' },
  { code: '34', name: 'Đồng Tháp' },
  { code: '35', name: 'Gia Lai' },
  { code: '36', name: 'Hà Giang' },
  { code: '37', name: 'Hà Nam' },
  { code: '38', name: 'Hà Tĩnh' },
  { code: '39', name: 'Hải Dương' },
  { code: '40', name: 'Hậu Giang' },
  { code: '41', name: 'Hòa Bình' },
  { code: '42', name: 'Hưng Yên' },
  { code: '43', name: 'Khánh Hòa' },
  { code: '44', name: 'Kiên Giang' },
];

// Vietnamese first names and last names
const firstNames = [
  'An', 'Bình', 'Cường', 'Dũng', 'Đức', 'Giang', 'Hải', 'Hùng', 'Khoa', 'Linh',
  'Long', 'Mai', 'Minh', 'Nam', 'Nga', 'Nhung', 'Phong', 'Quân', 'Sơn', 'Thảo',
  'Thắng', 'Thu', 'Thủy', 'Trang', 'Trinh', 'Tú', 'Tùng', 'Uyên', 'Vân', 'Vinh'
];

const lastNames = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng',
  'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'
];

const streetTemplates = [
  'Đường Lê Lợi', 'Đường Trần Phú', 'Đường Nguyễn Huệ', 'Đường Hai Bà Trưng',
  'Đường Lý Thường Kiệt', 'Đường Quang Trung', 'Đường Phan Đình Phùng',
  'Đường Nguyễn Trãi', 'Đường Hoàng Văn Thụ', 'Đường Đinh Tiên Hoàng'
];

// Helper functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateVietnamesePhone(): string {
  const prefixes = ['032', '033', '034', '035', '036', '037', '038', '039', '086', '087', '088', '089'];
  return `${randomElement(prefixes)}${randomInt(1000000, 9999999)}`;
}

function generateUsername(fullName: string): string {
  const slug = fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, '');
  return `${slug}${randomInt(100, 999)}`;
}

async function main() {
  console.log('🌱 Starting seed data generation...\n');

  // Get existing categories and products
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: { products: { where: { isActive: true } } }
  });

  if (categories.length === 0) {
    console.error('❌ No categories found. Please run seed-categories.ts first!');
    return;
  }

  console.log(`📦 Found ${categories.length} categories`);

  const allProducts = categories.flatMap(cat => cat.products);
  if (allProducts.length === 0) {
    console.error('❌ No products found. Please run seed-products.ts first!');
    return;
  }

  console.log(`📦 Found ${allProducts.length} products\n`);

  // ============================================
  // 1. CREATE USERS
  // ============================================
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('123456', 10);
  const users: any[] = [];

  for (let i = 0; i < 80; i++) {
    const lastName = randomElement(lastNames);
    const firstName = randomElement(firstNames);
    const fullName = `${lastName} ${firstName}`;
    const province = randomElement(provinces);

    const user = await prisma.user.create({
      data: {
        email: `user${i + 1}@example.com`,
        username: generateUsername(fullName),
        password: hashedPassword,
        fullName,
        phone: generateVietnamesePhone(),
        gender: randomElement(['Nam', 'Nữ']),
        role: 'USER',
        isActive: true,
        province: province.code,
        provinceName: province.name,
        district: `Quận ${randomInt(1, 12)}`,
        ward: `Phường ${randomInt(1, 20)}`,
        street: `${randomInt(1, 999)} ${randomElement(streetTemplates)}`,
        fullAddress: `${randomInt(1, 999)} ${randomElement(streetTemplates)}, Phường ${randomInt(1, 20)}, Quận ${randomInt(1, 12)}, ${province.name}`,
        // Random creation dates over the past 12 months
        createdAt: randomDate(
          new Date(new Date().setMonth(new Date().getMonth() - 12)),
          new Date()
        ),
      },
    });
    users.push(user);
  }

  console.log(`✅ Created ${users.length} users\n`);

  // ============================================
  // 2. CREATE ORDERS & PAYMENTS
  // ============================================
  console.log('🛒 Creating orders and payments...');

  const orderStatuses = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED', 'RETURNED'];
  const paymentMethods = ['COD', 'MOMO', 'ZALOPAY'];

  // Generate orders over the past 12 months
  const startDate = new Date(new Date().setMonth(new Date().getMonth() - 12));
  const endDate = new Date();
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate orders per day (5-25 orders randomly distributed)
  const ordersPerDay: { [key: string]: number } = {};
  for (let day = 0; day < totalDays; day++) {
    const dateKey = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    // Most days have 5-15 orders, some peak days have up to 25 orders
    const baseOrders = randomInt(5, 15);
    const isPeakDay = Math.random() > 0.85; // 15% chance of peak day
    ordersPerDay[dateKey] = isPeakDay ? randomInt(20, 25) : baseOrders;
  }

  let orderCounter = 1;
  let totalOrders = 0;

  for (const [dateKey, orderCount] of Object.entries(ordersPerDay)) {
    const orderDate = new Date(dateKey);
    let dailyRevenue = 0;
    const maxDailyRevenue = 4800000; // Max 4.8M per day (to ensure confirmed payments < 5M)

    for (let i = 0; i < orderCount; i++) {
      // Random order time within the day
      const orderTime = new Date(orderDate);
      orderTime.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59));

      const user = randomElement(users);
      const paymentMethod = randomElement(paymentMethods);

      // Determine order status based on date
      let orderStatus: string;
      const daysOld = Math.ceil((endDate.getTime() - orderTime.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOld > 30) {
        // Old orders: mostly COMPLETED or CANCELLED
        orderStatus = Math.random() > 0.15 ? 'COMPLETED' : randomElement(['CANCELLED', 'RETURNED']);
      } else if (daysOld > 14) {
        // Medium-old orders: mix of COMPLETED, SHIPPING
        orderStatus = randomElement(['COMPLETED', 'SHIPPING', 'CANCELLED']);
      } else if (daysOld > 7) {
        // Recent orders: CONFIRMED, SHIPPING, some COMPLETED
        orderStatus = randomElement(['CONFIRMED', 'SHIPPING', 'COMPLETED']);
      } else {
        // Very recent orders: PENDING, CONFIRMED
        orderStatus = randomElement(['PENDING', 'CONFIRMED', 'SHIPPING']);
      }

      // Determine payment status based on order status and payment method
      let paymentStatus: string;
      if (orderStatus === 'CANCELLED') {
        paymentStatus = 'FAILED';
      } else if (paymentMethod === 'COD') {
        paymentStatus = orderStatus === 'COMPLETED' ? 'CONFIRMED' : 'PENDING';
      } else {
        // MOMO/ZALOPAY: confirmed if order is confirmed or later
        paymentStatus = ['CONFIRMED', 'SHIPPING', 'COMPLETED', 'RETURNED'].includes(orderStatus) 
          ? 'CONFIRMED' 
          : randomElement(['PENDING', 'FAILED']);
      }

      // Generate order items (2-4 items per order)
      const itemCount = randomInt(2, 4);
      const orderItems: { productId: string; quantity: number; price: number }[] = [];
      let totalAmount = 0;

      for (let j = 0; j < itemCount; j++) {
        const product = randomElement(allProducts);
        const quantity = randomInt(1, 3);
        const price = product.price;
        orderItems.push({
          productId: product.id,
          quantity,
          price,
        });
        totalAmount += price * quantity;
      }

      // Ensure we don't exceed daily revenue limit for confirmed payments
      if (paymentStatus === 'CONFIRMED') {
        if (dailyRevenue + totalAmount > maxDailyRevenue) {
          // Skip this order or make it PENDING/FAILED
          paymentStatus = 'PENDING';
        } else {
          dailyRevenue += totalAmount;
        }
      }

      // Create order
      const order = await prisma.order.create({
        data: {
          code: `ORD${String(orderCounter++).padStart(6, '0')}`,
          userId: user.id,
          status: orderStatus as any,
          totalAmount,
          paidAmount: paymentStatus === 'CONFIRMED' ? totalAmount : 0,
          isPaid: paymentStatus === 'CONFIRMED',
          paymentMethod: paymentMethod as any,
          receivedAt: orderStatus === 'COMPLETED' ? new Date(orderTime.getTime() + 5 * 24 * 60 * 60 * 1000) : null,
          createdAt: orderTime,
          updatedAt: orderTime,
        },
      });

      // Create order items
      for (const item of orderItems) {
        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          },
        });
      }

      // Create payment
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: totalAmount,
          status: paymentStatus as any,
          method: paymentMethod as any,
          transactionId: paymentMethod !== 'COD' ? `TXN${Date.now()}${randomInt(1000, 9999)}` : null,
          createdAt: orderTime,
          updatedAt: orderTime,
        },
      });

      totalOrders++;
    }
  }

  console.log(`✅ Created ${totalOrders} orders with payments\n`);

  // ============================================
  // 3. CREATE RETURN REQUESTS
  // ============================================
  console.log('↩️  Creating return requests...');

  const completedOrders = await prisma.order.findMany({
    where: {
      status: 'COMPLETED',
      receivedAt: { not: null },
    },
    take: 25,
  });

  const returnReasons = [
    'Sản phẩm không đúng như mô tả',
    'Sản phẩm bị lỗi/hư hỏng',
    'Giao sai sản phẩm',
    'Không còn nhu cầu sử dụng',
    'Chất lượng không tốt như mong đợi',
    'Sản phẩm không vừa/không phù hợp',
  ];

  let returnCount = 0;
  for (let i = 0; i < 15; i++) {
    const order = randomElement(completedOrders);
    const returnStatus = randomElement(['PENDING', 'APPROVED', 'REJECTED']);

    await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        reason: randomElement(returnReasons),
        status: returnStatus as any,
        refundAmount: returnStatus === 'APPROVED' ? order.totalAmount : 0,
        createdAt: new Date(order.receivedAt!.getTime() + randomInt(1, 5) * 24 * 60 * 60 * 1000),
      },
    });

    // Update order status if return approved
    if (returnStatus === 'APPROVED') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'RETURNED' },
      });
    }

    returnCount++;
  }

  console.log(`✅ Created ${returnCount} return requests\n`);

  // ============================================
  // 4. CREATE REVIEWS
  // ============================================
  console.log('⭐ Creating product reviews...');

  const ordersForReview = await prisma.order.findMany({
    where: {
      status: { in: ['COMPLETED', 'RETURNED'] },
    },
    include: {
      items: { include: { product: true } },
      user: true,
    },
    take: 50,
  });

  const reviewContents = [
    'Sản phẩm tốt, đúng như mô tả. Giao hàng nhanh!',
    'Chất lượng ổn, giá cả hợp lý.',
    'Rất hài lòng với sản phẩm này. Sẽ mua lại!',
    'Đóng gói cẩn thận, sản phẩm nguyên vẹn.',
    'Chất lượng tạm ổn, giá có hơi cao.',
    'Sản phẩm đẹp, đúng như hình ảnh.',
    'Shop tư vấn nhiệt tình, giao hàng đúng hẹn.',
    'Chất lượng tốt, sẽ giới thiệu cho bạn bè.',
  ];

  let reviewCount = 0;
  for (const order of ordersForReview) {
    // Review 1-2 products per order
    const itemsToReview = order.items.slice(0, randomInt(1, 2));

    for (const item of itemsToReview) {
      const rating = randomInt(3, 5); // Mostly positive reviews

      await prisma.review.create({
        data: {
          productId: item.product.id,
          userId: order.user.id,
          rating,
          content: randomElement(reviewContents),
          status: 'PUBLISHED',
          createdAt: new Date(order.createdAt.getTime() + randomInt(3, 10) * 24 * 60 * 60 * 1000),
        },
      });

      reviewCount++;
    }
  }

  console.log(`✅ Created ${reviewCount} reviews\n`);

  // ============================================
  // 5. CREATE SUPPORT TICKETS
  // ============================================
  console.log('🎫 Creating support tickets...');

  const ticketSubjects = [
    'Hỏi về thông tin sản phẩm',
    'Yêu cầu hỗ trợ đổi trả',
    'Cần tư vấn về sản phẩm',
    'Báo lỗi thanh toán',
    'Hỏi về thời gian giao hàng',
    'Yêu cầu hủy đơn hàng',
    'Khiếu nại về chất lượng sản phẩm',
  ];

  const ticketContents = [
    'Cho tôi hỏi sản phẩm này có màu khác không ạ?',
    'Tôi muốn đổi sản phẩm vì không vừa size.',
    'Sản phẩm này có bảo hành không ạ?',
    'Thanh toán bị lỗi, mong shop hỗ trợ.',
    'Đơn hàng của tôi giao khi nào ạ?',
    'Tôi muốn hủy đơn hàng này được không?',
    'Sản phẩm tôi nhận không giống hình ảnh.',
  ];

  let ticketCount = 0;
  for (let i = 0; i < 30; i++) {
    const user = randomElement(users);
    const ticketStatus = randomElement(['OPEN', 'IN_PROGRESS', 'CLOSED']);

    await prisma.ticket.create({
      data: {
        userId: user.id,
        subject: randomElement(ticketSubjects),
        content: randomElement(ticketContents),
        status: ticketStatus as any,
        createdAt: randomDate(startDate, endDate),
      },
    });

    ticketCount++;
  }

  console.log(`✅ Created ${ticketCount} support tickets\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('📊 SEED DATA SUMMARY:');
  console.log('='.repeat(50));

  const summaryStats = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    orders: await prisma.order.count(),
    payments: await prisma.payment.count(),
    returns: await prisma.returnRequest.count(),
    reviews: await prisma.review.count(),
    tickets: await prisma.ticket.count(),
  };

  console.log(`👥 Total Users: ${summaryStats.users}`);
  console.log(`📦 Total Categories: ${summaryStats.categories}`);
  console.log(`🏷️  Total Products: ${summaryStats.products}`);
  console.log(`🛒 Total Orders: ${summaryStats.orders}`);
  console.log(`💳 Total Payments: ${summaryStats.payments}`);
  console.log(`↩️  Total Returns: ${summaryStats.returns}`);
  console.log(`⭐ Total Reviews: ${summaryStats.reviews}`);
  console.log(`🎫 Total Tickets: ${summaryStats.tickets}`);

  console.log('\n' + '='.repeat(50));

  // Payment stats
  const paymentStats = await prisma.payment.groupBy({
    by: ['status'],
    _count: true,
    _sum: { amount: true },
  });

  console.log('\n💰 PAYMENT STATISTICS:');
  for (const stat of paymentStats) {
    console.log(`   ${stat.status}: ${stat._count} payments, Total: ${(stat._sum.amount || 0).toLocaleString('vi-VN')} đ`);
  }

  // Order stats
  const orderStats = await prisma.order.groupBy({
    by: ['status'],
    _count: true,
  });

  console.log('\n📦 ORDER STATISTICS:');
  for (const stat of orderStats) {
    console.log(`   ${stat.status}: ${stat._count} orders`);
  }

  console.log('\n✅ Seed data generation completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

