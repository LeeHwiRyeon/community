@echo off
echo 🚀 빠른 Task 요청 시스템
echo ========================
echo.

if "%~1"=="" (
    echo ❌ Task 내용을 입력해주세요.
    echo.
    echo 사용법: task-request.bat "요청 내용" [우선순위] [카테고리]
    echo 예시: task-request.bat "로그인 테스트 케이스 작성" high testing
    echo.
    echo 우선순위: urgent, high, medium, low (기본값: medium)
    echo 카테고리: testing, bug-fix, feature, ui, database, api, general (기본값: general)
    echo.
    exit /b 1
)

echo 📥 Task 요청 처리 중...
node quick-task-client.js %*

echo.
echo ✅ 처리 완료!
