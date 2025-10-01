@echo off
REM Enhanced Console Management System
REM This script provides a comprehensive console-based management interface

echo ========================================
echo    Community Project Auto-Progress
echo    Enhanced Console Management System
echo ========================================
echo.

:main_menu
echo [MAIN MENU] Select an option:
echo.
echo 1. System Status & Health
echo 2. Start/Stop Services
echo 3. Task Management
echo 4. Progress Tracking
echo 5. Configuration
echo 6. Logs & Reports
echo 7. Quick Actions
echo 8. Help & Documentation
echo 9. Exit
echo.
set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto system_status
if "%choice%"=="2" goto service_control
if "%choice%"=="3" goto task_management
if "%choice%"=="4" goto progress_tracking
if "%choice%"=="5" goto configuration
if "%choice%"=="6" goto logs_reports
if "%choice%"=="7" goto quick_actions
if "%choice%"=="8" goto help_docs
if "%choice%"=="9" goto exit
goto invalid_choice

:system_status
echo.
echo ========================================
echo    System Status & Health
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
    for %%f in (logs\auto-progress-service-*.log) do (
        echo [INFO] Latest entries from %%~nxf:
        type "%%f" | findstr /C:"[INFO]" | more +0
        echo.
    )
) else (
    echo [WARNING] No service log files found
)
echo.

echo [CHECK] System Resources:
echo [INFO] Disk space:
dir /-c | findstr "bytes free"
echo.
echo [INFO] Memory usage:
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value | findstr "="
echo.

pause
goto main_menu

:service_control
echo.
echo ========================================
echo    Service Control
echo ========================================
echo.

echo 1. Start Auto-Progress Service
echo 2. Stop Auto-Progress Service
echo 3. Restart Auto-Progress Service
echo 4. Check Service Status
echo 5. Back to Main Menu
echo.
set /p service_choice="Enter your choice (1-5): "

if "%service_choice%"=="1" goto start_service
if "%service_choice%"=="2" goto stop_service
if "%service_choice%"=="3" goto restart_service
if "%service_choice%"=="4" goto check_service
if "%service_choice%"=="5" goto main_menu
goto invalid_choice

:start_service
echo [INFO] Starting Auto-Progress Service...
start "Auto-Progress Service" auto-progress-service.bat
echo [SUCCESS] Auto-Progress Service started
pause
goto service_control

:stop_service
echo [INFO] Stopping Auto-Progress Service...
taskkill /f /im "auto-progress-service.bat" 2>nul
schtasks /end /tn "Community Auto-Progress" 2>nul
echo [SUCCESS] Auto-Progress Service stopped
pause
goto service_control

:restart_service
echo [INFO] Restarting Auto-Progress Service...
taskkill /f /im "auto-progress-service.bat" 2>nul
timeout /t 3 /nobreak >nul
start "Auto-Progress Service" auto-progress-service.bat
echo [SUCCESS] Auto-Progress Service restarted
pause
goto service_control

:check_service
echo [INFO] Checking Auto-Progress Service status...
tasklist /fi "imagename eq auto-progress-service.bat" /fo table | findstr "auto-progress-service.bat" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Auto-Progress Service is running
) else (
    echo [WARNING] Auto-Progress Service is not running
)
pause
goto service_control

:task_management
echo.
echo ========================================
echo    Task Management
echo ========================================
echo.

echo 1. View Generated Tasks
echo 2. Approve Tasks
echo 3. Generate New Tasks
echo 4. Task Statistics
echo 5. Back to Main Menu
echo.
set /p task_choice="Enter your choice (1-5): "

if "%task_choice%"=="1" goto view_tasks
if "%task_choice%"=="2" goto approve_tasks
if "%task_choice%"=="3" goto generate_tasks
if "%task_choice%"=="4" goto task_stats
if "%task_choice%"=="5" goto main_menu
goto invalid_choice

:view_tasks
echo [INFO] Viewing generated tasks...
if exist "docs\todo-backlog-en.md" (
    echo [INFO] Auto-generated tasks:
    findstr /C:"🤖 자동 생성된 TODO" "docs\todo-backlog-en.md"
) else (
    echo [WARNING] TODO backlog file not found
)
pause
goto task_management

:approve_tasks
echo [INFO] Approving tasks...
node scripts\auto-task-assigner.js --approve-pending
echo [SUCCESS] Task approval completed
pause
goto task_management

:generate_tasks
echo [INFO] Generating new tasks...
node scripts\auto-todo-generator.js
echo [SUCCESS] Task generation completed
pause
goto task_management

:task_stats
echo [INFO] Task statistics...
node scripts\auto-progress-tracker.js --stats
echo [SUCCESS] Statistics generated
pause
goto task_management

