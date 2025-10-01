@echo off
REM 매니저 콘솔 인터페이스 실행 스크립트
REM 자연어 입력으로 자동 Task 생성

echo ========================================
echo    매니저 콘솔 인터페이스
echo    자연어 입력으로 자동 Task 생성
echo ========================================
echo.

REM Node.js 설치 확인
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js가 설치되지 않았습니다.
    echo https://nodejs.org/에서 Node.js를 설치해주세요.
    pause
    exit /b 1
)

REM 프로젝트 디렉토리로 이동
cd /d "%~dp0"

REM 필요한 디렉토리 생성
if not exist "docs" mkdir docs
if not exist "logs" mkdir logs
if not exist "notifications" mkdir notifications

echo [INFO] 매니저 콘솔 인터페이스를 시작합니다...
echo [INFO] 자연어로 작업 요청을 입력하세요.
echo [INFO] 예: "로그인 버그 수정해줘"
echo [INFO] 예: "새로운 사용자 관리 기능 추가"
echo [INFO] 예: "성능 최적화 필요해"
echo.

REM 매니저 콘솔 인터페이스 실행
node scripts/manager-console-interface.js

pause
