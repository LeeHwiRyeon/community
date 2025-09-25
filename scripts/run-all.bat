@echo off
setlocal enabledelayedexpansion

REM 로그 파일 생성 (형식: run-all-YYYYMMDD-HHMMSS.log)
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
set TIMESTAMP=%datetime:~0,8%-%datetime:~8,6%
set LOGFILE=..\logs\run-all-%TIMESTAMP%.log

echo [%date% %time%] ===== Starting run-all.bat ===== >> %LOGFILE%
echo [%date% %time%] Log file: %LOGFILE% >> %LOGFILE%

echo Starting Community Full Stack Application...
echo [%date% %time%] Starting Community Full Stack Application... >> %LOGFILE%
echo.

REM 포트 50000과 5000을 사용하는 기존 프로세스들을 종료
echo [start-all] Checking and killing processes on ports 50000 and 5000...
echo [%date% %time%] Checking and killing processes on ports 50000 and 5000... >> %LOGFILE%
powershell -Command "try { $pids = netstat -ano | findstr ':50000\|:5000' | ForEach-Object { $_.Split()[-1] } | Sort-Object -Unique; foreach ($pid in $pids) { if ($pid -and $pid -ne 0) { taskkill /PID $pid /F 2>$null; echo \"[%date% %time%] Killed process $pid\" >> %LOGFILE% } } } catch { echo \"[%date% %time%] Error killing processes: $_\" >> %LOGFILE% }"

echo Starting Backend Server (Port 50000)...
echo [%date% %time%] Starting Backend Server (Port 50000)... >> %LOGFILE%
start "Backend Server" cmd /c "cd server-backend && node mock-server.js"

timeout /t 5 /nobreak > nul
echo [%date% %time%] Waited 5 seconds for backend to start >> %LOGFILE%

echo Starting Frontend Server (Port 5000)...
echo [%date% %time%] Starting Frontend Server (Port 5000)... >> %LOGFILE%
start "Frontend Server" cmd /c "cd frontend && npm run dev -- --open"

echo.
echo Servers should be starting...
echo Backend: http://localhost:50000
echo Frontend: http://localhost:5000
echo [%date% %time%] Servers started - Backend: http://localhost:50000, Frontend: http://localhost:5000 >> %LOGFILE%
echo.
echo Press any key to exit (servers will keep running)...
echo [%date% %time%] Waiting for user input to exit... >> %LOGFILE%
pause > nul

echo [%date% %time%] ===== run-all.bat finished ===== >> %LOGFILE%

endlocal