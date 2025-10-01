# 성능 최적화된 커뮤니티 서버 시작
Write-Host "🚀 성능 최적화된 커뮤니티 서버를 시작합니다..." -ForegroundColor Green

# 기존 프로세스 정리
Write-Host "🧹 기존 프로세스 정리 중..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -like "*node*" -or $_.ProcessName -like "*npm*" -or $_.ProcessName -like "*vite*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# 포트 정리
Write-Host "🔌 포트 정리 중..." -ForegroundColor Yellow
netstat -ano | findstr ":5002\|:50000" | ForEach-Object {
    $pid = ($_ -split '\s+')[-1]
    if ($pid -and $pid -ne "0") {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 2

# 백엔드 시작 (최소 리소스)
Write-Host "🔧 백엔드 서버 시작 중..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\hwi\Desktop\Projects\community\server-backend"
    $env:NODE_OPTIONS = "--max-old-space-size=512"
    npm run dev
}

# 프론트엔드 시작 (최소 리소스)
Write-Host "🎨 프론트엔드 서버 시작 중..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\hwi\Desktop\Projects\community\frontend"
    $env:NODE_OPTIONS = "--max-old-space-size=256"
    npm run dev
}

# 서버 시작 대기
Write-Host "⏳ 서버 시작 대기 중..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# 서버 상태 확인
Write-Host "🔍 서버 상태 확인 중..." -ForegroundColor Yellow
$backendRunning = $false
$frontendRunning = $false

for ($i = 0; $i -lt 10; $i++) {
    $backendCheck = netstat -an | findstr ":50000"
    $frontendCheck = netstat -an | findstr ":5002"
    
    if ($backendCheck -and !$backendRunning) {
        Write-Host "✅ 백엔드 서버 실행됨 (포트 50000)" -ForegroundColor Green
        $backendRunning = $true
    }
    
    if ($frontendCheck -and !$frontendRunning) {
        Write-Host "✅ 프론트엔드 서버 실행됨 (포트 5002)" -ForegroundColor Green
        $frontendRunning = $true
    }
    
    if ($backendRunning -and $frontendRunning) {
        break
    }
    
    Start-Sleep -Seconds 2
}

if ($backendRunning -and $frontendRunning) {
    Write-Host "🎉 모든 서버가 성공적으로 시작되었습니다!" -ForegroundColor Green
    Write-Host "📱 프론트엔드: http://localhost:5002" -ForegroundColor Cyan
    Write-Host "🔧 백엔드: http://localhost:50000" -ForegroundColor Cyan
    
    # 크롬으로 미리보기 열기
    Write-Host "🌐 크롬으로 미리보기 열기..." -ForegroundColor Magenta
    Start-Sleep -Seconds 2
    .\open-chrome-preview.ps1
}
else {
    Write-Host "❌ 서버 시작에 실패했습니다." -ForegroundColor Red
    Write-Host "백엔드 실행: $backendRunning" -ForegroundColor Yellow
    Write-Host "프론트엔드 실행: $frontendRunning" -ForegroundColor Yellow
}

# 작업 정보 저장
$jobInfo = @{
    BackendJob  = $backendJob.Id
    FrontendJob = $frontendJob.Id
    StartTime   = Get-Date
} | ConvertTo-Json

$jobInfo | Out-File -FilePath "server-jobs.json" -Encoding UTF8

Write-Host "`n💡 서버 종료하려면: .\stop-servers.ps1" -ForegroundColor Magenta
Write-Host "💡 성능 모니터링: .\monitor-performance.ps1" -ForegroundColor Magenta
