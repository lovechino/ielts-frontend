@echo off
TITLE IELTS Dev Runner
:: Chuyển đến thư mục chứa file script này
cd /d %~dp0

echo ==========================================
echo    IELTS LEARNING PLATFORM - DEV MODE
echo ==========================================
echo.

:: Start Backend (Cloudflare Worker)
echo [1/2] Starting Cloudflare Backend (Wrangler)...
start "IELTS Backend" cmd /k "cd /d backend-cloudflare && npm run dev"

:: Start Frontend (Next.js)
echo [2/2] Starting Next.js Frontend...
start "IELTS Frontend" cmd /k "cd /d frontend && npm run dev"

echo.
echo ==========================================
echo    ALL SYSTEMS GO!
echo    Vui long kiem tra 2 cua so cmd moi de xem logs.
echo ==========================================
pause
