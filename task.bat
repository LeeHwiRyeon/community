@echo off
REM 빠른 Task 생성 배치 스크립트
REM 사용법: task.bat "작업 요청"

if "%~1"=="" (
    echo 🎯 빠른 Task 생성기
    echo ==================
    echo.
    echo 💡 사용법:
    echo   task.bat "작업 요청"
    echo.
    echo 📝 예시:
    echo   task.bat "로그인 버그 수정해줘"
    echo   task.bat "새로운 사용자 관리 기능 추가"
    echo   task.bat "성능 최적화 필요해"
    echo   task.bat "긴급하게 보안 패치 적용해줘"
    echo.
    pause
    exit /b 1
)

echo 🚀 Task 생성 중...
node quick-task.js "%*"
