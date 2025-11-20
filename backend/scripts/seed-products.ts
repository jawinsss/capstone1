import { PrismaClient } from '@prisma/client';
import { readdirSync, existsSync } from 'fs';
import { join, extname } from 'path';
import 'dotenv/config'

const prisma = new PrismaClient();

// Mapping folder names to category slugs
const folderToCategoryMap: Record<string, string> = {

  'sat-thep-xay-dung': 'sat-thep-xay-dung',
  'xi-mang-bot-tret-vua': 'xi-mang-bot-tret-vua',
  'gach-op-lat-vat-lieu-hoan-thien': 'gach-op-lat-vat-lieu-hoan-thien',
  'son-chong-tham': 'son-chong-tham',
  'ong-nuoc-phu-kien': 'ong-nuoc-phu-kien',
  'dien-thiet-bi-dien': 'dien-thiet-bi-dien',
  'may-moc-thiet-bi-thi-cong': 'may-moc-thiet-bi-thi-cong',
  'hoa-chat-xay-dung': 'hoa-chat-xay-dung',
  'vat-tu-kim-khi-phu-kien': 'vat-tu-kim-khi-phu-kien',
  'bao-ho-lao-dong': 'bao-ho-lao-dong',
};

// Product templates based on categories
const productTemplates: Record<string, any> = {
  'sat-thep-xay-dung': {
    names: [
      'Thép Phi', 'Thép Hộp Vuông', 'Thép Hộp Chữ Nhật', 'Thép V',
      'Thép Hình I', 'Thép Hình U', 'Lưới Thép Hàn', 'Đinh Thép'
    ],
    priceRange: [80000, 800000],
    descriptions: [
      'Chất lượng cao, tiêu chuẩn xây dựng.',
      'Độ bền cao, chịu lực tốt, chống gỉ sét.',
      'Thép đạt chuẩn kỹ thuật nhà nước.',
      'Giá tốt cho công trình dân dụng và công nghiệp.'
    ]
  },

  'xi-mang-bot-tret-vua': {
    names: [
      'Xi Măng Holcim', 'Xi Măng Hà Tiên', 'Xi Măng Nghi Sơn',
      'Bột Trét Ngoài Trời', 'Bột Trét Nội Thất', 'Vữa Khô Trộn Sẵn'
    ],
    priceRange: [40000, 300000],
    descriptions: [
      'Chất lượng ổn định, độ bền cao.',
      'Dễ thi công, độ bám dính tốt.',
      'Đạt tiêu chuẩn TCVN.',
      'Sử dụng linh hoạt cho nhiều công trình.'
    ]
  },

  'gach-op-lat-vat-lieu-hoan-thien': {
    names: [
      'Gạch Men 60x60', 'Gạch Men 80x80', 'Gạch Ốp Tường',
      'Gạch Granite', 'Gạch Vân Đá', 'Gạch Chống Trơn'
    ],
    priceRange: [50000, 500000],
    descriptions: [
      'Mẫu mã đẹp, chống trầy xước.',
      'Độ bền cao, chịu lực tốt.',
      'Không thấm nước, dễ vệ sinh.',
      'Phù hợp cho mọi không gian.'
    ]
  },

  'son-chong-tham': {
    names: [
      'Sơn Chống Thấm Kova', 'Sơn Chống Thấm Jotun',
      'Sơn Lót Kháng Kiềm', 'Dung Dịch Chống Thấm Tường',
      'Sơn Ngoại Thất Cao Cấp'
    ],
    priceRange: [60000, 600000],
    descriptions: [
      'Bám dính tốt, kháng nước hiệu quả.',
      'Chống nấm mốc, dễ thi công.',
      'Độ phủ cao, bền màu.',
      'Được sử dụng phổ biến tại công trình lớn.'
    ]
  },

  'ong-nuoc-phu-kien': {
    names: [
      'Ống PPR', 'Ống PVC', 'Ống HDPE', 'Cút Nối PPR',
      'Van Khóa', 'Co Nối', 'Tê Nối', 'Măng Sông'
    ],
    priceRange: [10000, 300000],
    descriptions: [
      'Chịu nhiệt, chịu áp lực tốt.',
      'Dễ lắp đặt, bền bỉ.',
      'Vật liệu an toàn cho nước sinh hoạt.',
      'Phù hợp hệ thống dẫn nước dân dụng.'
    ]
  },

  'dien-thiet-bi-dien': {
    names: [
      'Ổ Cắm Điện', 'Công Tắc Điện', 'CB Chống Giật',
      'Dây Điện Cadivi', 'Bảng Điện Âm Tường', 'Đèn LED Panel'
    ],
    priceRange: [20000, 800000],
    descriptions: [
      'Thiết bị điện an toàn, chất lượng cao.',
      'Tiết kiệm điện năng, bền bỉ.',
      'Thiết kế tiện dụng, dễ lắp đặt.',
      'Đạt tiêu chuẩn an toàn điện quốc gia.'
    ]
  },

  'may-moc-thiet-bi-thi-cong': {
    names: [
      'Máy Khoan', 'Máy Cắt', 'Máy Mài', 'Máy Đục',
      'Máy Bơm Nước', 'Máy Hàn', 'Súng Bắn Keo'
    ],
    priceRange: [500000, 6000000],
    descriptions: [
      'Công suất mạnh mẽ, bền bỉ.',
      'Đáp ứng nhu cầu thi công chuyên nghiệp.',
      'Bảo hành chính hãng.',
      'Hiệu quả cao, an toàn khi sử dụng.'
    ]
  },

  'hoa-chat-xay-dung': {
    names: [
      'Sika Chống Thấm', 'Keo Dán Gạch Weber', 'Vữa Rót Gốc Xi Măng',
      'Chất Tẩy Rỉ Sét', 'Keo Silicone', 'Bọt Foam'
    ],
    priceRange: [30000, 350000],
    descriptions: [
      'Hiệu quả cao cho xử lý chống thấm.',
      'Thân thiện môi trường, an toàn.',
      'Sản phẩm chuyên nghiệp cho thợ xây dựng.',
      'Đạt tiêu chuẩn quốc tế.'
    ]
  },

  'vat-tu-kim-khi-phu-kien': {
    names: [
      'Bulong', 'Ốc Vít', 'Đai Treo', 'Kẽm Buộc',
      'Đá Cắt', 'Đá Mài', 'Keo Epoxy', 'Que Hàn'
    ],
    priceRange: [5000, 150000],
    descriptions: [
      'Chất lượng cao, chuẩn kích thước.',
      'Độ bền tốt, chịu lực hiệu quả.',
      'Phù hợp thi công dân dụng & công nghiệp.',
      'Giá tốt, hàng luôn sẵn kho.'
    ]
  },

  'bao-ho-lao-dong': {
    names: [
      'Giày Bảo Hộ', 'Nón Bảo Hộ', 'Găng Tay Chống Cắt',
      'Kính Bảo Hộ', 'Áo Phản Quang', 'Dây An Toàn'
    ],
    priceRange: [30000, 600000],
    descriptions: [
      'Bảo vệ an toàn cho người lao động.',
      'Đạt tiêu chuẩn an toàn lao động.',
      'Chất liệu bền bỉ, thoải mái.',
      'Được sử dụng phổ biến tại công trình.'
    ]
  }
};


