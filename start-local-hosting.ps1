# TheNewsPaper 로컬 호스팅 시작
Write-Host "🚀 TheNewsPaper 로컬 호스팅 시작..." -ForegroundColor Green

# 로그 디렉토리 생성
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs"
}

# PM2로 서비스 시작
Write-Host "📦 PM2로 서비스 시작..." -ForegroundColor Yellow
pm2 start ecosystem.config.js

# 상태 확인
Write-Host "📊 서비스 상태 확인..." -ForegroundColor Yellow
pm2 status

Write-Host "✅ TheNewsPaper 로컬 호스팅 완료!" -ForegroundColor Green
Write-Host "🌐 프론트엔드: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 백엔드 API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "📊 PM2 모니터링: pm2 monit" -ForegroundColor Cyan
Write-Host "🛑 서비스 중지: pm2 stop all" -ForegroundColor Cyan

Read-Host "Press Enter to continue"