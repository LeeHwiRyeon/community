@echo off
REM Simple Console Management System
REM This script provides a simple console-based management interface

:main_menu
cls
echo ========================================
echo    Community Project Auto-Progress
echo    Simple Console Management System
echo ========================================
echo.
echo [MAIN MENU] Select an option:
echo.
echo 1. System Status
echo 2. Start Services
echo 3. Stop Services
echo 4. Task Management
echo 5. Progress Tracking
echo 6. View Logs
echo 7. Quick Actions
echo 8. Exit
echo.
set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto system_status
if "%choice%"=="2" goto start_services
if "%choice%"=="3" goto stop_services
if "%choice%"=="4" goto task_management
if "%choice%"=="5" goto progress_tracking
if "%choice%"=="6" goto view_logs
if "%choice%"=="7" goto quick_actions
if "%choice%"=="8" goto exit
goto invalid_choice

:system_status
cls
echo ========================================
echo    System Status
echo ========================================
echo.

echo [CHECK] Node.js Processes:
tasklist /fi "imagename eq node.exe" /fo table | findstr "node.exe" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Node.js processes are running
    tasklist /fi "imagename eq node.exe" /fo table
) else (
    echo [WARNING] No Node.js processes found
)
echo.

echo [CHECK] Configuration Files:
if exist "config\auto-progress.json" (
    echo [SUCCESS] Configuration file exists
) else (
    echo [WARNING] Configuration file not found
)

if exist "data\progress-baseline.json" (
    echo [SUCCESS] Progress baseline exists
) else (
    echo [WARNING] Progress baseline not found
)
echo.

echo [CHECK] Log Files:
if exist "logs\auto-progress-service-*.log" (
    echo [SUCCESS] Service log files found
) else (
    echo [WARNING] No service log files found
)
echo.

echo [CHECK] System Resources:
echo [INFO] Disk space:
dir /-c | findstr "bytes free"
echo.

pause
goto main_menu

:start_services
cls
echo ========================================
echo    Start Services
echo ========================================
echo.

echo [INFO] Starting Auto-Progress Service...
start "Auto-Progress Service" auto-progress-service.bat
echo [SUCCESS] Auto-Progress Service started
echo.
echo [INFO] Service is running in the background
echo [INFO] Check status to see if it's working properly
echo.

pause
goto main_menu

:stop_services
cls
echo ========================================
echo    Stop Services
echo ========================================
echo.

echo [INFO] Stopping Auto-Progress Service...
taskkill /f /im "auto-progress-service.bat" 2>nul
schtasks /end /tn "Community Auto-Progress" 2>nul
echo [SUCCESS] Auto-Progress Service stopped
echo.

pause
goto main_menu

:task_management
cls
echo ========================================
echo    Task Management
echo ========================================
echo.

echo 1. View Generated Tasks
echo 2. Generate New Tasks
echo 3. Back to Main Menu
echo.
set /p task_choice="Enter your choice (1-3): "

if "%task_choice%"=="1" goto view_tasks
if "%task_choice%"=="2" goto generate_tasks
if "%task_choice%"=="3" goto main_menu
goto invalid_choice

:view_tasks
echo [INFO] Viewing generated tasks...
if exist "docs\todo-backlog-en.md" (
    echo [INFO] Auto-generated tasks:
    findstr /C:"🤖 자동 생성된 TODO" "docs\todo-backlog-en.md"
) else (
    echo [WARNING] TODO backlog file not found
)
echo.
pause
goto task_management

:generate_tasks
echo [INFO] Generating new tasks...
node scripts\auto-todo-generator.js
echo [SUCCESS] Task generation completed
echo.
pause
goto task_management

:progress_tracking
cls
echo ========================================
echo    Progress Tracking
echo ========================================
echo.

echo 1. View Current Progress
echo 2. Update Progress Baseline
echo 3. Generate Progress Report
echo 4. Back to Main Menu
echo.
set /p progress_choice="Enter your choice (1-4): "

if "%progress_choice%"=="1" goto view_progress
if "%progress_choice%"=="2" goto update_baseline
if "%progress_choice%"=="3" goto generate_report
if "%progress_choice%"=="4" goto main_menu
goto invalid_choice

:view_progress
echo [INFO] Current progress:
if exist "data\progress-baseline.json" (
    type "data\progress-baseline.json" | findstr "progress"
) else (
    echo [WARNING] Progress baseline not found
)
echo.
pause
goto progress_tracking

:update_baseline
echo [INFO] Updating progress baseline...
node scripts\update-baseline.js
echo [SUCCESS] Progress baseline updated
echo.
pause
goto progress_tracking

:generate_report
echo [INFO] Generating progress report...
node scripts\auto-progress-tracker.js
echo [SUCCESS] Progress report generated
echo.
pause
goto progress_tracking

:view_logs
cls
echo ========================================
echo    View Logs
echo ========================================
echo.

echo [INFO] Viewing service logs...
if exist "logs\auto-progress-service-*.log" (
    for %%f in (logs\auto-progress-service-*.log) do (
        echo [INFO] Log file: %%~nxf
        type "%%f" | more
        echo.
    )
) else (
    echo [WARNING] No log files found
)
echo.
pause
goto main_menu

:quick_actions
cls
echo ========================================
echo    Quick Actions
echo ========================================
echo.

echo 1. Quick Status Check
echo 2. Force Task Generation
echo 3. Force Progress Update
echo 4. System Health Check
echo 5. Back to Main Menu
echo.
set /p quick_choice="Enter your choice (1-5): "

if "%quick_choice%"=="1" goto quick_status
if "%quick_choice%"=="2" goto quick_generate
if "%quick_choice%"=="3" goto quick_update
if "%quick_choice%"=="4" goto quick_health
if "%quick_choice%"=="5" goto main_menu
goto invalid_choice

:quick_status
echo [INFO] Quick status check...
node scripts\manager-centric-system.js --quick-check
echo [SUCCESS] Quick status check completed
echo.
pause
goto quick_actions

:quick_generate
echo [INFO] Force generating tasks...
node scripts\auto-todo-generator.js --force
echo [SUCCESS] Task generation completed
echo.
pause
goto quick_actions

:quick_update
echo [INFO] Force updating progress...
node scripts\auto-progress-tracker.js --force-update
echo [SUCCESS] Progress update completed
echo.
pause
goto quick_actions

:quick_health
echo [INFO] System health check...
node scripts\manager-centric-system.js --health-check
echo [SUCCESS] Health check completed
echo.
pause
goto quick_actions

:invalid_choice
echo [ERROR] Invalid choice. Please try again.
pause
goto main_menu

:exit
cls
echo ========================================
echo    Thank you for using Auto-Progress
echo    Management System!
echo ========================================
echo.
echo [INFO] System is still running in the background
echo [INFO] Use option 3 to stop the system
echo.
pause
exit

:main_menu
goto main_menu
