@echo off
setlocal
REM 백엔드 서버를 실행합니다

REM 포트 50000을 사용하는 기존 프로세스들을 종료
echo [run-backend] Checking and killing processes on port 50000...
powershell -Command "try { $pids = netstat -ano | findstr ':50000' | ForEach-Object { $_.Split()[-1] } | Sort-Object -Unique; foreach ($pid in $pids) { if ($pid -and $pid -ne 0) { taskkill /PID $pid /F 2>$null } } } catch {}"

pushd "%~dp0server-backend"

IF NOT EXIST package.json (
  echo [run-backend] package.json missing. Please make sure backend is properly set up.
  popd
  exit /b 1
)

IF NOT EXIST node_modules (
  echo [run-backend] Installing dependencies...
  npm install
  IF ERRORLEVEL 1 (
    echo [run-backend] Failed to install dependencies.
    popd
    exit /b 1
  )
)

echo [run-backend] Starting backend server...
echo [run-backend] API will be available at: http://localhost:50000/api
set ENV_ALLOW_MOCK=1
set USE_MOCK_DB=1
node src/index.js

popd
endlocal