@echo off
echo ========================================
echo    MatFlow - Hệ Thống Bán Vật Tư
echo ========================================
echo.

echo [1/4] Khoi dong PostgreSQL database...
docker-compose up -d
if %errorlevel% neq 0 (
    echo Loi: Khong the khoi dong database
    pause
    exit /b 1
)

echo [2/4] Cho database khoi dong...
timeout /t 5 /nobreak >nul

echo [3/4] Cai dat dependencies cho backend...
cd backend
npm install
if %errorlevel% neq 0 (
    echo Loi: Khong the cai dat dependencies cho backend
    pause
    exit /b 1
)

echo [4/4] Khoi dong NestJS backend...
start "MatFlow Backend" cmd /k "npm run start:dev"

echo.
echo    success start
echo.
echo Backend: http://localhost:3000
echo Database: PostgreSQL (Docker)
echo Frontend: frontend/index.html
echo.
echo Dang mo frontend...
timeout /t 2 /nobreak >nul
start frontend/index.html

echo.
echo Hoan tat! Frontend da duoc mo trong trinh duyet.
echo Backend dang chay trong cua so Command Prompt moi.
echo.
pause
