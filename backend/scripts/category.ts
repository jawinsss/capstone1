export const categoryData = [
  // 1. SẮT THÉP (Parent Category)
  {
    name: 'Sắt Thép',
    slug: 'sat-thep',
    description: 'Các loại sắt thép và phụ kiện kim loại dùng trong xây dựng và công nghiệp.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Thép định hình',
        slug: 'thep-dinh-hinh',
        description: 'Thép được định hình theo các tiêu chuẩn kỹ thuật',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Sắt hộp vuông',
        slug: 'sat-hop-vuong',
        description: 'Sắt hộp có tiết diện hình vuông',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Sắt hộp hình chữ nhật',
        slug: 'sat-hop-hinh-chu-nhat',
        description: 'Sắt hộp có tiết diện hình chữ nhật',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Thép buộc',
        slug: 'thep-buoc',
        description: 'Thép dùng để buộc và liên kết',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Lưới thép',
        slug: 'luoi-thep',
        description: 'Lưới được làm từ thép',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Đinh',
        slug: 'dinh',
        description: 'Đinh thép các loại',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Dây đai thép',
        slug: 'day-dai-thep',
        description: 'Dây đai được làm từ thép',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Bản mã',
        slug: 'ban-ma',
        description: 'Bản mã thép dùng để liên kết',
        isActive: true,
        parentId: null,
      }
    ]
  },

  // 2. HÓA CHẤT (Parent Category)
  {
    name: 'Hóa Chất',
    slug: 'hoa-chat',
    description: 'Các loại hóa chất chuyên dụng trong xây dựng và công nghiệp.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Sika',
        slug: 'sika',
        description: 'Hóa chất Sika chuyên dụng',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Chất tẩy rỉ',
        slug: 'chat-tay-ri',
        description: 'Hóa chất dùng để tẩy rỉ sét',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Dầu lăn',
        slug: 'dau-lan',
        description: 'Dầu lăn chuyên dụng',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Bestmix',
        slug: 'bestmix',
        description: 'Hóa chất Bestmix',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Weber',
        slug: 'weber',
        description: 'Hóa chất Weber',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Vinkems',
        slug: 'vinkems',
        description: 'Hóa chất Vinkems',
        isActive: true,
        parentId: null,
      },
      {
        name: 'STX',
        slug: 'stx',
        description: 'Hóa chất STX',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Selsil',
        slug: 'selsil',
        description: 'Hóa chất Selsil',
        isActive: true,
        parentId: null,
      }
    ]
  },

  // 3. PHỤ KIỆN NÂNG HẠ (Parent Category)
  {
    name: 'Phụ Kiện Nâng Hạ',
    slug: 'phu-kien-nang-ha',
    description: 'Các phụ kiện và thiết bị dùng cho công việc nâng hạ và di chuyển.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Cáp thép',
        slug: 'cap-thep',
        description: 'Cáp được làm từ thép',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Cáp vải',
        slug: 'cap-vai',
        description: 'Cáp được làm từ vải',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Cùm',
        slug: 'cum',
        description: 'Cùm chuyên dụng',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Sling',
        slug: 'sling',
        description: 'Sling nâng hạ',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Phụ kiện cáp thép',
        slug: 'phu-kien-cap-thep',
        description: 'Các phụ kiện đi kèm với cáp thép',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Pa lăng xích',
        slug: 'pa-lang-xich',
        description: 'Pa lăng sử dụng xích',
        isActive: true,
        parentId: null,
      }
    ]
  },

  // 4. SIÊU THỊ KEO (Parent Category)
  {
    name: 'Siêu Thị Keo',
    slug: 'sieu-thi-keo',
    description: 'Các loại keo chuyên dụng trong xây dựng và công nghiệp.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Keo khoan cấy',
        slug: 'keo-khoan-cay',
        description: 'Keo dùng cho khoan cấy',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Hilti',
        slug: 'hilti',
        description: 'Keo Hilti chuyên dụng',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Ramset',
        slug: 'ramset',
        description: 'Keo Ramset',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Fischer',
        slug: 'fischer',
        description: 'Keo Fischer',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Sika',
        slug: 'keo-sika',
        description: 'Keo Sika',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Keo dán gạch',
        slug: 'keo-dan-gach',
        description: 'Keo chuyên dụng để dán gạch',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Keo chà ron',
        slug: 'keo-cha-ron',
        description: 'Keo dùng để chà ron',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Keo Silicone Apollo',
        slug: 'keo-silicone-apollo',
        description: 'Keo Silicone Apollo',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Keo dán đa năng',
        slug: 'keo-dan-da-nang',
        description: 'Keo dán có thể sử dụng cho nhiều mục đích',
        isActive: true,
        parentId: null,
      }
    ]
  },

  // 5. SIÊU THỊ SƠN (Parent Category)
  {
    name: 'Siêu Thị Sơn',
    slug: 'sieu-thi-son',
    description: 'Các loại sơn chuyên dụng cho xây dựng và trang trí.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Sơn dầu',
        slug: 'son-dau',
        description: 'Sơn dầu các loại',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Sơn nước',
        slug: 'son-nuoc',
        description: 'Sơn nước các loại',
        isActive: true,
        parentId: null,
      }
    ]
  },

  // 6. MÁY MÓC – THIẾT BỊ (Parent Category)
  {
    name: 'Máy Móc – Thiết Bị',
    slug: 'may-moc-thiet-bi',
    description: 'Các loại máy móc và thiết bị chuyên dụng trong xây dựng và công nghiệp.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Bosch',
        slug: 'bosch',
        description: 'Máy móc và thiết bị Bosch',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Makita',
        slug: 'makita',
        description: 'Máy móc và thiết bị Makita',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Honda',
        slug: 'honda',
        description: 'Máy móc và thiết bị Honda',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Ingco',
        slug: 'ingco',
        description: 'Máy móc và thiết bị Ingco',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Súng bơm keo',
        slug: 'sung-bom-keo',
        description: 'Súng bơm keo chuyên dụng',
        isActive: true,
        parentId: null,
      }
    ]
  },

  // 7. VẬT TƯ HẠ TẦNG (Parent Category)
  {
    name: 'Vật Tư Hạ Tầng',
    slug: 'vat-tu-ha-tang',
    description: 'Các vật tư chuyên dụng cho hạ tầng và công trình công cộng.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Bitum',
        slug: 'bitum',
        description: 'Bitum chuyên dụng',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Vải địa',
        slug: 'vai-dia',
        description: 'Vải địa kỹ thuật',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Bạt',
        slug: 'bat',
        description: 'Bạt chuyên dụng',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Lưới',
        slug: 'luoi',
        description: 'Lưới các loại',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Nilong',
        slug: 'nilong',
        description: 'Nilong chuyên dụng',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Ván ép phủ phim',
        slug: 'van-ep-phu-phim',
        description: 'Ván ép được phủ phim',
        isActive: true,
        parentId: null,
      }
    ]
  },

  // 8. VẬT TƯ KIM KHÍ (Parent Category)
  {
    name: 'Vật Tư Kim Khí',
    slug: 'vat-tu-kim-khi',
    description: 'Các vật tư kim khí chuyên dụng trong xây dựng và công nghiệp.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Đá mài – Đá cắt',
        slug: 'da-mai-da-cat',
        description: 'Đá mài và đá cắt chuyên dụng',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Vật liệu hàn',
        slug: 'vat-lieu-han',
        description: 'Các vật liệu dùng cho hàn',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Foam bọt nở',
        slug: 'foam-bot-no',
        description: 'Foam bọt nở chuyên dụng',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Kẽm buộc',
        slug: 'kem-buoc',
        description: 'Kẽm dùng để buộc',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Dây đai',
        slug: 'day-dai',
        description: 'Dây đai các loại',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Sơn dầu',
        slug: 'son-dau-kim-khi',
        description: 'Sơn dầu chuyên dụng',
        isActive: true,
        parentId: null,
      }
    ]
  },

  // 9. VẬT TƯ PHỤ XÂY DỰNG (Parent Category)
  {
    name: 'Vật Tư Phụ Xây Dựng',
    slug: 'vat-tu-phu-xay-dung',
    description: 'Các vật tư phụ trợ trong quá trình xây dựng và thi công.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Vật tư gia công',
        slug: 'vat-tu-gia-cong',
        description: 'Vật tư dùng cho gia công',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Cùm',
        slug: 'cum-phu-xay-dung',
        description: 'Cùm chuyên dụng',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Tyren',
        slug: 'tyren',
        description: 'Tyren chuyên dụng',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Tán',
        slug: 'tan',
        description: 'Tán chuyên dụng',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Bảo hộ lao động',
        slug: 'bao-ho-lao-dong-phu-xay-dung',
        description: 'Vật tư bảo hộ lao động',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Vật tư ME',
        slug: 'vat-tu-me',
        description: 'Vật tư ME chuyên dụng',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Con kê',
        slug: 'con-ke',
        description: 'Con kê chuyên dụng',
        isActive: true,
        parentId: null,
      }
    ]
  },

  // 10. LINH KIỆN LẮP GHÉP (Parent Category)
  {
    name: 'Linh Kiện Lắp Ghép',
    slug: 'linh-kien-lap-ghep',
    description: 'Các linh kiện chuyên dụng cho việc lắp ghép và kết nối.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Bulong liên kết',
        slug: 'bulong-lien-ket',
        description: 'Bulong dùng để liên kết',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Bulong neo móng',
        slug: 'bulong-neo-mong',
        description: 'Bulong dùng để neo móng',
        isActive: true,
        parentId: null,
      }
    ]
  },

  // 11. BẢO HỘ LAO ĐỘNG (Parent Category)
  {
    name: 'Bảo Hộ Lao Động',
    slug: 'bao-ho-lao-dong',
    description: 'Các thiết bị và vật tư bảo hộ lao động.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Giày bảo hộ',
        slug: 'giay-bao-ho',
        description: 'Giày bảo hộ lao động',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Găng tay bảo hộ',
        slug: 'gang-tay-bao-ho',
        description: 'Găng tay bảo hộ lao động',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Dây đai an toàn',
        slug: 'day-dai-an-toan',
        description: 'Dây đai an toàn lao động',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Thang dây thoát hiểm',
        slug: 'thang-day-thoat-hiem',
        description: 'Thang dây dùng để thoát hiểm',
        isActive: true,
        parentId: null,
      }
    ]
  }
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
