@echo off
echo 🚀 CI/CD 리포팅 처리 테스트 스크립트
echo ======================================

cd /d "%~dp0.."

echo 📊 Vitest HTML 리포트 생성 중...
cd frontend
if exist test-report.html del test-report.html
npx vitest run --reporter=html --outputFile=test-report.html

if exist test-report.html (
    echo ✅ HTML 리포트 생성 성공: test-report.html
    echo 📁 파일 크기: 
    for %%A in (test-report.html) do echo    %%~zA bytes
) else (
    echo ❌ HTML 리포트 생성 실패
)

echo.
echo 🔍 JSON 리포트 확인:
if exist test-results.json (
    echo ✅ JSON 리포트 존재: test-results.json
    powershell -Command "Get-Content test-results.json | ConvertFrom-Json | Select-Object -ExpandProperty numTotalTests, numPassedTests, numFailedTests | Format-List"
) else (
    echo ❌ JSON 리포트 없음
)

echo.
echo 📋 CI/CD 아티팩트 시뮬레이션:
echo - HTML 리포트: frontend/test-report.html
echo - JSON 리포트: frontend/test-results.json
echo - 커버리지: frontend/coverage/

echo.
echo 🎯 CI/CD 통합 완료!
echo 이제 GitHub Actions에서 자동으로 리포트가 생성됩니다.