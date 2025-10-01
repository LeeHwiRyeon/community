@echo off
chcp 65001 >nul
title Community Hub - 안정적인 런처

echo.
echo ========================================
echo   🚀 Community Hub 안정적인 런처
echo ========================================
echo.

REM 기존 프로세스 정리
echo 🧹 기존 프로세스 정리 중...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM 환경변수 설정
set USE_MOCK_DB=1
set ENV_ALLOW_MOCK=1
set NODE_ENV=development

echo 🚀 백엔드 서버 시작 중...
start "Backend Server" /min cmd /c "cd /d server-backend && node src/index.js"

echo ⏳ 백엔드 서버 시작 대기 중...
timeout /t 10 /nobreak >nul

REM 백엔드 헬스체크
:backend_check
curl -s http://localhost:50000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ⏳ 백엔드 서버 시작 대기 중...
    timeout /t 2 /nobreak >nul
    goto backend_check
)
echo ✅ 백엔드 서버 시작 완료!

echo 🎨 프론트엔드 서버 시작 중...
start "Frontend Server" /min cmd /c "cd /d frontend && npm run dev"

echo ⏳ 프론트엔드 서버 시작 대기 중...
timeout /t 15 /nobreak >nul

REM 프론트엔드 헬스체크
:frontend_check
curl -s http://localhost:5002 >nul 2>&1
if %errorlevel% neq 0 (
    echo ⏳ 프론트엔드 서버 시작 대기 중...
    timeout /t 2 /nobreak >nul
    goto frontend_check
)
echo ✅ 프론트엔드 서버 시작 완료!

echo.
echo ========================================
echo   🎉 서버 시작 완료!
echo ========================================
echo.
echo 🌐 접속 URL:
echo   백엔드 API: http://localhost:50000
echo   프론트엔드: http://localhost:5002
echo   프로덕션:   http://localhost:5000
echo.
echo 💡 서버를 중지하려면 이 창을 닫으세요.
echo.

REM 브라우저 열기
start http://localhost:5002

echo 🎯 브라우저에서 애플리케이션을 확인하세요!
echo.
pause
