# AutoAgent PowerShell 실행 스크립트
Write-Host "🤖 AutoAgent 시작 중..." -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Cyan

# 현재 디렉토리로 이동
Set-Location $PSScriptRoot

# AutoAgent 실행
node auto-agent.js start

Write-Host "`n🛑 AutoAgent가 종료되었습니다." -ForegroundColor Yellow
Read-Host "아무 키나 누르면 종료됩니다"