:progress_tracking
echo.
echo ========================================
echo    Progress Tracking
echo ========================================
echo.

echo 1. View Current Progress
echo 2. Update Progress Baseline
echo 3. Generate Progress Report
echo 4. Version Information
echo 5. Back to Main Menu
echo.
set /p progress_choice="Enter your choice (1-5): "

if "%progress_choice%"=="1" goto view_progress
if "%progress_choice%"=="2" goto update_baseline
if "%progress_choice%"=="3" goto generate_report
if "%progress_choice%"=="4" goto version_info
if "%progress_choice%"=="5" goto main_menu
goto invalid_choice

:view_progress
echo [INFO] Current progress:
if exist "data\progress-baseline.json" (
    type "data\progress-baseline.json" | findstr "progress"
) else (
    echo [WARNING] Progress baseline not found
)
pause
goto progress_tracking

:update_baseline
echo [INFO] Updating progress baseline...
node scripts\update-baseline.js
echo [SUCCESS] Progress baseline updated
pause
goto progress_tracking

:generate_report
echo [INFO] Generating progress report...
node scripts\auto-progress-tracker.js
echo [SUCCESS] Progress report generated
pause
goto progress_tracking

:version_info
echo [INFO] Version information:
if exist "data\progress-baseline.json" (
    type "data\progress-baseline.json" | findstr "Version"
) else (
    echo [WARNING] Progress baseline not found
)
pause
goto progress_tracking

:configuration
echo.
echo ========================================
echo    Configuration
echo ========================================
echo.

echo 1. View Current Configuration
echo 2. Edit Configuration
echo 3. Reset Configuration
echo 4. Test Configuration
echo 5. Back to Main Menu
echo.
set /p config_choice="Enter your choice (1-5): "

if "%config_choice%"=="1" goto view_config
if "%config_choice%"=="2" goto edit_config
if "%config_choice%"=="3" goto reset_config
if "%config_choice%"=="4" goto test_config
if "%config_choice%"=="5" goto main_menu
goto invalid_choice

:view_config
echo [INFO] Current configuration:
if exist "config\auto-progress.json" (
    type "config\auto-progress.json"
) else (
    echo [WARNING] Configuration file not found
)
pause
goto configuration

:edit_config
echo [INFO] Opening configuration file for editing...
if exist "config\auto-progress.json" (
    notepad "config\auto-progress.json"
    echo [SUCCESS] Configuration file opened for editing
) else (
    echo [WARNING] Configuration file not found
)
pause
goto configuration

:reset_config
echo [INFO] Resetting configuration to defaults...
node scripts\update-baseline.js
echo [SUCCESS] Configuration reset to defaults
pause
goto configuration

:test_config
echo [INFO] Testing configuration...
node scripts\manager-centric-system.js --test
echo [SUCCESS] Configuration test completed
pause
goto configuration

:logs_reports
echo.
echo ========================================
echo    Logs & Reports
echo ========================================
echo.

echo 1. View Service Logs
echo 2. View Progress Reports
echo 3. View Manager Dashboard
echo 4. Clear Old Logs
echo 5. Export Reports
echo 6. Back to Main Menu
echo.
set /p logs_choice="Enter your choice (1-6): "

if "%logs_choice%"=="1" goto view_logs
if "%logs_choice%"=="2" goto view_reports
if "%logs_choice%"=="3" goto view_dashboard
if "%logs_choice%"=="4" goto clear_logs
if "%logs_choice%"=="5" goto export_reports
if "%logs_choice%"=="6" goto main_menu
goto invalid_choice

:view_logs
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
pause
goto logs_reports

:view_reports
echo [INFO] Viewing progress reports...
if exist "docs\progress-report.md" (
    type "docs\progress-report.md"
) else (
    echo [WARNING] Progress report not found
)
pause
goto logs_reports

:view_dashboard
echo [INFO] Viewing manager dashboard...
if exist "docs\manager-dashboard.md" (
    type "docs\manager-dashboard.md"
) else (
    echo [WARNING] Manager dashboard not found
)
pause
goto logs_reports

:clear_logs
echo [INFO] Clearing old logs...
for %%f in (logs\auto-progress-service-*.log) do (
    if %%~zf gtr 10485760 (
        del "%%f"
        echo [INFO] Deleted old log file: %%~nxf
    )
)
echo [SUCCESS] Old logs cleared
pause
goto logs_reports

:export_reports
echo [INFO] Exporting reports...
node scripts\auto-progress-tracker.js --export
echo [SUCCESS] Reports exported
pause
goto logs_reports

:quick_actions
echo.
echo ========================================
echo    Quick Actions
echo ========================================
echo.

echo 1. Quick Status Check
echo 2. Force Task Generation
echo 3. Force Progress Update
echo 4. System Health Check
echo 5. Emergency Stop
echo 6. Back to Main Menu
echo.
set /p quick_choice="Enter your choice (1-6): "

