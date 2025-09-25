@echo off
chcp 65001 >nul
setlocal

REM ===== Community Server Stop Script =====
REM Purpose: Stop community server processes
REM Usage: server-stop.bat [port numbers]
REM Example: server-stop.bat 50000

set DEFAULT_BACKEND_PORT=50000
set DEFAULT_FRONTEND_PORT=5000

if "%1"=="" (
    set PORTS=%DEFAULT_BACKEND_PORT% %DEFAULT_FRONTEND_PORT%
    echo [INFO] Stopping default ports: %DEFAULT_BACKEND_PORT%, %DEFAULT_FRONTEND_PORT%
) else (
    set PORTS=%*
    echo [INFO] Stopping specified ports: %*
)

echo ===============================
echo Community Server Stop
echo ===============================

for %%p in (%PORTS%) do (
    echo [INFO] Checking processes on port %%p...
    
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%%p') do (
        if not "%%a"=="" (
            echo [INFO] Found process PID: %%a, terminating...
            taskkill /PID %%a /F >nul 2>&1
            if errorlevel 1 (
                echo [WARNING] Failed to terminate PID %%a
            ) else (
                echo [SUCCESS] PID %%a terminated successfully
            )
        )
    )
    
    REM Check if port is actually freed
    timeout /t 1 >nul
    netstat -ano | findstr :%%p >nul
    if errorlevel 1 (
        echo [SUCCESS] Port %%p is now free
    ) else (
        echo [WARNING] Port %%p is still in use
    )
    echo.
)

echo ===============================
echo Server stop process completed
echo ===============================
pause
