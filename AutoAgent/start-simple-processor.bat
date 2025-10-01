@echo off
chcp 65001 > nul
setlocal

echo AutoAgent 간단한 TODO 처리기 시작 중...
echo ================================================================================

:: AutoAgent 폴더로 이동
cd /d "%~dp0"

echo.
echo 1. Cursor 통합 서버 시작...
start "Cursor Server" cmd /c "node core/cursor-integration-manager.js --port=3000 --ws-port=3001"

echo 2. 간단한 TODO 처리기 시작...
start "Simple Processor" cmd /c "node simple-todo-processor.js"

echo.
echo ================================================================================
echo 🚀 AutoAgent 간단한 TODO 처리기가 시작되었습니다!
echo.
echo 📋 TODO 파일: community-todos.md
echo 🔌 Cursor API: http://localhost:3000
echo 💬 처리기: 자동 실행 중
echo.
echo 💡 이제 TODO를 하나씩 처리하여 프로젝트를 생성합니다.
echo    각 TODO마다 하나의 프로젝트가 생성됩니다.
echo.
echo ================================================================================
echo 이 창은 5초 후에 자동으로 닫힙니다.
timeout /t 5 /nobreak > nul
exit
