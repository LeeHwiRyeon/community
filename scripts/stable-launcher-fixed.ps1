# Community Hub 안정적인 런처 스크립트 (수정된 버전)
# 매니저님을 위한 완벽한 서버 시작 도구

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("start", "stop", "restart", "status", "logs")]
    [string]$Action = "start",
    
    [Parameter(Mandatory = $false)]
    [switch]$Force,
    
    [Parameter(Mandatory = $false)]
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# 색상 함수
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor $Color
}

# 프로세스 정리 함수
function Stop-AllNodeProcesses {
    Write-ColorOutput "🧹 기존 Node.js 프로세스 정리 중..." "Yellow"
    try {
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcesses) {
            $nodeProcesses | Stop-Process -Force
            Start-Sleep -Seconds 2
            Write-ColorOutput "✅ Node.js 프로세스 정리 완료" "Green"
        }
        else {
            Write-ColorOutput "ℹ️  실행 중인 Node.js 프로세스 없음" "Cyan"
        }
    }
    catch {
        Write-ColorOutput "⚠️  프로세스 정리 중 오류: $($_.Exception.Message)" "Red"
    }
}

# 포트 확인 함수
function Test-Port {
    param([int]$Port)
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return $connection -ne $null
    }
    catch {
        return $false
    }
}

# 서버 헬스체크 함수
function Test-ServerHealth {
    param([string]$Url, [string]$Name)
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 5 -ErrorAction Stop
        return $response.StatusCode -eq 200
    }
    catch {
        if ($Verbose) {
            Write-ColorOutput "⚠️  $Name 헬스체크 실패: $($_.Exception.Message)" "Red"
        }
        return $false
    }
}

# 백엔드 시작 함수
function Start-Backend {
    Write-ColorOutput "🚀 백엔드 서버 시작 중..." "Cyan"
    
    # 환경변수 설정
    $env:USE_MOCK_DB = "1"
    $env:ENV_ALLOW_MOCK = "1"
    $env:NODE_ENV = "development"
    $env:PORT = "3001"
    
    # 백엔드 디렉토리로 이동
    Push-Location "server-backend"
    
    try {
        # 백그라운드에서 서버 시작
        $backendJob = Start-Job -ScriptBlock {
            Set-Location $using:PWD
            node src/index.js
        }
        
        # 서버 시작 대기
        Write-ColorOutput "⏳ 백엔드 서버 시작 대기 중..." "Yellow"
        $maxWait = 30
        $waited = 0
        
        while ($waited -lt $maxWait) {
            if (Test-ServerHealth "http://localhost:3001/api/health" "백엔드") {
                Write-ColorOutput "✅ 백엔드 서버 시작 완료 (포트 3001)" "Green"
                return $backendJob
            }
            Start-Sleep -Seconds 1
            $waited++
        }
        
        Write-ColorOutput "❌ 백엔드 서버 시작 실패 (30초 타임아웃)" "Red"
        Stop-Job $backendJob -ErrorAction SilentlyContinue
        Remove-Job $backendJob -ErrorAction SilentlyContinue
        return $null
        
    }
    finally {
        Pop-Location
    }
}

# 프론트엔드 시작 함수
function Start-Frontend {
    Write-ColorOutput "🎨 프론트엔드 서버 시작 중..." "Cyan"
    
    # 프론트엔드 디렉토리로 이동
    Push-Location "frontend"
    
    try {
        # 백그라운드에서 서버 시작
        $frontendJob = Start-Job -ScriptBlock {
            Set-Location $using:PWD
            npm run dev
        }
        
        # 서버 시작 대기
        Write-ColorOutput "⏳ 프론트엔드 서버 시작 대기 중..." "Yellow"
        $maxWait = 30
        $waited = 0
        
        while ($waited -lt $maxWait) {
            if (Test-ServerHealth "http://localhost:3000" "프론트엔드") {
                Write-ColorOutput "✅ 프론트엔드 서버 시작 완료 (포트 3000)" "Green"
                return $frontendJob
            }
            Start-Sleep -Seconds 1
            $waited++
        }
        
        Write-ColorOutput "❌ 프론트엔드 서버 시작 실패 (30초 타임아웃)" "Red"
        Stop-Job $frontendJob -ErrorAction SilentlyContinue
        Remove-Job $frontendJob -ErrorAction SilentlyContinue
        return $null
        
    }
    finally {
        Pop-Location
    }
}

