@echo off
echo ========================================
echo  Community Hub - Full Stack Launcher
echo ========================================
echo.

REM 기존 Node 프로세스 정리
echo [1/3] Cleaning up existing processes...
taskkill /F /IM node.exe >nul 2>&1

REM 백엔드 실행 (목업 모드)
echo [2/3] Starting Backend (Mock Server)...
cd server-backend
start "Backend-Mock" cmd /k "node mock-server.js"

REM 잠시 대기
timeout /t 3 >nul

REM 프론트엔드 실행
echo [3/3] Starting Frontend (React + Vite)...
cd ..\frontend
start "Frontend-React" cmd /k "npm run dev"

echo.
echo ========================================
echo  🚀 SERVERS STARTING...
echo ========================================
echo  Backend:   http://localhost:50000
echo  Frontend:  http://localhost:5000
echo  API Help:  http://localhost:50000/api/help
echo ========================================
echo.
echo Press any key to open browser...
pause >nul

REM 브라우저 열기
start http://localhost:5000

echo ✅ Launch completed!
echo.
echo To stop servers:
echo - Close the terminal windows
echo - Or run: taskkill /F /IM node.exe
echo.
pause