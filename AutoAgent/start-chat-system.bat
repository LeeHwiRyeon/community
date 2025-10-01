@echo off
chcp 65001 > nul
setlocal

echo AutoAgent Chat Integrated System 시작 중...
echo ================================================================================

:: AutoAgent 폴더로 이동
cd /d "%~dp0"

echo.
echo 1. Cursor 통합 서버 시작...
start "Cursor Server" cmd /c "node core/cursor-integration-manager.js --port=3000 --ws-port=3001"

echo 2. Enhanced Web Dashboard 시작...
start "Enhanced Dashboard" cmd /c "node visualization/enhanced-web-server.js --port=55550"

echo 3. Chat Integrated Executor 시작...
start "Chat Executor" cmd /c "node chat-integrated-executor.js"

echo.
echo ================================================================================
echo 🚀 AutoAgent Chat Integrated System이 시작되었습니다!
echo.
echo 📊 Enhanced Dashboard: http://localhost:55550
echo 🔌 Cursor API: http://localhost:3000
echo 💬 Chat System: 통합됨
echo.
echo 💡 이제 채팅 시스템을 통해 Task가 생성되고
echo    결과가 실시간으로 AutoAgent로 전송됩니다.
echo.
echo ================================================================================
echo 이 창은 5초 후에 자동으로 닫힙니다.
timeout /t 5 /nobreak > nul
exit