if "%quick_choice%"=="1" goto quick_status
if "%quick_choice%"=="2" goto quick_generate
if "%quick_choice%"=="3" goto quick_update
if "%quick_choice%"=="4" goto quick_health
if "%quick_choice%"=="5" goto quick_stop
if "%quick_choice%"=="6" goto main_menu
goto invalid_choice

:quick_status
echo [INFO] Quick status check...
node scripts\manager-centric-system.js --quick-check
echo [SUCCESS] Quick status check completed
pause
goto quick_actions

:quick_generate
echo [INFO] Force generating tasks...
node scripts\auto-todo-generator.js --force
echo [SUCCESS] Task generation completed
pause
goto quick_actions

:quick_update
echo [INFO] Force updating progress...
node scripts\auto-progress-tracker.js --force-update
echo [SUCCESS] Progress update completed
pause
goto quick_actions

:quick_health
echo [INFO] System health check...
node scripts\manager-centric-system.js --health-check
echo [SUCCESS] Health check completed
pause
goto quick_actions

:quick_stop
echo [WARNING] Emergency stop initiated...
taskkill /f /im "node.exe" 2>nul
taskkill /f /im "auto-progress-service.bat" 2>nul
echo [SUCCESS] Emergency stop completed
pause
goto quick_actions

:help_docs
echo.
echo ========================================
echo    Help & Documentation
echo ========================================
echo.

echo 1. System Overview
echo 2. Quick Start Guide
echo 3. Troubleshooting
echo 4. Configuration Guide
echo 5. API Reference
echo 6. Back to Main Menu
echo.
set /p help_choice="Enter your choice (1-6): "

if "%help_choice%"=="1" goto system_overview
if "%help_choice%"=="2" goto quick_start
if "%help_choice%"=="3" goto troubleshooting
if "%help_choice%"=="4" goto config_guide
if "%help_choice%"=="5" goto api_reference
if "%help_choice%"=="6" goto main_menu
goto invalid_choice

:system_overview
echo [INFO] System Overview:
echo.
echo The Auto-Progress System is an intelligent development automation
echo tool that continuously monitors your project and generates tasks
echo to drive progress toward your target version.
echo.
echo Key Features:
echo - Automatic task generation based on code analysis
echo - Progress tracking toward version goals
echo - Work completion detection and next task generation
echo - Intelligent bug pattern detection
echo - Real-time monitoring and alerting
echo.
pause
goto help_docs

:quick_start
echo [INFO] Quick Start Guide:
echo.
echo 1. Start the system: start-auto-progress.bat
echo 2. Check status: check-status.bat
echo 3. View tasks: Check docs/todo-backlog-en.md
echo 4. Monitor progress: Check data/progress-baseline.json
echo 5. Stop system: stop-auto-progress.bat
echo.
echo For detailed instructions, see docs/auto-progress-deployment-guide.md
echo.
pause
goto help_docs

:troubleshooting
echo [INFO] Troubleshooting:
echo.
echo Common Issues:
echo 1. System not starting: Check Node.js installation
echo 2. Tasks not generating: Check logs for errors
echo 3. Progress not updating: Run update-baseline.js
echo 4. High memory usage: Restart the system
echo 5. Configuration errors: Reset to defaults
echo.
echo For detailed troubleshooting, see docs/management-strategy-analysis.md
echo.
pause
goto help_docs

:config_guide
echo [INFO] Configuration Guide:
echo.
echo Configuration file: config/auto-progress.json
echo.
echo Key Settings:
echo - monitoring.interval: Check interval in milliseconds
echo - monitoring.maxTasksPerDay: Maximum tasks per day
echo - quality.minTaskQuality: Minimum task quality score
echo - versioning.targetVersion: Target version for progress
echo.
echo For detailed configuration, see docs/auto-progress-management-guide.md
echo.
pause
goto help_docs

:api_reference
echo [INFO] API Reference:
echo.
echo Available Scripts:
echo - manager-centric-system.js: Core automation system
echo - auto-todo-generator.js: Task generation
echo - auto-progress-tracker.js: Progress tracking
echo - work-completion-hook.js: Work completion detection
echo - update-baseline.js: Progress baseline updates
echo.
echo For detailed API reference, see docs/api-documentation.md
echo.
pause
goto help_docs

:invalid_choice
echo [ERROR] Invalid choice. Please try again.
pause
goto main_menu

:exit
echo.
echo ========================================
echo    Thank you for using Auto-Progress
echo    Management System!
echo ========================================
echo.
echo [INFO] System is still running in the background
echo [INFO] Use stop-auto-progress.bat to stop the system
echo.
pause
exit

:main_menu
goto main_menu
