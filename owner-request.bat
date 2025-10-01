@echo off
echo 🚀 오너 요청 처리 시스템
echo ========================
echo.

if "%~1"=="" (
    echo ❌ 요청 내용을 입력해주세요.
    echo.
    echo 사용법: owner-request.bat "요청 내용"
    echo 예시: owner-request.bat "버그 수정해줘"
    echo.
    pause
    exit /b 1
)

echo 📥 요청 처리 중...
node owner-request-processor.js "%~1"

echo.
echo ✅ 처리 완료!
