@echo off
chcp 65001 >nul
setlocal

REM ===== Community React Frontend Dev Server Start Script =====
REM Purpose: Launch React/Vite frontend dev server
REM Usage: frontend-start.bat
REM Port: 5000 (community default)

set ROOT=%~dp0..
set FRONTEND_DIR=%ROOT%\frontend

echo ===============================
echo Community React Frontend Server
echo ===============================
echo Port: 5000 (Community default)
echo Directory: %FRONTEND_DIR%
echo Type: React + Vite + TypeScript
echo ===============================

cd /d "%FRONTEND_DIR%"
if errorlevel 1 (
    echo [ERROR] ?꾨줎?몄뿏???붾젆?곕━瑜?李얠쓣 ???놁뒿?덈떎: %FRONTEND_DIR%
    pause
    exit /b 1
)

if not exist "package.json" (
    echo [ERROR] React ???ㅼ젙 ?뚯씪???놁뒿?덈떎: package.json
    pause
    exit /b 1
)

REM node_modules媛 ?놁쑝硫??ㅼ튂
if not exist "node_modules" (
    echo [INFO] ?섏〈???ㅼ튂 以?..
    npm install
    if errorlevel 1 (
        echo [ERROR] ?섏〈???ㅼ튂 ?ㅽ뙣
        pause
        exit /b 1
    )
)

echo [INFO] React 媛쒕컻 ?쒕쾭 ?쒖옉 以?..
npm run dev

if errorlevel 1 (
    echo [ERROR] React ?쒕쾭 ?쒖옉 ?ㅽ뙣
    pause
    exit /b 1
)

pause

