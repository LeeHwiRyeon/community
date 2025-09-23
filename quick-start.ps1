# Community Hub - 전체 시스템 실행 스크립트
param(
    [switch]$NoBrowser
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Community Hub - Full Stack Launcher" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 기존 Node 프로세스 정리
Write-Host "[1/3] Cleaning up existing processes..." -ForegroundColor Green
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 백엔드 실행 (목업 모드)
Write-Host "[2/3] Starting Backend (Mock Server)..." -ForegroundColor Green
Set-Location "server-backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node mock-server.js" -WindowStyle Normal

# 잠시 대기
Start-Sleep -Seconds 3

# 프론트엔드 실행
Write-Host "[3/3] Starting Frontend (React + Vite)..." -ForegroundColor Green
Set-Location "..\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Set-Location ".."

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 🚀 SERVERS STARTING..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Backend:   http://localhost:50000" -ForegroundColor White
Write-Host " Frontend:  http://localhost:5000" -ForegroundColor White
Write-Host " API Help:  http://localhost:50000/api/help" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 브라우저 열기 (옵션)
if (-not $NoBrowser) {
    Write-Host "Opening browser..." -ForegroundColor Green
    Start-Sleep -Seconds 5
    Start-Process "http://localhost:5000"
}

Write-Host "✅ Launch completed!" -ForegroundColor Green
Write-Host ""
Write-Host "To stop servers:" -ForegroundColor Yellow
Write-Host "- Close the PowerShell windows" -ForegroundColor White
Write-Host "- Or run: Get-Process -Name 'node' | Stop-Process -Force" -ForegroundColor White
Write-Host ""