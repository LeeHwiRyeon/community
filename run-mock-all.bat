@echo off
setlocal
REM 목업 백엔드와 프론트엔드를 동시에 실행합니다

echo [run-mock-all] Starting mock backend and frontend servers...
echo [run-mock-all] Mock Backend will be at: http://localhost:50000/api
echo [run-mock-all] Frontend will be at: http://localhost:5000

REM 목업 백엔드를 백그라운드에서 시작
echo [run-mock-all] Starting mock backend server...
start "Mock Backend Server" cmd /c "cd /d \"%~dp0\" && run-mock-backend.bat"

REM 2초 대기 후 프론트엔드 시작
timeout /t 2 /nobreak >nul
echo [run-mock-all] Starting frontend server...
start "Frontend Server" cmd /c "cd /d \"%~dp0\" && run-frontend.bat"

echo [run-mock-all] Both servers are starting...
echo [run-mock-all] Mock backend includes all test data (posts, users, chat, etc.)
echo [run-mock-all] Close this window to stop monitoring, or press any key to exit.
pause >nul

endlocal