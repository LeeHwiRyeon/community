# 서버 종료 및 리소스 정리
Write-Host "🛑 서버를 종료하고 리소스를 정리합니다..." -ForegroundColor Red

# 작업 정보 읽기
if (Test-Path "server-jobs.json") {
    $jobInfo = Get-Content "server-jobs.json" | ConvertFrom-Json
    Write-Host "📋 저장된 작업 정보를 찾았습니다." -ForegroundColor Yellow
    
    # 백그라운드 작업 종료
    if ($jobInfo.BackendJob) {
        Write-Host "🔧 백엔드 작업 종료 중... (ID: $($jobInfo.BackendJob))" -ForegroundColor Yellow
        Stop-Job -Id $jobInfo.BackendJob -ErrorAction SilentlyContinue
        Remove-Job -Id $jobInfo.BackendJob -ErrorAction SilentlyContinue
    }
    
    if ($jobInfo.FrontendJob) {
        Write-Host "🎨 프론트엔드 작업 종료 중... (ID: $($jobInfo.FrontendJob))" -ForegroundColor Yellow
        Stop-Job -Id $jobInfo.FrontendJob -ErrorAction SilentlyContinue
        Remove-Job -Id $jobInfo.FrontendJob -ErrorAction SilentlyContinue
    }
    
    # 작업 정보 파일 삭제
    Remove-Item "server-jobs.json" -ErrorAction SilentlyContinue
}

# 모든 Node.js 관련 프로세스 종료
Write-Host "🧹 Node.js 프로세스 정리 중..." -ForegroundColor Yellow
Get-Process | Where-Object {
    $_.ProcessName -like "*node*" -or 
    $_.ProcessName -like "*npm*" -or 
    $_.ProcessName -like "*vite*" -or
    $_.ProcessName -like "*chrome*" -and $_.MainWindowTitle -like "*Community*"
} | Stop-Process -Force -ErrorAction SilentlyContinue

# 포트 정리
Write-Host "🔌 포트 정리 중..." -ForegroundColor Yellow
netstat -ano | findstr ":5002\|:50000" | ForEach-Object {
    $pid = ($_ -split '\s+')[-1]
    if ($pid -and $pid -ne "0") {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "   포트 $($_.Split()[1]) 정리됨" -ForegroundColor Green
        } catch {
            Write-Host "   포트 $($_.Split()[1]) 정리 실패" -ForegroundColor Red
        }
    }
}

# 메모리 정리
Write-Host "💾 메모리 정리 중..." -ForegroundColor Yellow
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()
[System.GC]::Collect()

# 임시 파일 정리
Write-Host "🗑️ 임시 파일 정리 중..." -ForegroundColor Yellow
Get-ChildItem -Path "." -Name "*.log" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path "." -Name "*.tmp" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue

Write-Host "✅ 모든 서버가 종료되고 리소스가 정리되었습니다!" -ForegroundColor Green
Write-Host "💡 다시 시작하려면: .\start-optimized.ps1" -ForegroundColor Magenta
