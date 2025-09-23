@echo off
setlocal
REM 간단한 프론트엔드 테스트를 실행합니다

pushd "%~dp0frontend"

echo [test-frontend] Starting frontend test...
echo [test-frontend] Frontend will be at: http://localhost:5173
echo [test-frontend] Make sure backend is running at: http://localhost:50000

npm run dev

popd
endlocal