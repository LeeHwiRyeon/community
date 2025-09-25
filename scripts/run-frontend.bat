@echo off
setlocal
REM React/Vite 프론트엔드 개발 서버를 실행합니다.
REM Requires Node.js installed and available in PATH.

REM 로그 파일 생성
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
set TIMESTAMP=%datetime:~0,8%-%datetime:~8,6%
set LOGFILE=..\logs\run-frontend-%TIMESTAMP%.log

echo [%date% %time%] ===== Starting run-frontend.bat ===== >> %LOGFILE%
echo [%date% %time%] Log file: %LOGFILE% >> %LOGFILE%

REM 기존 프론트엔드 프로세스들을 이름으로 종료
echo [run-frontend] Killing existing frontend processes...
echo [%date% %time%] Killing existing frontend processes... >> %LOGFILE%
powershell -Command "try { taskkill /FI \"WINDOWTITLE eq Community Frontend\" /F 2>$null; taskkill /IM npm.cmd /F 2>$null; echo \"[%date% %time%] Killed existing processes\" >> %LOGFILE% } catch { echo \"[%date% %time%] Error killing processes: $_\" >> %LOGFILE% }"

pushd "%~dp0..\frontend"

IF NOT EXIST package.json (
  echo [run-frontend] package.json missing. Please make sure React app is properly set up.
  echo [%date% %time%] ERROR: package.json missing >> %LOGFILE%
  popd
  exit /b 1
)

IF NOT EXIST node_modules (
  echo [run-frontend] Installing dependencies...
  echo [%date% %time%] Installing dependencies... >> %LOGFILE%
  npm install
  IF ERRORLEVEL 1 (
    echo [run-frontend] Failed to install dependencies.
    echo [%date% %time%] ERROR: Failed to install dependencies >> %LOGFILE%
    popd
    exit /b 1
  )
)

echo [run-frontend] Starting React/Vite development server...
echo [%date% %time%] Starting React/Vite development server... >> %LOGFILE%
start "Community Frontend" cmd /c "cd /d %~dp0..\frontend && npm run dev"
start http://localhost:5000

echo [run-frontend] Frontend server started in background
echo [%date% %time%] Frontend server started in background >> %LOGFILE%
echo [%date% %time%] ===== run-frontend.bat finished ===== >> %LOGFILE%

goto :eof

popd
endlocal