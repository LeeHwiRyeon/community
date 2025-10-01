@echo off
echo 심플 터미널 대시보드 시작 중...
echo ================================================================================

cd /d "%~dp0"

echo 1. Cursor 통합 서버 시작...
start "Cursor Server" cmd /c "node core/cursor-integration-manager.js"

timeout /t 3 /nobreak >nul

echo 2. 심플 터미널 대시보드 시작...
echo ================================================================================
node core/simple-terminal-dashboard.js

pause
