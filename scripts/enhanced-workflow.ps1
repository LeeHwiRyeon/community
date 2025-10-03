# Enhanced Workflow Script for Community Platform
# 워크플로우 개선 스크립트 - Community Platform v1.2

param(
    [string]$Action = "help",
    [switch]$Force = $false,
    [switch]$Verbose = $false
)

# UTF-8 인코딩 설정
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "🚀 Enhanced Workflow Script v1.2" -ForegroundColor Green
Write-Host "📅 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan

function Show-Help {
    Write-Host "`n📋 사용 가능한 명령어:" -ForegroundColor Yellow
    Write-Host "  start     - 서버들 시작 (백엔드 + 프론트엔드)" -ForegroundColor White
    Write-Host "  stop      - 서버들 중지" -ForegroundColor White
    Write-Host "  restart   - 서버들 재시작" -ForegroundColor White
    Write-Host "  status    - 서버 상태 확인" -ForegroundColor White
    Write-Host "  build     - 프로덕션 빌드" -ForegroundColor White
    Write-Host "  test      - 테스트 실행" -ForegroundColor White
    Write-Host "  clean     - 캐시 및 임시 파일 정리" -ForegroundColor White
    Write-Host "  commit    - 변경사항 커밋" -ForegroundColor White
    Write-Host "  deploy    - 배포 준비" -ForegroundColor White
    Write-Host "  help      - 도움말 표시" -ForegroundColor White
    Write-Host "`n💡 사용법: .\enhanced-workflow.ps1 -Action start" -ForegroundColor Cyan
}

function Start-Servers {
    Write-Host "`n🚀 서버들 시작 중..." -ForegroundColor Green
    
    # 백엔드 서버 시작
    Write-Host "1️⃣ 백엔드 서버 시작..." -ForegroundColor Cyan
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        cd server-backend
        $env:PORT = "3001"
        node src/index.js
    }
    
    Start-Sleep -Seconds 3
    
    # 프론트엔드 서버 시작
    Write-Host "2️⃣ 프론트엔드 서버 시작..." -ForegroundColor Cyan
    $frontendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        cd frontend
        npm run dev
    }
    
    Write-Host "✅ 서버들 시작 완료!" -ForegroundColor Green
    Write-Host "📊 백엔드: http://localhost:3001" -ForegroundColor Yellow
    Write-Host "📊 프론트엔드: http://localhost:3000" -ForegroundColor Yellow
    
    return @($backendJob, $frontendJob)
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
            Write-Host "✅ 포트 $port: 활성" -ForegroundColor Green
        } else {
            Write-Host "❌ 포트 $port: 비활성" -ForegroundColor Red
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

function Test-Project {
    Write-Host "`n🧪 테스트 실행..." -ForegroundColor Yellow
    
    # 프론트엔드 테스트
    Write-Host "📋 프론트엔드 테스트..." -ForegroundColor Cyan
    Set-Location frontend
    npm run test:run
    
    Set-Location ..
    
    # 백엔드 테스트
    Write-Host "📋 백엔드 테스트..." -ForegroundColor Cyan
    Set-Location server-backend
    npm test
    
    Set-Location ..
    Write-Host "✅ 테스트 완료!" -ForegroundColor Green
}

function Clean-Project {
    Write-Host "`n🧹 프로젝트 정리..." -ForegroundColor Yellow
    
    # 캐시 정리
    Write-Host "🗑️ 캐시 정리..." -ForegroundColor Cyan
    if (Test-Path "frontend/.vite") { Remove-Item "frontend/.vite" -Recurse -Force }
    if (Test-Path "frontend/node_modules/.vite") { Remove-Item "frontend/node_modules/.vite" -Recurse -Force }
    if (Test-Path "server-backend/node_modules/.cache") { Remove-Item "server-backend/node_modules/.cache" -Recurse -Force }
    
    # 로그 정리
    Write-Host "📝 로그 정리..." -ForegroundColor Cyan
    if (Test-Path "logs") { Remove-Item "logs/*.log" -Force }
    if (Test-Path "*.log") { Remove-Item "*.log" -Force }
    
    # 임시 파일 정리
    Write-Host "🗂️ 임시 파일 정리..." -ForegroundColor Cyan
    if (Test-Path "temp") { Remove-Item "temp" -Recurse -Force }
    if (Test-Path "*.tmp") { Remove-Item "*.tmp" -Force }
    
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
    
    # 커밋 메시지 생성
    $commitMessage = "feat: UIUX V2 워크플로우 개선 및 agents 문서 이그노어 처리

- Enhanced workflow script 추가
- .gitignore에 agents 문서 패턴 추가
- 서버 시작/중지/상태확인 기능 개선
- 프로덕션 빌드 및 테스트 자동화
- 프로젝트 정리 기능 추가

Community Platform v1.2 UIUX V2 완성"
    
    # 커밋 실행
    git add .
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 커밋 완료!" -ForegroundColor Green
    } else {
        Write-Host "❌ 커밋 실패!" -ForegroundColor Red
    }
}

function Deploy-Project {
    Write-Host "`n🚀 배포 준비..." -ForegroundColor Yellow
    
    # 빌드 실행
    Build-Project
    
    # 테스트 실행
    Test-Project
    
    # 배포 파일 확인
    if (Test-Path "frontend/dist") {
        Write-Host "✅ 배포 파일 준비 완료!" -ForegroundColor Green
        Write-Host "📁 배포 디렉토리: frontend/dist" -ForegroundColor Cyan
    } else {
        Write-Host "❌ 배포 파일이 없습니다!" -ForegroundColor Red
    }
}

# 메인 실행 로직
switch ($Action.ToLower()) {
    "start" { Start-Servers }
    "stop" { Stop-Servers }
    "restart" { Stop-Servers; Start-Sleep -Seconds 2; Start-Servers }
    "status" { Show-Status }
    "build" { Build-Project }
    "test" { Test-Project }
    "clean" { Clean-Project }
    "commit" { Commit-Changes }
    "deploy" { Deploy-Project }
    "help" { Show-Help }
    default { 
        Write-Host "❌ 알 수 없는 명령어: $Action" -ForegroundColor Red
        Show-Help 
    }
}

Write-Host "`n🎉 Enhanced Workflow Script 완료!" -ForegroundColor Green
