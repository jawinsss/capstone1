export const categoryData = [
  // 1. VẬT TƯ XÂY DỰNG (Parent Category)
  {
    name: 'Vật tư xây dựng',
    slug: 'vat-tu-xay-dung',
    description: 'Các nguyên liệu cơ bản dùng trong thi công công trình, từ nền móng đến kết cấu chính.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Xi măng, gạch, cát, đá, sỏi',
        slug: 'xi-mang-gach-cat-da-soi',
        description: 'Nguyên liệu cơ bản cho nền móng và kết cấu',
        isActive: true,
        parentId: null, // Will be updated after parent creation
      },
      {
        name: 'Thép xây dựng',
        slug: 'thep-xay-dung',
        description: 'Thép thanh, cuộn dùng cho kết cấu bê tông cốt thép',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Bê tông đúc sẵn',
        slug: 'be-tong-duc-san',
        description: 'Các sản phẩm bê tông được đúc sẵn theo kích thước chuẩn',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Tôn, ngói, xà gồ',
        slug: 'ton-ngoi-xa-go',
        description: 'Vật liệu lợp mái và kết cấu phụ',
        isActive: true,
        parentId: null,
      }
    ]
  },

  // 2. VẬT TƯ KIM LOẠI & CƠ KHÍ (Parent Category)
  {
    name: 'Vật tư kim loại & cơ khí',
    slug: 'vat-tu-kim-loai-co-khi',
    description: 'Các sản phẩm kim loại và phụ kiện cơ khí dùng cho chế tạo, lắp ghép và kết cấu công nghiệp.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Thép tấm, thép hình',
        slug: 'thep-tam-thep-hinh',
        description: 'Thép tấm, thép hình I, H, U, V cho kết cấu',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Nhôm, inox, đồng, kẽm',
        slug: 'nhom-inox-dong-kem',
        description: 'Các loại kim loại màu và hợp kim',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Bu lông, ốc vít, đinh tán',
        slug: 'bu-long-oc-vit-dinh-tan',
        description: 'Phụ kiện kết nối và lắp ghép',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Ống thép, phụ kiện cơ khí',
        slug: 'ong-thep-phu-kien-co-khi',
        description: 'Ống thép và các phụ kiện cơ khí chuyên dụng',
        isActive: true,
        parentId: null,
      }
    ]
  },

  // 3. VẬT TƯ ĐIỆN & CHIẾU SÁNG (Parent Category)
  {
    name: 'Vật tư điện & chiếu sáng',
    slug: 'vat-tu-dien-chieu-sang',
    description: 'Thiết bị điện, dây dẫn và giải pháp chiếu sáng phục vụ dân dụng và công nghiệp.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Dây cáp điện, ổ cắm, cầu dao',
        slug: 'day-cap-dien-o-cam-cau-dao',
        description: 'Hệ thống dây dẫn và thiết bị đóng cắt',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Bóng đèn LED, đèn chiếu sáng',
        slug: 'bong-den-led-den-chieu-sang',
        description: 'Hệ thống chiếu sáng dân dụng và công nghiệp',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Tủ điện, aptomat, công tắc',
        slug: 'tu-dien-aptomat-cong-tac',
        description: 'Thiết bị điều khiển và bảo vệ mạch điện',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Thiết bị chống sét, ổn áp',
        slug: 'thiet-bi-chong-set-on-ap',
        description: 'Thiết bị bảo vệ và ổn định điện áp',
        isActive: true,
        parentId: null,
      }
    ]
  },

  // 4. VẬT TƯ NƯỚC & ỐNG DẪN (Parent Category)
  {
    name: 'Vật tư nước & ống dẫn',
    slug: 'vat-tu-nuoc-ong-dan',
    description: 'Hệ thống cấp thoát nước, ống dẫn và phụ kiện kết nối cho công trình.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Ống nhựa PVC, PPR, HDPE',
        slug: 'ong-nhua-pvc-ppr-hdpe',
        description: 'Các loại ống nhựa cho hệ thống cấp thoát nước',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Van, co, tê, cút, nối ren',
        slug: 'van-co-te-cut-noi-ren',
        description: 'Phụ kiện kết nối và điều khiển dòng chảy',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Đồng hồ nước, bơm nước',
        slug: 'dong-ho-nuoc-bom-nuoc',
        description: 'Thiết bị đo lường và bơm nước',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Bình chứa, két nước',
        slug: 'binh-chua-ket-nuoc',
        description: 'Thiết bị chứa và dự trữ nước',
        isActive: true,
        parentId: null,
      }
    ]
  },

  // 5. VẬT TƯ SƠN & CHỐNG THẤM (Parent Category)
  {
    name: 'Vật tư sơn & chống thấm',
    slug: 'vat-tu-son-chong-tham',
    description: 'Các loại sơn, hóa chất và vật liệu chống thấm bảo vệ bề mặt công trình.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Sơn nước, sơn dầu, sơn epoxy',
        slug: 'son-nuoc-son-dau-son-epoxy',
        description: 'Các loại sơn trang trí và bảo vệ bề mặt',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Sơn chống rỉ, sơn công nghiệp',
        slug: 'son-chong-ri-son-cong-nghiep',
        description: 'Sơn chuyên dụng cho môi trường công nghiệp',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Chất chống thấm, keo dán gạch',
        slug: 'chat-chong-tham-keo-dan-gach',
        description: 'Vật liệu chống thấm và keo dán chuyên dụng',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Bột bả, thạch cao',
        slug: 'bot-ba-thach-cao',
        description: 'Vật liệu hoàn thiện và trang trí bề mặt',
        isActive: true,
        parentId: null,
      }
    ]
  },

  // 6. VẬT TƯ NỘI THẤT & HOÀN THIỆN (Parent Category)
  {
    name: 'Vật tư nội thất & hoàn thiện',
    slug: 'vat-tu-noi-that-hoan-thien',
    description: 'Vật liệu hoàn thiện, trang trí và lắp đặt nội thất cho công trình.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Gạch ốp lát, đá granite, đá marble',
        slug: 'gach-op-lat-da-granite-da-marble',
        description: 'Vật liệu ốp lát trang trí cao cấp',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Cửa gỗ, cửa nhôm, cửa nhựa',
        slug: 'cua-go-cua-nhom-cua-nhua',
        description: 'Các loại cửa và khung cửa',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Trần thạch cao, vách ngăn',
        slug: 'tran-thach-cao-vach-ngan',
        description: 'Hệ thống trần và vách ngăn nội thất',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Phụ kiện nội thất',
        slug: 'phu-kien-noi-that',
        description: 'Tay nắm, bản lề, khóa và phụ kiện trang trí',
        isActive: true,
        parentId: null,
      }
    ]
  },

  // 7. VẬT TƯ AN TOÀN LAO ĐỘNG (Parent Category)
  {
    name: 'Vật tư an toàn lao động',
    slug: 'vat-tu-an-toan-lao-dong',
    description: 'Trang thiết bị bảo hộ và an toàn cho công nhân trong quá trình thi công.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Nón bảo hộ, kính, găng tay',
        slug: 'non-bao-ho-kinh-gang-tay',
        description: 'Trang thiết bị bảo hộ cá nhân',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Giày bảo hộ, áo phản quang',
        slug: 'giay-bao-ho-ao-phan-quang',
        description: 'Trang phục bảo hộ và nhận diện',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Dây an toàn, lưới an toàn',
        slug: 'day-an-toan-luoi-an-toan',
        description: 'Thiết bị an toàn khi làm việc trên cao',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Biển báo, rào chắn công trình',
        slug: 'bien-bao-rao-chan-cong-trinh',
        description: 'Thiết bị cảnh báo và ngăn chặn nguy hiểm',
        isActive: true,
        parentId: null,
      }
    ]
  },

  // 8. VẬT TƯ HÓA CHẤT (Parent Category)
  {
    name: 'Vật tư hóa chất',
    slug: 'vat-tu-hoa-chat',
    description: 'Các loại hóa chất, dung môi và phụ gia sử dụng trong xử lý, thi công và bảo trì công trình.',
    isActive: true,
    parentId: null,
    children: [
      {
        name: 'Hóa chất xử lý nước',
        slug: 'hoa-chat-xu-ly-nuoc',
        description: 'Clo, PAC, Javen và các hóa chất xử lý nước',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Dung môi công nghiệp',
        slug: 'dung-moi-cong-nghiep',
        description: 'Xylene, toluen, acetone và các dung môi chuyên dụng',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Keo dán, nhựa epoxy, PU, silicon',
        slug: 'keo-dan-nhua-epoxy-pu-silicon',
        description: 'Các loại keo dán và nhựa chuyên dụng',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Phụ gia xây dựng',
        slug: 'phu-gia-xay-dung',
        description: 'Chất chống thấm, chống rỉ, tăng độ bền bê tông',
        isActive: true,
        parentId: null,
      },
      {
        name: 'Sơn công nghiệp và dung dịch tẩy rửa',
        slug: 'son-cong-nghiep-dung-dich-tay-rua',
        description: 'Sơn chuyên dụng và hóa chất tẩy rửa',
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
