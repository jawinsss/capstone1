import { PrismaClient } from '@prisma/client';
import { readdirSync, existsSync } from 'fs';
import { join, extname } from 'path';

const prisma = new PrismaClient();

// Mapping folder names to category slugs
const folderToCategoryMap: Record<string, string> = {
  'bao-ho-lao-dong': 'bao-ho-lao-dong',
  'dung-cu': 'vat-tu-phu-xay-dung', // Dung cu will go to vat tu phu
  'hoa-chat': 'hoa-chat',
  'linh-kien-lap-ghep': 'linh-kien-lap-ghep',
  'may-moc-thiet-bi': 'may-moc-thiet-bi',
  'phu-kien-nang-ha': 'phu-kien-nang-ha',
  'sat-thep': 'sat-thep',
  'sieu-thi-keo': 'sieu-thi-keo',
  'sieu-thi-son': 'sieu-thi-son',
  'vat-tu-ha-tang': 'vat-tu-ha-tang',
  'vat-tu-kim-khi': 'vat-tu-kim-khi',
  'vat-tu-phu': 'vat-tu-phu-xay-dung',
};

// Product templates based on categories
const productTemplates: Record<string, any> = {
  'sat-thep': {
    names: [
      'Thép Phi', 'Thép Hộp', 'Sắt Hộp Vuông', 'Thép Định Hình',
      'Lưới Thép Hàn', 'Đinh Thép', 'Dây Đai Thép', 'Bản Mã Thép'
    ],
    priceRange: [50000, 500000],
    descriptions: [
      'Chất lượng cao, đảm bảo tiêu chuẩn xây dựng',
      'Sản phẩm thép chất lượng cao, được kiểm định',
      'Thép chất lượng, độ bền cao, chống gỉ sét tốt',
      'Đạt tiêu chuẩn kỹ thuật, an toàn cho công trình'
    ]
  },
  'hoa-chat': {
    names: [
      'Sika', 'Weber', 'Bestmix', 'Vinkems', 'STX',
      'Chất Chống Thấm', 'Chất Tẩy Rỉ', 'Dầu Lăn', 'Keo Dán'
    ],
    priceRange: [30000, 300000],
    descriptions: [
      'Hóa chất chuyên dụng cho xây dựng',
      'Sản phẩm hóa chất chất lượng cao, hiệu quả',
      'An toàn, thân thiện môi trường',
      'Đạt chuẩn chất lượng quốc tế'
    ]
  },
  'phu-kien-nang-ha': {
    names: [
      'Cáp Thép', 'Cáp Vải', 'Pa Lăng Xích', 'Cùm Nâng',
      'Sling Vải', 'Móc Cẩu', 'Khóa An Toàn'
    ],
    priceRange: [100000, 1000000],
    descriptions: [
      'Phụ kiện nâng hạ an toàn, độ bền cao',
      'Chịu tải trọng lớn, đảm bảo an toàn tuyệt đối',
      'Sản phẩm chất lượng cao, được kiểm định',
      'Đạt tiêu chuẩn an toàn quốc tế'
    ]
  },
  'sieu-thi-keo': {
    names: [
      'Keo Hilti', 'Keo Fischer', 'Keo Ramset', 'Keo Sika',
      'Keo Dán Gạch', 'Keo Chà Ron', 'Keo Silicone', 'Keo Đa Năng'
    ],
    priceRange: [20000, 200000],
    descriptions: [
      'Keo dán chuyên dụng, độ bám dính cao',
      'Chống nước, chịu nhiệt tốt',
      'Sản phẩm chất lượng cao, dễ sử dụng',
      'Đạt tiêu chuẩn chất lượng, an toàn'
    ]
  },
  'sieu-thi-son': {
    names: [
      'Sơn Nước', 'Sơn Dầu', 'Sơn Chống Thấm', 'Sơn Lót',
      'Sơn Ngoài Trời', 'Sơn Trong Nhà', 'Sơn Chống Rỉ'
    ],
    priceRange: [50000, 500000],
    descriptions: [
      'Sơn chất lượng cao, bền màu lâu dài',
      'Không độc hại, thân thiện môi trường',
      'Dễ thi công, khô nhanh, che phủ tốt',
      'Màu sắc đẹp, bền bỉ với thời gian'
    ]
  },
  'may-moc-thiet-bi': {
    names: [
      'Máy Khoan Bosch', 'Máy Mài Makita', 'Máy Cắt Honda',
      'Máy Bơm', 'Máy Hàn', 'Súng Bơm Keo', 'Máy Đục Bê Tông'
    ],
    priceRange: [500000, 5000000],
    descriptions: [
      'Máy móc chất lượng cao, độ bền vượt trội',
      'Công suất mạnh mẽ, hiệu quả cao',
      'Bảo hành chính hãng, uy tín',
      'Tiết kiệm điện năng, vận hành êm ái'
    ]
  },
  'vat-tu-ha-tang': {
    names: [
      'Bitum', 'Vải Địa', 'Bạt PE', 'Lưới Che', 
      'Nilong', 'Ván Ép Phủ Phim'
    ],
    priceRange: [30000, 300000],
    descriptions: [
      'Vật tư hạ tầng chất lượng cao',
      'Độ bền cao, chịu được điều kiện khắc nghiệt',
      'Sản phẩm đạt tiêu chuẩn kỹ thuật',
      'Giá cả hợp lý, chất lượng đảm bảo'
    ]
  },
  'vat-tu-kim-khi': {
    names: [
      'Đá Mài', 'Đá Cắt', 'Que Hàn', 'Foam Bọt Nở',
      'Kẽm Buộc', 'Dây Đai', 'Sơn Kim Khí'
    ],
    priceRange: [10000, 200000],
    descriptions: [
      'Vật tư kim khí chất lượng cao',
      'Độ bền tốt, an toàn khi sử dụng',
      'Sản phẩm chính hãng, uy tín',
      'Giá cả cạnh tranh, chất lượng đảm bảo'
    ]
  },
  'vat-tu-phu-xay-dung': {
    names: [
      'Cùm Ống', 'Tyren', 'Tán', 'Con Kê',
      'Vật Tư ME', 'Vật Tư Gia Công', 'Dụng Cụ Cầm Tay'
    ],
    priceRange: [5000, 100000],
    descriptions: [
      'Vật tư phụ chất lượng, giá tốt',
      'Sản phẩm đa dạng, phù hợp nhiều công trình',
      'Độ bền cao, dễ lắp đặt',
      'Đảm bảo chất lượng, an toàn khi sử dụng'
    ]
  },
  'bao-ho-lao-dong': {
    names: [
      'Giày Bảo Hộ', 'Găng Tay Bảo Hộ', 'Mũ Bảo Hộ', 'Kính Bảo Hộ',
      'Dây Đai An Toàn', 'Áo Phản Quang', 'Khẩu Trang', 'Thang Dây Thoát Hiểm'
    ],
    priceRange: [20000, 500000],
    descriptions: [
      'Bảo hộ lao động chất lượng cao, an toàn',
      'Đạt tiêu chuẩn an toàn lao động',
      'Bảo vệ tối đa cho người sử dụng',
      'Chất liệu tốt, độ bền cao'
    ]
  },
  'linh-kien-lap-ghep': {
    names: [
      'Bulong', 'Đai Ốc', 'Vít', 'Tán Đinh',
      'Bulong Neo', 'Bulong Liên Kết', 'Vòng Đệm', 'Chốt'
    ],
    priceRange: [5000, 150000],
    descriptions: [
      'Linh kiện lắp ghép chất lượng cao',
      'Độ bền tốt, chống gỉ sét hiệu quả',
      'Kích thước chuẩn, dễ lắp đặt',
      'Phù hợp cho nhiều loại công trình'
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

