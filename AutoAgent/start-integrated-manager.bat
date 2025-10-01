@echo off
chcp 65001 > nul
setlocal

echo AutoAgent 통합 매니저 시스템 시작 중...
echo ================================================================================

:: AutoAgent 폴더로 이동
cd /d "%~dp0"

echo.
echo 1. Cursor 통합 서버 시작...
start "Cursor Server" cmd /c "node core/cursor-integration-manager.js --port=3000 --ws-port=3001"

echo 2. Enhanced Web Dashboard 시작...
start "Enhanced Dashboard" cmd /c "node visualization/enhanced-web-server.js --port=55550"

echo 3. 통합 매니저 시스템 시작...
start "Integrated Manager" cmd /c "node integrated-manager-system.js"

echo.
echo ================================================================================
echo 🚀 AutoAgent 통합 매니저 시스템이 시작되었습니다!
echo.
echo 📊 Enhanced Dashboard: http://localhost:55550
echo 🔌 Cursor API: http://localhost:3000
echo 💬 통합 매니저: 자동 실행 중
echo.
echo 💡 이제 매니저 TODO 리스트를 자동으로 수집하고
echo    Cursor 테스트 채팅 요청으로 전송하여
echo    작업 완료 후 결과를 수거하는 완전 자동화 시스템이 실행됩니다.
echo.
echo ================================================================================
echo 이 창은 5초 후에 자동으로 닫힙니다.
timeout /t 5 /nobreak > nul
exit
