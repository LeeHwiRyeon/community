@echo off
chcp 65001 > nul
setlocal

echo AutoAgent TODO 시스템 시작 중...
echo ================================================================================

:: AutoAgent 폴더로 이동
cd /d "%~dp0"

echo.
echo 1. Cursor 통합 서버 시작...
start "Cursor Server" cmd /c "node core/cursor-integration-manager.js --port=3000 --ws-port=3001"

echo 2. TODO 고도화 시스템 시작...
start "TODO Enhancement System" cmd /c "node todo-enhancement-system.js"

echo.
echo ================================================================================
echo 🚀 AutoAgent TODO 시스템이 시작되었습니다!
echo.
echo 📱 앱 기본 TODO 생성: 자동으로 앱별 TODO 생성
echo 🔧 TODO 고도화: 기존 TODO를 세부기획하여 고도화
echo 📋 순서별 처리: 우선순위에 따라 TODO 순차 처리
echo 🔄 자동 반복: TODO 완료 후 새로 생성하여 반복
echo.
echo 📊 생성되는 파일들:
echo   - app-todos.json: 앱별 TODO 리스트
echo   - app-workflows.json: 생성된 워크플로우
echo   - enhanced-todos.json: 고도화된 TODO
echo.
echo ================================================================================
echo 이 창은 5초 후에 자동으로 닫힙니다.
timeout /t 5 /nobreak > nul
exit


