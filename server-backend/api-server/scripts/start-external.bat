@echo off
echo ========================================
echo   News Paper VIP Management System
echo   External Storage Setup (D:/)
echo ========================================

echo.
echo Checking Docker installation...
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker is not installed or not running!
    echo Please install Docker Desktop and try again.
    pause
    exit /b 1
)

echo Docker is available.

echo.
echo Checking external storage directories...
if not exist "D:\NewsPaperVIP" (
    echo Creating external storage directories...
    mkdir "D:\NewsPaperVIP\Database\PostgreSQL\data" 2>nul
    mkdir "D:\NewsPaperVIP\Database\Redis\data" 2>nul
    mkdir "D:\NewsPaperVIP\Logs\API\logs" 2>nul
    mkdir "D:\NewsPaperVIP\Uploads\files" 2>nul
    mkdir "D:\NewsPaperVIP\Backups" 2>nul
    mkdir "D:\NewsPaperVIP\Scripts" 2>nul
    echo External directories created successfully.
) else (
    echo External directories already exist.
)

echo.
echo Starting external services with Docker Compose...
echo Using external storage: D:\NewsPaperVIP\
echo.

docker-compose -f docker-compose.external.yml up -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Services started successfully!
    echo ========================================
    echo.
    echo Available services:
    echo   - PostgreSQL Database: localhost:5432
    echo   - Redis Cache: localhost:6379
    echo   - API Server: localhost:3001
    echo   - pgAdmin: localhost:5050
    echo.
    echo External storage locations:
    echo   - Database: D:\NewsPaperVIP\Database\PostgreSQL\data
    echo   - Logs: D:\NewsPaperVIP\Logs\API\logs
    echo   - Uploads: D:\NewsPaperVIP\Uploads\files
    echo   - Backups: D:\NewsPaperVIP\Backups
    echo.
    echo Running database migration...
    node scripts/migrate-external.js
    
    echo.
    echo ========================================
    echo   Setup completed successfully!
    echo ========================================
    echo.
    echo You can now access:
    echo   - API Server: http://localhost:3001
    echo   - pgAdmin: http://localhost:5050
    echo     Email: admin@newspaper-vip.com
    echo     Password: admin123!
    echo.
    echo To stop services: docker-compose -f docker-compose.external.yml down
    echo To view logs: docker-compose -f docker-compose.external.yml logs -f
    echo.
) else (
    echo.
    echo ERROR: Failed to start services!
    echo Please check Docker logs for more information.
    echo.
)

pause