// Get all image files from a directory
function getImageFiles(dirPath: string): string[] {
  try {
    if (!existsSync(dirPath)) {
      return [];
    }
    
    const files = readdirSync(dirPath);
    return files.filter(file => {
      const ext = extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
    return [];
  }
}

// Generate product name based on template and index
function generateProductName(folderSlug: string, index: number): string {
  const template = productTemplates[folderSlug];
  if (!template) {
    return `Sản phẩm ${index + 1}`;
  }
  
  const baseNames = template.names;
  const baseName = baseNames[index % baseNames.length];
  const suffix = Math.floor(index / baseNames.length) > 0 
    ? ` ${String.fromCharCode(65 + (Math.floor(index / baseNames.length) % 26))}` 
    : '';
  
  return `${baseName}${suffix}`;
}

// Generate slug from name
function generateSlug(name: string, index: number): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return `${slug}-${index + 1}`;
}

// Generate random price within range
function generatePrice(folderSlug: string): number {
  const template = productTemplates[folderSlug];
  if (!template) {
    return Math.floor(Math.random() * 100000) + 10000;
  }
  
  const [min, max] = template.priceRange;
  return Math.floor(Math.random() * (max - min) + min);
}

// Generate description
function generateDescription(folderSlug: string, productName: string): string {
  const template = productTemplates[folderSlug];
  if (!template) {
    return `${productName} - Sản phẩm chất lượng cao, giá cả hợp lý.`;
  }
  
  const descriptions = template.descriptions;
  const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
  
  return `${productName} - ${randomDesc}`;
}

// Generate stock quantity
function generateStock(): number {
  return Math.floor(Math.random() * 500) + 50;
}

async function main() {
  console.log('🌱 Starting product seeding...');
  
  try {
    // Clear existing products and images
    console.log('🗑️  Clearing existing products...');
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();
    console.log('✅ Products cleared');
    
    // Get all categories
    console.log('📂 Fetching categories...');
    const categories = await prisma.category.findMany({
      where: {
        isActive: true
      }
    });
    
    console.log(`✅ Found ${categories.length} categories`);
    
    // Create a map of category slugs to IDs
    const categoryMap = new Map<string, string>();
    categories.forEach(cat => {
      categoryMap.set(cat.slug, cat.id);
    });
    
    // Path to images folder (go up one level from backend to capstone1, then into frontend)
    const imagesBasePath = join(process.cwd(), '..', 'frontend', 'assets', 'vat_tu');
    console.log(`📂 Images base path: ${imagesBasePath}`);
    
    // Verify path exists
    if (!existsSync(imagesBasePath)) {
      console.error(`❌ Images folder not found at: ${imagesBasePath}`);
      console.error(`   Current working directory: ${process.cwd()}`);
      throw new Error('Images folder not found. Please check the path.');
    }
    
    let totalProducts = 0;
    let totalImages = 0;
    
    // Process each folder
    for (const [folderName, categorySlug] of Object.entries(folderToCategoryMap)) {
      console.log(`\n📁 Processing folder: ${folderName}`);
      
      const categoryId = categoryMap.get(categorySlug);
      if (!categoryId) {
        console.log(`⚠️  Category not found for slug: ${categorySlug}, skipping...`);
        continue;
      }
      
      const folderPath = join(imagesBasePath, folderName);
      console.log(`   Folder path: ${folderPath}`);
      console.log(`   Folder exists: ${existsSync(folderPath)}`);
      
      const imageFiles = getImageFiles(folderPath);
      
      console.log(`   Found ${imageFiles.length} images`);
      
      // Create products for each image
      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];
        const productName = generateProductName(categorySlug, i);
        const slug = generateSlug(productName, totalProducts);
        const price = generatePrice(categorySlug);
        const stock = generateStock();
        const description = generateDescription(categorySlug, productName);
        
        // Create product
        const product = await prisma.product.create({
          data: {
            name: productName,
            slug: slug,
            description: description,
            price: price,
            stock: stock,
            isActive: true,
            categoryId: categoryId,
          }
        });
        
        // Create product image
        const imageUrl = `/assets/vat_tu/${folderName}/${imageFile}`;
        await prisma.productImage.create({
          data: {
            url: imageUrl,
            alt: productName,
            order: 0,
            productId: product.id,
          }
        });
        
        totalProducts++;
        totalImages++;
        
        if ((i + 1) % 10 === 0) {
          console.log(`   Created ${i + 1}/${imageFiles.length} products...`);
        }
      }
      
      console.log(`✅ Completed ${folderName}: ${imageFiles.length} products created`);
    }
    
    console.log('\n🎉 Product seeding completed!');
    console.log(`📊 Statistics:`);
    console.log(`   Total products created: ${totalProducts}`);
    console.log(`   Total images linked: ${totalImages}`);
    console.log(`   Total categories used: ${Object.keys(folderToCategoryMap).length}`);
    
    // Display summary by category
    console.log('\n📈 Products by category:');
    for (const [folderName, categorySlug] of Object.entries(folderToCategoryMap)) {
      const count = await prisma.product.count({
        where: {
          category: {
            slug: categorySlug
          }
        }
      });
      console.log(`   ${categorySlug}: ${count} products`);
    }
    
  } catch (error) {
    console.error('❌ Product seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

