@echo off
echo AutoAgent 시작 중...
echo ================================================================================

cd /d "%~dp0"

echo 사용할 대시보드를 선택하세요:
echo.
echo 1. 웹 대시보드 (브라우저에서 시각화)
echo 2. 심플 터미널 대시보드 (텍스트만)
echo 3. 모든 서비스 시작 (웹 + 터미널)
echo 4. 서버만 시작 (대시보드 없음)
echo.
set /p choice="선택 (1-4): "

if "%choice%"=="1" (
    echo 웹 대시보드 시작...
    call start-web-dashboard.bat
) else if "%choice%"=="2" (
    echo 심플 터미널 대시보드 시작...
    call start-simple-terminal.bat
) else if "%choice%"=="3" (
    echo 모든 서비스 시작...
    start "Cursor Server" cmd /c "node core/cursor-integration-manager.js"
    timeout /t 3 /nobreak >nul
    start "Web Dashboard" cmd /c "start-web-dashboard.bat"
    timeout /t 2 /nobreak >nul
    start "Terminal Dashboard" cmd /c "start-simple-terminal.bat"
    echo 모든 서비스가 시작되었습니다!
    pause
) else if "%choice%"=="4" (
    echo 서버만 시작...
    node core/cursor-integration-manager.js
) else (
    echo 잘못된 선택입니다.
    pause
)