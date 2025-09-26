@echo off
echo [CI] Starting CI automation...
echo.

REM Clean up any existing background processes
echo [CI] Cleaning up existing processes on ports 50000, 5000, 9323...
powershell -Command "try { $pids = netstat -ano | findstr ':50000\|:5000\|:9323' | ForEach-Object { $_.Split()[-1] } | Sort-Object -Unique; foreach ($pid in $pids) { if ($pid -and $pid -ne 0) { taskkill /PID $pid /F 2>$null } } } catch {}"

echo [CI] Killing any remaining Node.js processes...
powershell -Command "try { Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force } catch {}"

echo.

REM Start backend server in background
echo [CI] Starting Backend Server (Port 50000) in background...
start "Backend Server" cmd /c "cd server-backend && node src/index.js"

REM Wait a bit for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend server in background
echo [CI] Starting Frontend Server (Port 5000) in background...
start "Frontend Server" cmd /c "cd frontend && npm run dev"

REM Wait a bit for frontend to start
timeout /t 3 /nobreak > nul

REM Start backend tests in background
echo [CI] Starting Backend Tests in background...
start "Backend Tests" cmd /c "cd server-backend && npm run ci:backend"

REM Start frontend tests in background
echo [CI] Starting Frontend Tests in background...
start "Frontend Tests" cmd /c "cd frontend && npm test"

echo.
echo [CI] All servers and tests started in background.
echo [CI] Exiting batch file for CI automation...
echo.

exit 0