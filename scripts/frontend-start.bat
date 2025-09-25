@echo off
chcp 65001 >nul
setlocal

REM ===== Community React Frontend Dev Server Start Script =====
REM Purpose: Launch React/Vite frontend dev server
REM Usage: frontend-start.bat
REM Port: 5000 (community default)

set ROOT=%~dp0..
set FRONTEND_DIR=%ROOT%\frontend

REM 기존 프론트엔드 프로세스들을 이름으로 종료
echo [INFO] 기존 프론트엔드 프로세스들을 종료하는 중...
powershell -Command "try { taskkill /FI \"WINDOWTITLE eq Community Frontend\" /F 2>$null; taskkill /IM npm.cmd /F 2>$null; } catch { }"

echo ===============================
echo Community React Frontend Server
echo ===============================
echo Port: 5000 (Community default)
echo Directory: %FRONTEND_DIR%
echo Type: React + Vite + TypeScript
echo ===============================

cd /d "%FRONTEND_DIR%"
if errorlevel 1 (
    echo [ERROR] 프론트엔드 디렉터리를 찾을 수 없습니다: %FRONTEND_DIR%
    goto :eof
)

if not exist "package.json" (
    echo [ERROR] React 프로젝트 파일이 없습니다: package.json
    goto :eof
)

REM node_modules가 없으면 설치
if not exist "node_modules" (
    echo [INFO] 의존성 패키지를 설치 중...
    npm install
    if errorlevel 1 (
        echo [ERROR] 의존성 설치 실패
        goto :eof
    )
)

echo [INFO] React 개발 서버 시작 중...
start "Community Frontend" cmd /c "cd /d %FRONTEND_DIR% && npm run dev"

echo [INFO] Frontend server started in background
goto :eof

