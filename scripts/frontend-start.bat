@echo off
chcp 65001 >nul
setlocal

REM ===== Community React Frontend Dev Server Start Script =====
REM 용도: React/Vite 프론트엔드 개발 서버 실행
REM 사용법: frontend-start.bat
REM 포트: 5173 (Vite 기본값)

set ROOT=%~dp0..
set FRONTEND_DIR=%ROOT%\frontend

echo ===============================
echo Community React Frontend Server
echo ===============================
echo Port: 5173 (Vite default)
echo Directory: %FRONTEND_DIR%
echo Type: React + Vite + TypeScript
echo ===============================

cd /d "%FRONTEND_DIR%"
if errorlevel 1 (
    echo [ERROR] 프론트엔드 디렉터리를 찾을 수 없습니다: %FRONTEND_DIR%
    pause
    exit /b 1
)

if not exist "package.json" (
    echo [ERROR] React 앱 설정 파일이 없습니다: package.json
    pause
    exit /b 1
)

REM node_modules가 없으면 설치
if not exist "node_modules" (
    echo [INFO] 의존성 설치 중...
    npm install
    if errorlevel 1 (
        echo [ERROR] 의존성 설치 실패
        pause
        exit /b 1
    )
)

echo [INFO] React 개발 서버 시작 중...
npm run dev

if errorlevel 1 (
    echo [ERROR] React 서버 시작 실패
    pause
    exit /b 1
)

pause