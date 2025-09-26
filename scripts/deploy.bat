@echo off
REM Docker 배포 관리 배치 스크립트
REM 사용법: deploy.bat [build|up|down|restart|logs|status|deploy] [-prod] [-tag TAG]

setlocal enabledelayedexpansion

set ACTION=status
set COMPOSE_FILE=docker-compose.yml
set TAG=latest
set PRODUCTION=false

REM 파라미터 파싱
:parse_args
if "%1"=="" goto :end_parse
if "%1"=="build" set ACTION=build
if "%1"=="up" set ACTION=up
if "%1"=="down" set ACTION=down
if "%1"=="restart" set ACTION=restart
if "%1"=="logs" set ACTION=logs
if "%1"=="status" set ACTION=status
if "%1"=="deploy" set ACTION=deploy
if "%1"=="-prod" set PRODUCTION=true
if "%1"=="-tag" (
    shift
    set TAG=%1
)
shift
goto :parse_args
:end_parse

if "%PRODUCTION%"=="true" set COMPOSE_FILE=docker-compose.prod.yml

echo [%date% %time%] Starting Docker deployment action: %ACTION%

if "%ACTION%"=="build" goto :build
if "%ACTION%"=="up" goto :up
if "%ACTION%"=="down" goto :down
if "%ACTION%"=="restart" goto :restart
if "%ACTION%"=="logs" goto :logs
if "%ACTION%"=="status" goto :status
if "%ACTION%"=="deploy" goto :deploy

echo ERROR: Invalid action. Use: build, up, down, restart, logs, status, deploy
exit /b 1

:build
echo [%date% %time%] Building Docker images...
docker-compose -f %COMPOSE_FILE% build --no-cache
if errorlevel 1 (
    echo [%date% %time%] ERROR: Build failed
    exit /b 1
)
echo [%date% %time%] Build completed successfully
goto :eof

:up
echo [%date% %time%] Starting services...
docker-compose -f %COMPOSE_FILE% up -d
if errorlevel 1 (
    echo [%date% %time%] ERROR: Failed to start services
    exit /b 1
)
echo [%date% %time%] Services started successfully
echo [%date% %time%] Waiting for services to be healthy...
timeout /t 10 /nobreak >nul
docker-compose -f %COMPOSE_FILE% ps
goto :eof

:down
echo [%date% %time%] Stopping services...
docker-compose -f %COMPOSE_FILE% down
if errorlevel 1 (
    echo [%date% %time%] ERROR: Failed to stop services
    exit /b 1
)
echo [%date% %time%] Services stopped successfully
goto :eof

:restart
echo [%date% %time%] Restarting services...
docker-compose -f %COMPOSE_FILE% restart
if errorlevel 1 (
    echo [%date% %time%] ERROR: Failed to restart services
    exit /b 1
)
echo [%date% %time%] Services restarted successfully
goto :eof

:logs
echo [%date% %time%] Showing service logs...
docker-compose -f %COMPOSE_FILE% logs -f --tail=100
goto :eof

:status
echo [%date% %time%] Service status:
docker-compose -f %COMPOSE_FILE% ps
echo.
echo [%date% %time%] Container health:
docker-compose -f %COMPOSE_FILE% exec backend curl -f http://localhost:50000/api/health >nul 2>&1
if errorlevel 1 (
    echo [%date% %time%] ERROR: Backend: Unhealthy
) else (
    echo [%date% %time%] Backend: Healthy
)
goto :eof

:deploy
echo [%date% %time%] Starting full deployment process...

REM 기존 서비스 중지
echo [%date% %time%] Stopping existing services...
docker-compose -f %COMPOSE_FILE% down

REM 이미지 빌드
echo [%date% %time%] Building new images...
docker-compose -f %COMPOSE_FILE% build --no-cache
if errorlevel 1 (
    echo [%date% %time%] ERROR: Build failed, aborting deployment
    exit /b 1
)

REM 서비스 시작
echo [%date% %time%] Starting new services...
docker-compose -f %COMPOSE_FILE% up -d
if errorlevel 1 (
    echo [%date% %time%] ERROR: Deployment failed
    exit /b 1
)

REM 헬스체크
echo [%date% %time%] Waiting for services to be healthy...
timeout /t 30 /nobreak >nul

echo [%date% %time%] Checking service health...
docker-compose -f %COMPOSE_FILE% exec -T backend curl -f http://localhost:50000/api/health >nul 2>&1
if errorlevel 1 (
    echo [%date% %time%] ERROR: Deployment failed - services are not healthy
    docker-compose -f %COMPOSE_FILE% logs
    exit /b 1
) else (
    echo [%date% %time%] SUCCESS: Deployment completed successfully^^!
    echo [%date% %time%] Frontend: http://localhost:3000
    echo [%date% %time%] Backend API: http://localhost:50000
)
goto :eof