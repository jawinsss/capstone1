@echo off
chcp 65001 >nul
echo ========================================
echo    MatFlow - Hệ Thống Bán Vật Tư
echo    🚀 Auto Start Script v2.0
echo ========================================
echo.

echo [1/7] 🐳 Khởi động PostgreSQL database...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ❌ Lỗi: Không thể khởi động database
    echo 💡 Hãy đảm bảo Docker Desktop đang chạy
    pause
    exit /b 1
)

echo [2/7] ⏳ Chờ database khởi động hoàn tất...
timeout /t 8 /nobreak >nul

echo [3/7] 📦 Cài đặt dependencies cho backend...
cd backend
if not exist node_modules (
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Lỗi: Không thể cài đặt dependencies cho backend
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencies đã được cài đặt
)

echo [4/7] 🔧 Sinh Prisma Client...
npx prisma generate --schema=prisma\schema.prisma
if %errorlevel% neq 0 (
    echo ❌ Lỗi: Không thể sinh Prisma Client
    pause
    exit /b 1
)

echo [5/7] 🗄️ Chạy database migrations...
npx prisma migrate deploy --schema=prisma\schema.prisma
if %errorlevel% neq 0 (
    echo ⚠️ Warning: Migration failed, trying to push schema...
    npx prisma db push --schema=prisma\schema.prisma
)

echo [6/7] 🌱 Seed database với dữ liệu mẫu...
npx prisma db seed
if %errorlevel% neq 0 (
    echo ⚠️ Warning: Seed failed, continuing...
)

echo [7/7] 🚀 Khởi động NestJS backend...
start "MatFlow Backend Server" cmd /k "echo 🚀 MatFlow Backend Server && echo 📍 API: http://localhost:3000 && echo 📚 Swagger: http://localhost:3000/api && echo. && npm run start:dev"

cd ..

echo.
echo ✅ Khởi động thành công!
echo.
echo 🌐 Services:
echo   • Backend API: http://localhost:3000
echo   • Swagger Docs: http://localhost:3000/api  
echo   • Database: PostgreSQL (Docker port 5432)
echo   • pgAdmin: http://localhost:5050
echo.
echo 🎯 Admin Panel:
echo   • URL: frontend/Page/adminpage/admin.html
echo   • Features: Real-time data, Auto-refresh
echo.
echo 📱 Frontend:
echo   • Homepage: frontend/index.html
echo.

echo [Auto] 🌐 Mở Admin Panel...
timeout /t 3 /nobreak >nul
start frontend/Page/adminpage/admin.html

echo.
echo 🎉 Hoàn tất! Admin Panel đã được mở trong trình duyệt.
echo 🖥️ Backend đang chạy trong cửa sổ Command Prompt mới.
echo 📊 Dữ liệu sẽ tự động cập nhật real-time.
echo.
echo 💡 Tips:
echo   • Ctrl+C trong cửa sổ backend để dừng server
echo   • docker-compose down để dừng database
echo.
pause