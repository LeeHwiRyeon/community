@echo off
echo 🚀 스마트 오너 요청 처리 시스템
echo ================================
echo.

if "%~1"=="" (
    echo ❌ 요청 내용을 입력해주세요.
    echo.
    echo 사용법: smart-request.bat "요청 내용"
    echo 예시: smart-request.bat "버그 수정해줘"
    echo.
    echo 🎯 고급 기능:
    echo   - 중복 요청 자동 감지 및 병합
    echo   - 관련 작업 자동 그룹화
    echo   - 작업자 대기열 관리
    echo   - 의존성 관리
    echo.
    pause
    exit /b 1
)

echo 📥 스마트 요청 처리 중...
cmd /c "node integrated-owner-request.js %~1"

echo.
echo ✅ 처리 완료!
