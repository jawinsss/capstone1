# Hướng dẫn Setup Backend

## Yêu cầu hệ thống

- **Node.js**: v22.15.0 (sử dụng file `.nvmrc`)
- **npm**: v11.5.2+
- **NestJS CLI**: v11.0.10

## Cài đặt nhanh

### 1. Cài đặt Node.js đúng version
```bash
# Nếu có nvm
nvm use

# Hoặc cài đặt Node.js v22.15.0 từ https://nodejs.org
```

### 2. Cài đặt dependencies và build
```bash
cd backend
npm run setup
```

Script `setup` sẽ tự động:
- Cài đặt tất cả dependencies
- Generate Prisma client
- Xóa folder dist cũ (nếu có)
- Build project mới

## Build thủ công

### Build clean (khuyến nghị)
```bash
npm run build:clean
```

### Build production
```bash
npm run build:prod
```

### Build thông thường
```bash
npm run build
```

## Chạy ứng dụng

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run start:prod
```

## Troubleshooting

### Nếu file dist khác nhau giữa các máy:

1. **Kiểm tra version Node.js**
   ```bash
   node --version  # Phải là v22.15.0
   ```

2. **Xóa cache và build lại**
   ```bash
   npm run build:clean
   ```

3. **Kiểm tra dependencies**
   ```bash
   npm list --depth=0
   ```

4. **Reinstall hoàn toàn**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build:clean
   ```

### Lỗi thường gặp:

- **"Cannot find module"**: Chạy `npm run prisma:generate`
- **"Build failed"**: Chạy `npm run build:clean`
- **"Port already in use"**: Thay đổi port trong `main.ts`

## Cấu trúc build

- **Source**: `src/` (TypeScript)
- **Build output**: `dist/` (JavaScript)
- **Config**: `tsconfig.build.json`

## Lưu ý quan trọng

- **KHÔNG** chỉnh sửa trực tiếp file trong `dist/`
- **LUÔN** chỉnh sửa code trong `src/` rồi build lại
- **SỬ DỤNG** `npm run build:clean` để đảm bảo build sạch
