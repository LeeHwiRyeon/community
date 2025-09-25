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

REM 포트 5000을 사용하는 기존 프로세스들을 종료
echo [run-frontend] Checking and killing processes on port 5000...
echo [%date% %time%] Checking and killing processes on port 5000... >> %LOGFILE%
powershell -Command "try { $pids = netstat -ano | findstr ':5000' | ForEach-Object { $_.Split()[-1] } | Sort-Object -Unique; foreach ($pid in $pids) { if ($pid -and $pid -ne 0) { taskkill /PID $pid /F 2>$null; echo \"[%date% %time%] Killed process $pid\" >> %LOGFILE% } } } catch { echo \"[%date% %time%] Error killing processes: $_\" >> %LOGFILE% }"

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
start http://localhost:5000
timeout /t 3 /nobreak > nul
npm run dev

echo [%date% %time%] ===== run-frontend.bat finished ===== >> %LOGFILE%

popd
endlocal