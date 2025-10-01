@echo off
echo 🤖 AutoAgent 완전 자동화 모드 시작
echo ================================================================================

cd /d "%~dp0"

echo AutoAgent가 모든 작업을 자동으로 수행합니다...
echo - 테스트 프로젝트 생성
echo - 자동 테스트 실행  
echo - 지속적 모니터링
echo - 프로젝트 재생성
echo.

echo 시작하려면 아무 키나 누르세요...
pause >nul

echo.
echo 🚀 AutoAgent 자동 실행 시작...
node auto-agent-controller.js

echo.
echo AutoAgent가 중지되었습니다.
pause
