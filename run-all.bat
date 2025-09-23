@echo off
setlocal
REM 백엔드와 프론트엔드를 동시에 실행합니다

echo [run-all] Starting backend and frontend servers...
echo [run-all] Backend will be at: http://localhost:50000/api
echo [run-all] Frontend will be at: http://localhost:5173

REM 백엔드를 백그라운드에서 시작
echo [run-all] Starting backend server...
start "Backend Server" cmd /c "cd /d \"%~dp0\" && run-backend.bat"

REM 2초 대기 후 프론트엔드 시작
timeout /t 2 /nobreak >nul
echo [run-all] Starting frontend server...
start "Frontend Server" cmd /c "cd /d \"%~dp0\" && run-frontend.bat"

echo [run-all] Both servers are starting...
echo [run-all] Close this window to stop monitoring, or press any key to exit.
pause >nul

endlocal