# 서버 상태 확인 함수
function Show-Status {
    Write-ColorOutput "📊 서버 상태 확인 중..." "Cyan"
    
    # 백엔드 상태 확인
    if (Test-ServerHealth "http://localhost:3001/api/health" "백엔드") {
        Write-ColorOutput "✅ 백엔드 서버: 정상 실행 중 (포트 3001)" "Green"
    }
    else {
        Write-ColorOutput "❌ 백엔드 서버: 중지됨" "Red"
    }
    
    # 프론트엔드 상태 확인
    if (Test-ServerHealth "http://localhost:3000" "프론트엔드") {
        Write-ColorOutput "✅ 프론트엔드 서버: 정상 실행 중 (포트 3000)" "Green"
    }
    else {
        Write-ColorOutput "❌ 프론트엔드 서버: 중지됨" "Red"
    }
    
    # 포트 사용 현황
    Write-ColorOutput "`n📋 포트 사용 현황:" "Yellow"
    $ports = @(3000, 3001)
    foreach ($port in $ports) {
        if (Test-Port $port) {
            Write-ColorOutput "  • 포트 $port: 사용 중" "Green"
        }
        else {
            Write-ColorOutput "  • 포트 $port: 사용 가능" "Gray"
        }
    }
}

# 로그 확인 함수
function Show-Logs {
    Write-ColorOutput "📋 서버 로그 확인" "Cyan"
    Write-ColorOutput "================================" "Cyan"
    
    # 백엔드 로그
    if (Test-Path "server-backend/logs") {
        Write-ColorOutput "🔧 백엔드 로그:" "Yellow"
        Get-ChildItem "server-backend/logs" -Name | Select-Object -First 5 | ForEach-Object {
            Write-ColorOutput "  • $_" "White"
        }
    }
    
    # 프론트엔드 로그
    if (Test-Path "frontend/logs") {
        Write-ColorOutput "🎨 프론트엔드 로그:" "Yellow"
        Get-ChildItem "frontend/logs" -Name | Select-Object -First 5 | ForEach-Object {
            Write-ColorOutput "  • $_" "White"
        }
    }
}

# 메인 실행 로직
switch ($Action) {
    "start" {
        Write-ColorOutput "🚀 Community Hub 서버 시작" "Green"
        Write-ColorOutput "================================" "Green"
        
        # 기존 프로세스 정리
        Stop-AllNodeProcesses
        
        # 백엔드 시작
        $backendJob = Start-Backend
        if (-not $backendJob) {
            Write-ColorOutput "❌ 백엔드 시작 실패. 종료합니다." "Red"
            exit 1
        }
        
        # 프론트엔드 시작
        $frontendJob = Start-Frontend
        if (-not $frontendJob) {
            Write-ColorOutput "❌ 프론트엔드 시작 실패. 백엔드는 계속 실행됩니다." "Red"
        }
        
        # 상태 확인
        Start-Sleep -Seconds 2
        Show-Status
        
        # 브라우저 열기
        if ($backendJob -and $frontendJob) {
            Write-ColorOutput "`n🌐 브라우저에서 애플리케이션을 열고 있습니다..." "Cyan"
            Start-Process "http://localhost:3000"
        }
        
        Write-ColorOutput "`n💡 서버를 중지하려면: .\scripts\stable-launcher-fixed.ps1 -Action stop" "Yellow"
    }
    
    "stop" {
        Write-ColorOutput "🛑 Community Hub 서버 중지" "Red"
        Write-ColorOutput "================================" "Red"
        
        Stop-AllNodeProcesses
        
        # Job 정리
        Get-Job | Where-Object { $_.State -eq "Running" } | Stop-Job
        Get-Job | Remove-Job
        
        Write-ColorOutput "✅ 모든 서버가 중지되었습니다." "Green"
    }
    
    "restart" {
        Write-ColorOutput "🔄 Community Hub 서버 재시작" "Yellow"
        Write-ColorOutput "================================" "Yellow"
        
        & $MyInvocation.MyCommand.Path -Action stop
        Start-Sleep -Seconds 3
        & $MyInvocation.MyCommand.Path -Action start
    }
    
    "status" {
        Show-Status
    }
    
    "logs" {
        Show-Logs
    }
}

Write-ColorOutput "`n🎉 작업 완료!" "Green"
