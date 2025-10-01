@echo off
REM Auto-Progress Service Script
REM This script runs the auto-progress system as a Windows service-like process

echo ========================================
echo    Community Project Auto-Progress
echo    Service Mode - Background Operation
echo ========================================
echo.

REM Set up environment
set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

REM Create log file with timestamp
set LOG_FILE=logs\auto-progress-service-%date:~-4,4%%date:~-10,2%%date:~-7,2%.log
echo [%date% %time%] Starting Auto-Progress Service >> "%LOG_FILE%"

REM Function to log messages
:log
echo [%date% %time%] %~1 >> "%LOG_FILE%"
echo [%date% %time%] %~1
goto :eof

REM Check prerequisites
call :log "Checking prerequisites..."

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    call :log "ERROR: Node.js not found"
    call :log "Please install Node.js from https://nodejs.org/"
    pause
    exit /b 1
)

REM Check project files
if not exist "scripts\manager-centric-system.js" (
    call :log "ERROR: Project files not found"
    call :log "Please run from project root directory"
    pause
    exit /b 1
)

call :log "Prerequisites check passed"

REM Create necessary directories
if not exist "data" mkdir data
if not exist "logs" mkdir logs
if not exist "notifications" mkdir notifications
if not exist "config" mkdir config

call :log "Directories created/verified"

REM Start the monitoring loop
call :log "Starting auto-progress monitoring loop..."

:monitor_loop
    call :log "Running manager-centric system..."
    node scripts\manager-centric-system.js --mode=monitor >> "%LOG_FILE%" 2>&1
    
    if %errorlevel% neq 0 (
        call :log "ERROR: Manager-centric system failed with code %errorlevel%"
        call :log "Waiting 30 seconds before retry..."
        timeout /t 30 /nobreak >nul
    ) else (
        call :log "Manager-centric system completed successfully"
        call :log "Waiting 5 minutes before next run..."
        timeout /t 300 /nobreak >nul
    )
    
    goto :monitor_loop
