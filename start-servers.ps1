# Community Platform v1.2 서버 시작 스크립트
# 매니저님을 위한 간단한 PowerShell 스크립트

Write-Host "========================================" -ForegroundColor Green
Write-Host "Community Platform v1.2 서버 시작" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 기존 프로세스 정리
Write-Host "[1/3] 기존 프로세스 정리 중..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ 기존 프로세스 정리 완료" -ForegroundColor Green
}
catch {
    Write-Host "ℹ️  실행 중인 프로세스 없음" -ForegroundColor Cyan
}
Write-Host ""

# 백엔드 서버 시작
Write-Host "[2/3] 백엔드 서버 시작 중..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "server-backend"
Set-Location $backendPath
$env:PORT = "3001"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '백엔드 서버 (포트 3001)' -ForegroundColor Cyan; node src/index.js"
Write-Host "✅ 백엔드 서버 시작됨 (포트 3001)" -ForegroundColor Green
Write-Host ""

# 프론트엔드 서버 시작
Write-Host "[3/3] 프론트엔드 서버 시작 중..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"
Set-Location $frontendPath
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '프론트엔드 서버 (포트 3000)' -ForegroundColor Cyan; npm run dev"
Write-Host "✅ 프론트엔드 서버 시작됨 (포트 3000)" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 서버 시작 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 접속 URL:" -ForegroundColor Cyan
Write-Host "  • 프론트엔드: http://localhost:3000" -ForegroundColor White
Write-Host "  • 백엔드 API: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "🎨 UIUX V2 페이지:" -ForegroundColor Yellow
Write-Host "  • UIUX V2: http://localhost:3000/uiux-v2" -ForegroundColor White
Write-Host "  • 성능 대시보드: http://localhost:3000/performance" -ForegroundColor White
Write-Host "  • 접근성 패널: http://localhost:3000/accessibility" -ForegroundColor White
Write-Host ""
Write-Host "💡 서버를 중지하려면 각 창에서 Ctrl+C를 누르세요" -ForegroundColor Red
Write-Host ""
Read-Host "Press Enter to continue..."
