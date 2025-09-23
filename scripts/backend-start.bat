@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM ===== Community Backend Server Start Script =====
REM 용도: 백엔드 서버만 실행 (포트 50000)
REM 사용법: backend-start.bat [옵션]
REM 옵션:
REM   --readonly : 읽기 전용 모드
REM   --port PORT : 사용자 정의 포트 (기본값: 50000)
REM   --no-browser : 브라우저 자동 오픈 안함
REM   --redis : Redis URL 설정

set ROOT=%~dp0..
set BACKEND_DIR=%ROOT%\server-backend

REM 기본값 설정
if not defined PORT set PORT=50000
if not defined DB_HOST set DB_HOST=localhost
if not defined DB_USER set DB_USER=root
if not defined DB_PASS set DB_PASS=
if not defined DB_NAME set DB_NAME=community

REM 인수 처리
:parse_args
if "%~1"=="" goto start_server
if /I "%~1"=="--readonly" (
    set READONLY=1
    shift
    goto parse_args
)
if /I "%~1"=="--port" (
    set PORT=%~2
    shift
    shift
    goto parse_args
)
if /I "%~1"=="--no-browser" (
    set NO_BROWSER=1
    shift
    goto parse_args
)
if /I "%~1"=="--redis" (
    set REDIS_URL=%~2
    shift
    shift
    goto parse_args
)
shift
goto parse_args

:start_server
echo ===============================
echo Community Backend Server
echo ===============================
echo Port: %PORT%
if defined READONLY echo Mode: Read-Only
if not defined READONLY echo Mode: Read-Write
echo Database: %DB_HOST%/%DB_NAME%
if defined REDIS_URL echo Redis: %REDIS_URL%
if not defined REDIS_URL echo Redis: In-Memory Mode
echo ===============================

REM 기존 프로세스 확인 및 종료
echo [INFO] Checking existing processes on port %PORT%...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT%') do (
    if not "%%a"=="" (
        echo [INFO] Found existing process PID: %%a, terminating...
        taskkill /PID %%a /F >nul 2>&1
        timeout /t 2 >nul
    )
)

cd /d "%BACKEND_DIR%"
if errorlevel 1 (
    echo [ERROR] 백엔드 디렉터리를 찾을 수 없습니다: %BACKEND_DIR%
    pause
    exit /b 1
)

REM 환경변수 설정
set PORT=%PORT%
if defined READONLY set READONLY=%READONLY%
if defined REDIS_URL set REDIS_URL=%REDIS_URL%

echo [INFO] Starting backend server...
node src/index.js

if errorlevel 1 (
    echo [ERROR] Failed to start server
    pause
    exit /b 1
)

REM 브라우저 오픈 (옵션)
if not defined NO_BROWSER (
    timeout /t 2 >nul
    start http://localhost:%PORT%/api/health
)

pause