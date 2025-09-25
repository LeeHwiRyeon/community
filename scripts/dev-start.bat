@echo off
setlocal enabledelayedexpansion

REM ===== Community Full Stack Development Start Script =====
REM 용도: 프론트엔드 + 백엔드 동시 실행
REM 사용법: dev-start.bat [옵션]
REM 옵션:
REM   --backend-only : 백엔드만 실행
REM   --frontend-only : 프론트엔드만 실행
REM   --readonly : 백엔드 읽기 전용 모드
REM   --no-browser : 브라우저 자동 오픈 안함

set ROOT=%~dp0..
set SCRIPTS_DIR=%ROOT%\scripts

REM 기본 설정
set BACKEND_PORT=50000
set FRONTEND_PORT=5173
set START_BACKEND=1
set START_FRONTEND=1

REM 인수 처리
:parse_args
if "%~1"=="" goto start_services
if /I "%~1"=="--backend-only" (
    set START_FRONTEND=0
    shift
    goto parse_args
)
if /I "%~1"=="--frontend-only" (
    set START_BACKEND=0
    shift
    goto parse_args
)
if /I "%~1"=="--readonly" (
    set READONLY_MODE=--readonly
    shift
    goto parse_args
)
if /I "%~1"=="--no-browser" (
    set NO_BROWSER_MODE=--no-browser
    shift
    goto parse_args
)
shift
goto parse_args

:start_services
echo ===============================

REM 기존 Community 서버 프로세스들을 이름으로 종료
echo [INFO] 기존 서버 프로세스들을 종료하는 중...
powershell -Command "try { taskkill /FI \"WINDOWTITLE eq Community Backend\" /F 2>$null; taskkill /FI \"WINDOWTITLE eq Community Frontend\" /F 2>$null; taskkill /IM node.exe /F 2>$null; taskkill /IM npm.cmd /F 2>$null; } catch { }"

echo Community Full Stack Development
echo ===============================

REM 백엔드 시작
if "%START_BACKEND%"=="1" (
    echo [INFO] 백엔드 서버 시작 중...
    start "Community Backend" /d "%SCRIPTS_DIR%" cmd /k "backend-start.bat %READONLY_MODE% %NO_BROWSER_MODE%"
    timeout /t 3 >nul
)

REM 프론트엔드 시작
if "%START_FRONTEND%"=="1" (
    echo [INFO] 프론트엔드 서버 시작 중...
    start "Community Frontend" /d "%SCRIPTS_DIR%" cmd /k "frontend-start.bat %FRONTEND_PORT%"
    timeout /t 2 >nul
)

REM 브라우저 오픈 (프론트엔드가 활성화된 경우)
if "%START_FRONTEND%"=="1" if not defined NO_BROWSER_MODE (
    echo [INFO] 브라우저에서 개발 환경을 여는 중...
    start http://localhost:%FRONTEND_PORT%
)

echo ===============================
echo 개발 환경이 준비되었습니다!
echo ===============================

endlocal