@echo off
chcp 65001 >nul
echo 🚀 Community Cursor Dashboard를 열고 있습니다...

REM 현재 디렉토리 확인
set "currentDir=%~dp0"
set "dashboardPath=%currentDir%community-cursor-dashboard.html"

REM 파일 존재 확인
if exist "%dashboardPath%" (
    echo ✅ 대시보드 파일을 찾았습니다: %dashboardPath%
    
    REM Cursor에서 HTML 파일 열기 시도
    echo 🎯 Cursor에서 대시보드 열기 시도 중...
    cursor "%dashboardPath%" 2>nul
    
    if %errorlevel% equ 0 (
        echo 🎉 Community Cursor Dashboard가 열렸습니다!
        echo.
        echo 📋 사용 가능한 기능:
        echo    • Ctrl+1-6: 섹션 전환
        echo    • Ctrl+R: 데이터 새로고침
        echo    • 🌐 버튼: 커뮤니티 미리보기
        echo    • 자동 새로고침: 5분마다
        echo.
        echo 💡 팁: Cursor의 사이드바에서 HTML 파일을 열어두면 실시간으로 현황을 확인할 수 있습니다!
    ) else (
        echo ⚠️ Cursor에서 파일을 열 수 없습니다. 기본 브라우저로 열기 시도 중...
        start "" "%dashboardPath%"
        echo 🌐 기본 브라우저로 대시보드가 열렸습니다!
    )
) else (
    echo ❌ 대시보드 파일을 찾을 수 없습니다: %dashboardPath%
    echo 현재 디렉토리: %currentDir%
    echo.
    echo 📁 파일 목록:
    dir /b *.html 2>nul
)

echo.
echo 🔄 스크립트 완료
pause
