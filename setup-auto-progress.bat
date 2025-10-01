@echo off
REM Auto-Progress Setup Script
REM This script sets up the auto-progress system for automatic execution

echo ========================================
echo    Community Project Auto-Progress
echo    Setup and Configuration Script
echo ========================================
echo.

REM Set up environment
set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

echo [SETUP] Setting up Auto-Progress System...
echo.

REM 1. Update progress baseline
echo [STEP 1] Updating progress baseline...
node scripts\update-baseline.js
if %errorlevel% neq 0 (
    echo ERROR: Failed to update progress baseline
    pause
    exit /b 1
)
echo [SUCCESS] Progress baseline updated
echo.

REM 2. Create Windows Task Scheduler entry
echo [STEP 2] Creating Windows Task Scheduler entry...
schtasks /create /tn "Community Auto-Progress" /tr "%PROJECT_DIR%auto-progress-service.bat" /sc minute /mo 5 /ru "SYSTEM" /f >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Windows Task Scheduler entry created
    echo [INFO] Auto-progress will run every 5 minutes
) else (
    echo [WARNING] Failed to create Task Scheduler entry
    echo [INFO] You can manually run auto-progress-service.bat
)
echo.

REM 3. Create startup script
echo [STEP 3] Creating startup script...
echo @echo off > start-auto-progress.bat
echo cd /d "%PROJECT_DIR%" >> start-auto-progress.bat
echo start "Auto-Progress Service" auto-progress-service.bat >> start-auto-progress.bat
echo [SUCCESS] Startup script created
echo.

REM 4. Test the system
echo [STEP 4] Testing auto-progress system...
echo [INFO] Running test cycle...
node scripts\manager-centric-system.js --mode=test
if %errorlevel% equ 0 (
    echo [SUCCESS] Auto-progress system test passed
) else (
    echo [WARNING] Auto-progress system test failed
    echo [INFO] Check logs for details
)
echo.

REM 5. Display status
echo [STEP 5] System Status:
echo [INFO] Project Directory: %PROJECT_DIR%
echo [INFO] Log Directory: %PROJECT_DIR%logs
echo [INFO] Config Directory: %PROJECT_DIR%config
echo [INFO] Data Directory: %PROJECT_DIR%data
echo.

REM 6. Create management scripts
echo [STEP 6] Creating management scripts...

REM Status check script
echo @echo off > check-status.bat
echo echo Auto-Progress System Status: >> check-status.bat
echo echo. >> check-status.bat
echo if exist "logs\auto-progress-service-*.log" ( >> check-status.bat
echo     echo [INFO] Service is running >> check-status.bat
echo     echo [INFO] Latest log entries: >> check-status.bat
echo     type "logs\auto-progress-service-*.log" ^| findstr /C:"[INFO]" ^| tail -5 >> check-status.bat
echo ^) else ( >> check-status.bat
echo     echo [WARNING] Service is not running >> check-status.bat
echo ^) >> check-status.bat
echo pause >> check-status.bat

REM Stop script
echo @echo off > stop-auto-progress.bat
echo echo Stopping Auto-Progress Service... >> stop-auto-progress.bat
echo taskkill /f /im "auto-progress-service.bat" 2^>nul >> stop-auto-progress.bat
echo schtasks /end /tn "Community Auto-Progress" 2^>nul >> stop-auto-progress.bat
echo echo [SUCCESS] Auto-Progress Service stopped >> stop-auto-progress.bat
echo pause >> stop-auto-progress.bat

REM Start script
echo @echo off > start-auto-progress.bat
echo echo Starting Auto-Progress Service... >> start-auto-progress.bat
echo start "Auto-Progress Service" auto-progress-service.bat >> start-auto-progress.bat
echo echo [SUCCESS] Auto-Progress Service started >> start-auto-progress.bat
echo pause >> start-auto-progress.bat

echo [SUCCESS] Management scripts created
echo.

REM 7. Display usage instructions
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo Available Commands:
echo   start-auto-progress.bat    - Start the auto-progress service
echo   stop-auto-progress.bat     - Stop the auto-progress service
echo   check-status.bat           - Check system status
echo   auto-progress-service.bat  - Run service directly
echo.
echo The system will now:
echo   - Run every 5 minutes automatically
echo   - Generate new tasks based on code analysis
echo   - Track progress toward Version 3.0.0
echo   - Log all activities to logs directory
echo.
echo To start the system now, run: start-auto-progress.bat
echo.

pause
