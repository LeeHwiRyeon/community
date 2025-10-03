@echo off
echo ========================================
echo Community Platform v1.2 서버 시작
echo ========================================
echo.

echo [1/3] 기존 프로세스 정리 중...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1
echo ✅ 기존 프로세스 정리 완료
echo.

echo [2/3] 백엔드 서버 시작 중...
cd /d "%~dp0server-backend"
set PORT=3001
start "Backend Server" cmd /k "echo 백엔드 서버 (포트 3001) && node src/index.js"
echo ✅ 백엔드 서버 시작됨 (포트 3001)
echo.

echo [3/3] 프론트엔드 서버 시작 중...
cd /d "%~dp0frontend"
start "Frontend Server" cmd /k "echo 프론트엔드 서버 (포트 3000) && npm run dev"
echo ✅ 프론트엔드 서버 시작됨 (포트 3000)
echo.

echo ========================================
echo 🎉 서버 시작 완료!
echo ========================================
echo.
echo 🌐 접속 URL:
echo   • 프론트엔드: http://localhost:3000
echo   • 백엔드 API: http://localhost:3001
echo.
echo 🎨 UIUX V2 페이지:
echo   • UIUX V2: http://localhost:3000/uiux-v2
echo   • 성능 대시보드: http://localhost:3000/performance
echo   • 접근성 패널: http://localhost:3000/accessibility
echo.
echo 💡 서버를 중지하려면 각 창에서 Ctrl+C를 누르세요
echo.
pause
