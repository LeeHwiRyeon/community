@echo off
echo 🚀 Community Platform 2.0 시작 중...
echo.

echo 📦 백엔드 서버 시작...
start "Backend Server" cmd /k "cd server-backend && node simple-server.cjs"

timeout /t 3 /nobreak >nul

echo 🎨 프론트엔드 서버 시작...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo ✅ 모든 서버가 시작되었습니다!
echo 🌐 백엔드: http://localhost:5000
echo 🎮 프론트엔드: http://localhost:3000
echo.
pause
