@echo off
REM 매니저 인터페이스 통합 실행 스크립트
REM 콘솔 또는 웹 인터페이스 선택 가능

echo ========================================
echo    매니저 인터페이스 선택
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

echo [INFO] 매니저 인터페이스를 선택하세요:
echo.
echo 1. 콘솔 인터페이스 (명령어 기반)
echo    - 터미널에서 직접 입력
echo    - 명령어로 Task 관리
echo    - 빠른 작업 처리
echo.
echo 2. 웹 인터페이스 (브라우저 기반)
echo    - 웹 브라우저에서 사용
echo    - 직관적인 GUI
echo    - 실시간 통계 확인
echo.
echo 3. 종료
echo.

set /p choice="선택하세요 (1-3): "

if "%choice%"=="1" goto console_interface
if "%choice%"=="2" goto web_interface
if "%choice%"=="3" goto exit
goto invalid_choice

:console_interface
cls
echo ========================================
echo    콘솔 인터페이스 시작
echo ========================================
echo.
echo [INFO] 콘솔 인터페이스를 시작합니다...
echo [INFO] 자연어로 작업 요청을 입력하세요.
echo [INFO] 명령어는 /로 시작합니다 (예: /help)
echo.
node scripts/manager-console-interface.js
goto end

:web_interface
cls
echo ========================================
echo    웹 인터페이스 시작
echo ========================================
echo.
echo [INFO] 웹 인터페이스를 시작합니다...
echo [INFO] 브라우저에서 http://localhost:3001 에 접속하세요.
echo [INFO] 웹 인터페이스가 자동으로 열립니다.
echo.
echo [INFO] 웹 서버를 시작하는 중...
start http://localhost:3001
node scripts/manager-web-interface.js
goto end

:invalid_choice
echo.
echo [ERROR] 잘못된 선택입니다. 1, 2, 또는 3을 입력하세요.
echo.
pause
goto start

:exit
echo.
echo [INFO] 매니저 인터페이스를 종료합니다.
goto end

:end
echo.
echo [INFO] 매니저 인터페이스가 종료되었습니다.
pause
