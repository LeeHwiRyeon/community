# Simple Workflow Script for Community Platform
# 간단한 워크플로우 스크립트 - Community Platform v1.2

param(
    [string]$Action = "help"
)

Write-Host "🚀 Simple Workflow Script v1.2" -ForegroundColor Green
Write-Host "📅 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan

function Show-Help {
    Write-Host "`n📋 사용 가능한 명령어:" -ForegroundColor Yellow
    Write-Host "  start     - 서버들 시작" -ForegroundColor White
    Write-Host "  stop      - 서버들 중지" -ForegroundColor White
    Write-Host "  status    - 서버 상태 확인" -ForegroundColor White
    Write-Host "  build     - 프로덕션 빌드" -ForegroundColor White
    Write-Host "  clean     - 캐시 정리" -ForegroundColor White
    Write-Host "  commit    - 변경사항 커밋" -ForegroundColor White
    Write-Host "  help      - 도움말 표시" -ForegroundColor White
    Write-Host "`n💡 사용법: .\simple-workflow.ps1 -Action start" -ForegroundColor Cyan
}

function Start-Servers {
    Write-Host "`n🚀 서버들 시작 중..." -ForegroundColor Green
    
    # 백엔드 서버 시작
    Write-Host "1️⃣ 백엔드 서버 시작..." -ForegroundColor Cyan
    Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd server-backend; `$env:PORT = '3001'; node src/index.js" -WindowStyle Minimized
    
    Start-Sleep -Seconds 3
    
    # 프론트엔드 서버 시작
    Write-Host "2️⃣ 프론트엔드 서버 시작..." -ForegroundColor Cyan
    Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd frontend; npm run dev" -WindowStyle Minimized
    
    Write-Host "✅ 서버들 시작 완료!" -ForegroundColor Green
    Write-Host "📊 백엔드: http://localhost:3001" -ForegroundColor Yellow
    Write-Host "📊 프론트엔드: http://localhost:3000" -ForegroundColor Yellow
}

function Stop-Servers {
    Write-Host "`n🛑 서버들 중지 중..." -ForegroundColor Red
    
    # Node.js 프로세스 중지
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    Write-Host "✅ 서버들 중지 완료!" -ForegroundColor Green
}

function Show-Status {
    Write-Host "`n📊 서버 상태 확인..." -ForegroundColor Cyan
    
    # 포트 확인
    $ports = @(3000, 3001)
    foreach ($port in $ports) {
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connection) {
            Write-Host "✅ 포트 $port : 활성" -ForegroundColor Green
        } else {
            Write-Host "❌ 포트 $port : 비활성" -ForegroundColor Red
        }
    }
    
    # 프로세스 확인
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "✅ Node.js 프로세스: $($nodeProcesses.Count)개 실행 중" -ForegroundColor Green
    } else {
        Write-Host "❌ Node.js 프로세스: 실행 중이 아님" -ForegroundColor Red
    }
}

function Build-Project {
    Write-Host "`n🔨 프로덕션 빌드 시작..." -ForegroundColor Yellow
    
    # 프론트엔드 빌드
    Write-Host "📦 프론트엔드 빌드..." -ForegroundColor Cyan
    Set-Location frontend
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 프론트엔드 빌드 완료!" -ForegroundColor Green
    } else {
        Write-Host "❌ 프론트엔드 빌드 실패!" -ForegroundColor Red
        return
    }
    
    Set-Location ..
    Write-Host "🎉 프로덕션 빌드 완료!" -ForegroundColor Green
}

function Clean-Project {
    Write-Host "`n🧹 프로젝트 정리..." -ForegroundColor Yellow
    
    # 캐시 정리
    Write-Host "🗑️ 캐시 정리..." -ForegroundColor Cyan
    if (Test-Path "frontend/.vite") { Remove-Item "frontend/.vite" -Recurse -Force }
    if (Test-Path "frontend/node_modules/.vite") { Remove-Item "frontend/node_modules/.vite" -Recurse -Force }
    
    # 로그 정리
    Write-Host "📝 로그 정리..." -ForegroundColor Cyan
    if (Test-Path "logs") { Remove-Item "logs/*.log" -Force }
    if (Test-Path "*.log") { Remove-Item "*.log" -Force }
    
    Write-Host "✅ 프로젝트 정리 완료!" -ForegroundColor Green
}

function Commit-Changes {
    Write-Host "`n📝 변경사항 커밋..." -ForegroundColor Yellow
    
    # Git 상태 확인
    $gitStatus = git status --porcelain
    if (-not $gitStatus) {
        Write-Host "ℹ️ 커밋할 변경사항이 없습니다." -ForegroundColor Cyan
        return
    }
    
    # 변경사항 표시
    Write-Host "📋 변경된 파일들:" -ForegroundColor Cyan
    git status --short
    
    # 커밋 실행
    git add .
    git commit -m "feat: UIUX V2 워크플로우 개선 및 agents 문서 이그노어 처리

- Simple workflow script 추가
- .gitignore에 agents 문서 패턴 추가
- 서버 시작/중지/상태확인 기능 개선
- 프로덕션 빌드 및 정리 기능 추가

Community Platform v1.2 UIUX V2 완성"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 커밋 완료!" -ForegroundColor Green
    } else {
        Write-Host "❌ 커밋 실패!" -ForegroundColor Red
    }
}

# 메인 실행 로직
switch ($Action.ToLower()) {
    "start" { Start-Servers }
    "stop" { Stop-Servers }
    "status" { Show-Status }
    "build" { Build-Project }
    "clean" { Clean-Project }
    "commit" { Commit-Changes }
    "help" { Show-Help }
    default { 
        Write-Host "❌ 알 수 없는 명령어: $Action" -ForegroundColor Red
        Show-Help 
    }
}

Write-Host "`n🎉 Simple Workflow Script 완료!" -ForegroundColor Green
