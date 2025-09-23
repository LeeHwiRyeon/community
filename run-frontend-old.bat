@echo off
setlocal
REM frontend-old 디렉토리의 정적 서버를 실행합니다 (테스트용)

pushd "%~dp0frontend-old"

IF NOT EXIST _dev_static_server.js (
  echo [run-frontend-old] _dev_static_server.js missing.
  popd
  exit /b 1
)

echo [run-frontend-old] Starting static test server...
echo [run-frontend-old] Access: http://localhost:5500/simple-test.html
node _dev_static_server.js

popd
endlocal