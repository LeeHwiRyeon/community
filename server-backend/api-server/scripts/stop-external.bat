@echo off
echo ========================================
echo   Stopping News Paper VIP Services
echo   External Storage (D:/)
echo ========================================

echo.
echo Stopping Docker services...
docker-compose -f docker-compose.external.yml down

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   Services stopped successfully!
    echo ========================================
    echo.
    echo External data is preserved in:
    echo   - Database: D:\NewsPaperVIP\Database\PostgreSQL\data
    echo   - Logs: D:\NewsPaperVIP\Logs\API\logs
    echo   - Uploads: D:\NewsPaperVIP\Uploads\files
    echo   - Backups: D:\NewsPaperVIP\Backups
    echo.
    echo To start services again, run: start-external.bat
    echo.
) else (
    echo.
    echo WARNING: Some services may not have stopped properly.
    echo You can force stop with: docker-compose -f docker-compose.external.yml down --remove-orphans
    echo.
)

pause
