@echo off
chcp 65001 >nul
setlocal

REM ===== Community Server Stop Script =====
REM 용도: 커뮤니티 서버 프로세스 종료
REM 사용법: server-stop.bat [포트번호]
REM 예시: server-stop.bat 50000

set DEFAULT_BACKEND_PORT=50000
set DEFAULT_FRONTEND_PORT=5500

if "%1"=="" (
    set PORTS=%DEFAULT_BACKEND_PORT% %DEFAULT_FRONTEND_PORT%
    echo [INFO] 기본 포트들을 종료합니다: %DEFAULT_BACKEND_PORT%, %DEFAULT_FRONTEND_PORT%
) else (
    set PORTS=%*
    echo [INFO] 지정된 포트들을 종료합니다: %*
)

echo ===============================
echo Community Server Stop
echo ===============================

for %%p in (%PORTS%) do (
    echo [INFO] 포트 %%p 사용 중인 프로세스 확인...
    
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
    
    REM 포트가 실제로 해제되었는지 다시 확인
    timeout /t 1 >nul
    netstat -ano | findstr :%%p >nul
    if errorlevel 1 (
        echo [SUCCESS] 포트 %%p 해제 완료
    ) else (
        echo [WARNING] 포트 %%p 여전히 사용 중
    )
    echo.
)

echo ===============================
echo 서버 종료 작업 완료
echo ===============================
pause