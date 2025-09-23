@echo off
setlocal
REM 완전한 목업 데이터가 포함된 백엔드 서버를 실행합니다

echo [run-mock-backend] Starting full mock backend server...
echo [run-mock-backend] API will be available at: http://localhost:50000/api
echo [run-mock-backend] Help endpoint: http://localhost:50000/api/help

pushd "%~dp0server-backend"

IF NOT EXIST mock-server.js (
  echo [run-mock-backend] mock-server.js missing.
  popd
  exit /b 1
)

echo [run-mock-backend] Running mock server with complete test data...
node mock-server.js

popd
endlocal