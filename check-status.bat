@echo off
REM Auto-Progress Status Check Script
REM This script checks the status of the auto-progress system

echo ========================================
echo    Auto-Progress System Status
echo ========================================
echo.

REM Set up environment
set PROJECT_DIR=%~dp0
cd /d "%PROJECT_DIR%"

echo [INFO] Checking Auto-Progress System Status...
echo.

REM Check if service is running
echo [CHECK] Service Process Status:
tasklist /fi "imagename eq node.exe" /fo table | findstr "node.exe" >nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Node.js processes are running
    tasklist /fi "imagename eq node.exe" /fo table
) else (
    echo [WARNING] No Node.js processes found
)
echo.

REM Check log files
echo [CHECK] Log Files:
if exist "logs\auto-progress-service-*.log" (
    echo [SUCCESS] Service log files found
    for %%f in (logs\auto-progress-service-*.log) do (
        echo [INFO] Latest entries from %%~nxf:
        type "%%f" | findstr /C:"[INFO]"
        echo.
    )
) else (
    echo [WARNING] No service log files found
)
echo.

REM Check configuration
echo [CHECK] Configuration Files:
if exist "config\auto-progress.json" (
    echo [SUCCESS] Configuration file exists
    echo [INFO] Configuration content:
    type "config\auto-progress.json"
    echo.
) else (
    echo [WARNING] Configuration file not found
)
echo.

REM Check data files
echo [CHECK] Data Files:
if exist "data\progress-baseline.json" (
    echo [SUCCESS] Progress baseline exists
    echo [INFO] Current progress:
    type "data\progress-baseline.json" | findstr "progress"
    echo.
) else (
    echo [WARNING] Progress baseline not found
)
echo.

REM Check generated tasks
echo [CHECK] Generated Tasks:
if exist "docs\todo-backlog-en.md" (
    echo [INFO] Checking for auto-generated tasks...
    findstr /C:"🤖 자동 생성된 TODO" "docs\todo-backlog-en.md" >nul
    if %errorlevel% equ 0 (
        echo [SUCCESS] Auto-generated tasks found
        echo [INFO] Recent auto-generated tasks:
        findstr /C:"🤖 자동 생성된 TODO" "docs\todo-backlog-en.md"
    ) else (
        echo [INFO] No auto-generated tasks yet
    )
) else (
    echo [WARNING] TODO backlog file not found
)
echo.

REM Check system health
echo [CHECK] System Health:
echo [INFO] Disk space:
dir /-c | findstr "bytes free"
echo.
echo [INFO] Memory usage:
wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value | findstr "="
echo.

REM Check Windows Task Scheduler
echo [CHECK] Windows Task Scheduler:
schtasks /query /tn "Community Auto-Progress" >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Task Scheduler entry exists
    echo [INFO] Task status:
    schtasks /query /tn "Community Auto-Progress" /fo list | findstr "Status"
) else (
    echo [WARNING] Task Scheduler entry not found
)
echo.

REM Overall status
echo ========================================
echo    Overall Status Summary
echo ========================================
echo.

set ERROR_COUNT=0

if not exist "config\auto-progress.json" set /a ERROR_COUNT+=1
if not exist "data\progress-baseline.json" set /a ERROR_COUNT+=1
if not exist "logs\" set /a ERROR_COUNT+=1

if %ERROR_COUNT% equ 0 (
    echo [SUCCESS] Auto-Progress System is properly configured
    echo [INFO] All required files and directories exist
    echo [INFO] System is ready for operation
) else (
    echo [WARNING] Auto-Progress System has %ERROR_COUNT% configuration issues
    echo [INFO] Run setup-auto-progress.bat to fix issues
)

echo.
echo [INFO] To start the system: start-auto-progress.bat
echo [INFO] To stop the system: stop-auto-progress.bat
echo [INFO] To check status again: check-status.bat
echo.

pause