@echo off
setlocal
REM 백엔드 서버를 실행합니다

REM 기존 백엔드 프로세스들을 이름으로 종료
echo [run-backend] Killing existing backend processes...
powershell -Command "try { taskkill /FI \"WINDOWTITLE eq Community Backend\" /F 2>$null; taskkill /IM node.exe /F 2>$null; } catch {}"

pushd "%~dp0server-backend"

IF NOT EXIST package.json (
  echo [run-backend] package.json missing. Please make sure backend is properly set up.
  popd
  goto :eof
)

IF NOT EXIST node_modules (
  echo [run-backend] Installing dependencies...
  npm install
  IF ERRORLEVEL 1 (
    echo [run-backend] Failed to install dependencies.
    popd
    goto :eof
  )
)

echo [run-backend] Starting backend server...
echo [run-backend] API will be available at: http://localhost:50000/api
start "Community Backend" cmd /c "cd /d %~dp0server-backend && set ENV_ALLOW_MOCK=1 && set USE_MOCK_DB=1 && node src/index.js"

echo [run-backend] Backend server started in background

popd
goto :eof
endlocal