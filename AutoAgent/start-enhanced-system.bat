@echo off
chcp 65001 > nul
setlocal

echo AutoAgent Enhanced System 시작 중...
echo ================================================================================

:: AutoAgent 폴더로 이동
cd /d "%~dp0"

echo.
echo 1. Cursor 통합 서버 시작...
start "Cursor Server" cmd /c "node core/cursor-integration-manager.js --port=3000 --ws-port=3001"

echo 2. Enhanced Web Dashboard 시작...
start "Enhanced Dashboard" cmd /c "node visualization/enhanced-web-server.js --port=55550"

echo 3. Enhanced Continuous Executor 시작...
start "Enhanced Executor" cmd /c "node enhanced-continuous-executor.js"

echo.
echo ================================================================================
echo 🚀 AutoAgent Enhanced System이 시작되었습니다!
echo.
echo 📊 Enhanced Dashboard: http://localhost:55550
echo 🔌 Cursor API: http://localhost:3000
echo.
echo 💡 이제 연속 Task 실행기가 자동으로 프로젝트를 생성하고
echo    결과를 AutoAgent로 전송하여 실시간으로 모니터링할 수 있습니다.
echo.
echo ================================================================================
echo 이 창은 5초 후에 자동으로 닫힙니다.
timeout /t 5 /nobreak > nul
exit
