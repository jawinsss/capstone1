export const categoryData = [
  // 1. SẮT – THÉP XÂY DỰNG
  {
    name: 'Sắt – Thép Xây Dựng',
    slug: 'sat-thep-xay-dung',
    description: 'Các loại sắt thép sử dụng trong xây dựng công trình.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Thép cuộn',
        slug: 'thep-cuon',
        description: 'Thép dạng cuộn dùng trong xây dựng',
        isActive: true
      },
      {
        name: 'Thép hộp',
        slug: 'thep-hop',
        description: 'Thép hộp vuông và chữ nhật',
        isActive: true
      },
      {
        name: 'Thép hình (U, I, H)',
        slug: 'thep-hinh-u-i-h',
        description: 'Thép hình dạng U, I, H',
        isActive: true
      },
      {
        name: 'Thép V',
        slug: 'thep-v',
        description: 'Thép góc chữ V',
        isActive: true
      },
      {
        name: 'Thép ống',
        slug: 'thep-ong',
        description: 'Thép dạng ống dùng trong xây dựng',
        isActive: true
      },
      {
        name: 'Lưới thép, thép râu',
        slug: 'luoi-thep-thep-rau',
        description: 'Lưới thép và thép râu',
        isActive: true
      },
    ]
  },

  // 2. XI MĂNG – BỘT TRÉT – VỮA
  {
    name: 'Xi Măng – Bột Trét – Vữa',
    slug: 'xi-mang-bot-tret-vua',
    description: 'Xi măng, bột trét tường và các loại vữa xây dựng.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Xi măng',
        slug: 'xi-mang',
        description: 'Xi măng các loại',
        isActive: true
      },
      {
        name: 'Bột trét tường',
        slug: 'bot-tret-tuong',
        description: 'Bột trét dùng cho hoàn thiện bề mặt tường',
        isActive: true
      },
      {
        name: 'Vữa khô trộn sẵn',
        slug: 'vua-kho-tron-san',
        description: 'Vữa xây, tô trộn sẵn',
        isActive: true
      },
    ]
  },

  // 3. GẠCH – ỐP LÁT – VẬT LIỆU HOÀN THIỆN
  {
    name: 'Gạch – Ốp Lát – Vật Liệu Hoàn Thiện',
    slug: 'gach-op-lat-vat-lieu-hoan-thien',
    description: 'Các loại gạch, đá ốp lát và vật liệu hoàn thiện công trình.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Gạch men',
        slug: 'gach-men',
        description: 'Gạch men ốp lát',
        isActive: true
      },
      {
        name: 'Gạch block',
        slug: 'gach-block',
        description: 'Gạch block xây dựng',
        isActive: true
      },
      {
        name: 'Gạch chịu nhiệt',
        slug: 'gach-chiu-nhiet',
        description: 'Gạch chịu nhiệt chuyên dụng',
        isActive: true
      },
      {
        name: 'Đá ốp lát',
        slug: 'da-op-lat',
        description: 'Đá tự nhiên và đá nhân tạo',
        isActive: true
      },
    ]
  },

  // 4. SƠN – CHỐNG THẤM
  {
    name: 'Sơn – Chống Thấm',
    slug: 'son-chong-tham',
    description: 'Các loại sơn và vật liệu chống thấm.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Sơn nội thất',
        slug: 'son-noi-that',
        description: 'Sơn nước trong nhà',
        isActive: true
      },
      {
        name: 'Sơn ngoại thất',
        slug: 'son-ngoai-that',
        description: 'Sơn nước ngoài trời',
        isActive: true
      },
      {
        name: 'Sơn chống rỉ',
        slug: 'son-chong-ri',
        description: 'Sơn bảo vệ chống rỉ sét',
        isActive: true
      },
      {
        name: 'Chống thấm xi măng / acrylic',
        slug: 'chong-tham-xi-mang-acrylic',
        description: 'Vật liệu chống thấm',
        isActive: true
      },
    ]
  },

  // 5. ỐNG NƯỚC – PHỤ KIỆN
  {
    name: 'Ống Nước – Phụ Kiện',
    slug: 'ong-nuoc-phu-kien',
    description: 'Các loại ống nước và phụ kiện đi kèm.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Ống PVC',
        slug: 'ong-pvc',
        description: 'Ống nhựa PVC',
        isActive: true
      },
      {
        name: 'Ống PPR',
        slug: 'ong-ppr',
        description: 'Ống chịu nhiệt PPR',
        isActive: true
      },
      {
        name: 'Phụ kiện ống (co, tê, măng sông)',
        slug: 'phu-kien-ong',
        description: 'Phụ kiện kết nối đường ống',
        isActive: true
      },
      {
        name: 'Van nước, khóa nước',
        slug: 'van-nuoc-khoa-nuoc',
        description: 'Van và khóa điều chỉnh nước',
        isActive: true
      },
    ]
  },

  // 6. ĐIỆN – THIẾT BỊ ĐIỆN
  {
    name: 'Điện – Thiết Bị Điện',
    slug: 'dien-thiet-bi-dien',
    description: 'Thiết bị điện dân dụng và công nghiệp.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Ổ cắm',
        slug: 'o-cam',
        description: 'Ổ cắm điện',
        isActive: true
      },
      {
        name: 'Dây điện',
        slug: 'day-dien',
        description: 'Dây điện dân dụng và công nghiệp',
        isActive: true
      },
      {
        name: 'Aptomat',
        slug: 'aptomat',
        description: 'Thiết bị đóng ngắt điện',
        isActive: true
      },
      {
        name: 'CB',
        slug: 'cb-dien',
        description: 'Cầu dao tự động',
        isActive: true
      },
      {
        name: 'Đèn LED',
        slug: 'den-led',
        description: 'Đèn LED chiếu sáng',
        isActive: true
      },
    ]
  },

  // 7. MÁY MÓC – THIẾT BỊ THI CÔNG
  {
    name: 'Máy Móc – Thiết Bị Thi Công',
    slug: 'may-moc-thiet-bi-thi-cong',
    description: 'Thiết bị và máy móc dùng trong thi công công trình.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Máy khoan',
        slug: 'may-khoan',
        description: 'Máy khoan xây dựng',
        isActive: true
      },
      {
        name: 'Máy cắt',
        slug: 'may-cat',
        description: 'Máy cắt vật liệu',
        isActive: true
      },
      {
        name: 'Máy hàn',
        slug: 'may-han',
        description: 'Máy hàn các loại',
        isActive: true
      },
      {
        name: 'Máy trộn bê tông',
        slug: 'may-tron-be-tong',
        description: 'Máy trộn trong xây dựng',
        isActive: true
      },
    ]
  },

  // 8. HÓA CHẤT XÂY DỰNG
  {
    name: 'Hóa Chất Xây Dựng',
    slug: 'hoa-chat-xay-dung',
    description: 'Hóa chất và phụ gia sử dụng trong xây dựng.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Keo xây dựng',
        slug: 'keo-xay-dung',
        description: 'Keo kết dính dùng trong xây dựng',
        isActive: true
      },
      {
        name: 'Keo dán gạch',
        slug: 'keo-dan-gach',
        description: 'Keo dán gạch chuyên dụng',
        isActive: true
      },
      {
        name: 'Phụ gia bê tông',
        slug: 'phu-gia-be-tong',
        description: 'Phụ gia tăng cường chất lượng bê tông',
        isActive: true
      },
      {
        name: 'Chất tẩy rửa xi măng',
        slug: 'chat-tay-rua-xi-mang',
        description: 'Dung dịch tẩy cặn xi măng',
        isActive: true
      },
    ]
  },

  // 9. VẬT TƯ KIM KHÍ – PHỤ KIỆN
  {
    name: 'Vật Tư Kim Khí – Phụ Kiện',
    slug: 'vat-tu-kim-khi-phu-kien',
    description: 'Kim khí xây dựng và các phụ kiện kim loại.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Bulong – ốc vít',
        slug: 'bulong-oc-vit',
        description: 'Bulong, ốc vít các loại',
        isActive: true
      },
      { name: 'Bản lề – khóa',
        slug: 'ban-le-khoa',
        description: 'Khóa cửa và bản lề kim loại',
        isActive: true
      },
      {
        name: 'Thanh ren – tắc kê',
        slug: 'thanh-ren-tac-ke',
        description: 'Ren, tắc kê nở',
        isActive: true
      },
      {
        name: 'Thang nhôm',
        slug: 'thang-nhom',
        description: 'Thang nhôm dân dụng và công nghiệp',
        isActive: true
      },
      {
        name: 'Dụng cụ cầm tay',
        slug: 'dung-cu-cam-tay',
        description: 'Bộ dụng cụ cầm tay dùng trong thi công',
        isActive: true
      },
    ]
  },

  // 10. BẢO HỘ LAO ĐỘNG
  {
    name: 'Bảo Hộ Lao Động',
    slug: 'bao-ho-lao-dong',
    description: 'Đồ bảo hộ lao động cho công nhân xây dựng.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Nón bảo hộ',
        slug: 'non-bao-ho',
        description: 'Nón bảo hộ an toàn',
        isActive: true
      },
      {
        name: 'Găng tay',
        slug: 'gang-tay',
        description: 'Găng tay bảo hộ',
        isActive: true
      },
      {
        name: 'Giày bảo hộ',
        slug: 'giay-bao-ho',
        description: 'Giày bảo hộ lao động',
        isActive: true
      },
      {
        name: 'Áo phản quang',
        slug: 'ao-phan-quang',
        description: 'Áo phản quang công trình',
        isActive: true
      },
    ]
  },
];

// Helper function to create categories with proper parent-child relationships
export async function createCategoriesWithChildren(prisma: any) {
  const createdCategories = [];
  
  for (const parentData of categoryData) {
    // Create parent category
    const parent = await prisma.category.create({
      data: {
        name: parentData.name,
        slug: parentData.slug,
        description: parentData.description,
        isActive: parentData.isActive,
        parentId: null
      }
    });
    
    createdCategories.push(parent);
    console.log(`✅ Created parent category: ${parent.name}`);
    
    // Create children categories
    for (const childData of parentData.children) {
      const child = await prisma.category.create({
        data: {
          name: childData.name,
          slug: childData.slug,
          description: childData.description,
          isActive: childData.isActive,
          parentId: parent.id
        }
      });
      
      createdCategories.push(child);
      console.log(`  └── Created child category: ${child.name}`);
    }
  }
  
  return createdCategories;
}
