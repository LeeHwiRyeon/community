# 통합 개발 환경 관리 스크립트
# Community 프로젝트의 개발 서버 시작/중지/모니터링을 통합 관리

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("start", "stop", "status", "restart", "logs")]
    [string]$Action = "start",

    [Parameter(Mandatory = $false)]
    [switch]$VerboseLogging,

    [Parameter(Mandatory = $false)]
    [int]$Timeout = 30
)

# 설정
$BackendPort = 50000
$FrontendPort = 5002
$PlaywrightPort = 9323
$LogDir = Join-Path $PSScriptRoot "..\logs"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# 로깅 함수
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $LogMessage = "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] [$Level] $Message"
    Write-Host $LogMessage -ForegroundColor $(if ($Level -eq "ERROR") { "Red" } elseif ($Level -eq "WARN") { "Yellow" } else { "Green" })

    if ($VerboseLogging) {
        $LogFile = Join-Path $LogDir "dev-env-$Timestamp.log"
        $LogMessage | Out-File -FilePath $LogFile -Append -Encoding UTF8
    }
}

# 프로세스 정리 함수
function Stop-Processes {
    param([int[]]$Ports, [string[]]$ProcessNames)

    Write-Log "Stopping existing processes..."

    # 포트별 프로세스 종료
    foreach ($port in $Ports) {
        try {
            $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            foreach ($conn in $connections) {
                if ($conn.OwningProcess) {
                    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
                    Write-Log "Stopped process $($conn.OwningProcess) on port $port"
                }
            }
        }
        catch {
            Write-Log "Error stopping processes on port $port`: $($_.Exception.Message)" "WARN"
        }
    }

    # 프로세스 이름별 종료
    foreach ($processName in $ProcessNames) {
        try {
            $processes = Get-Process -Name $processName -ErrorAction SilentlyContinue
            foreach ($process in $processes) {
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                Write-Log "Stopped $processName process (PID: $($process.Id))"
            }
        }
        catch {
            Write-Log "Error stopping $processName processes`: $($_.Exception.Message)" "WARN"
        }
    }

    # PowerShell Jobs 정리
    Get-Job | Remove-Job -Force -ErrorAction SilentlyContinue
}

# 헬스체크 함수
function Test-Health {
    param([string]$Url, [string]$ServiceName)

    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Log "$ServiceName is healthy" "INFO"
            return $true
        }
    }
    catch {
        Write-Log "$ServiceName is not responding`: $($_.Exception.Message)" "WARN"
    }
    return $false
}

# 서버 시작 함수
function Start-Servers {
    Write-Log "Starting Community development servers..."

    # 기존 프로세스 정리
    Stop-Processes -Ports @($BackendPort, $FrontendPort, $PlaywrightPort) -ProcessNames @("node", "npm", "dotnet")

    # 백엔드 서버 시작
    Write-Log "Starting backend server..."
    $backendJob = Start-Job -ScriptBlock {
        param($Path)
        Set-Location $Path
        node mock-server.js
    } -ArgumentList (Join-Path $PSScriptRoot "..\server-backend") -Name "BackendServer"

    # 프론트엔드 서버 시작
    Write-Log "Starting frontend server..."
    $frontendJob = Start-Job -ScriptBlock {
        param($Path)
        Set-Location $Path
        npm run dev
    } -ArgumentList (Join-Path $PSScriptRoot "..\frontend") -Name "FrontendServer"

    # 서버 시작 대기
    Write-Log "Waiting for servers to start..."
    $startTime = Get-Date
    $backendHealthy = $false
    $frontendHealthy = $false

    while (((Get-Date) - $startTime).TotalSeconds -lt $Timeout) {
        if (-not $backendHealthy) {
            $backendHealthy = Test-Health "http://localhost:$BackendPort/api/health" "Backend"
        }

        if (-not $frontendHealthy) {
            $frontendHealthy = Test-Health "http://localhost:$FrontendPort" "Frontend"
        }

        if ($backendHealthy -and $frontendHealthy) {
            break
        }

        Start-Sleep -Seconds 2
    }

    # 결과 출력
    Write-Log ""
    Write-Log "=== Server Status ==="
    Write-Log "Backend (Port $BackendPort): $(if ($backendHealthy) { "✅ Running" } else { "❌ Not responding" })"
    Write-Log "Frontend (Port $FrontendPort): $(if ($frontendHealthy) { "✅ Running" } else { "❌ Not responding" })"
    Write-Log ""
    Write-Log "Access URLs:"
    Write-Log "  Backend API: http://localhost:$BackendPort"
    Write-Log "  Frontend App: http://localhost:$FrontendPort"

    if (-not ($backendHealthy -and $frontendHealthy)) {
        Write-Log "Some servers failed to start properly. Check the logs for details." "ERROR"
        exit 1
    }
}

# 서버 중지 함수
function Stop-Servers {
    Write-Log "Stopping all development servers..."
    Stop-Processes -Ports @($BackendPort, $FrontendPort, $PlaywrightPort) -ProcessNames @("node", "npm", "dotnet", "chrome", "firefox", "webkit")
    Write-Log "All servers stopped."
}

# 상태 확인 함수
function Get-Status {
    Write-Log "Checking server status..."

    $backendHealthy = Test-Health "http://localhost:$BackendPort/api/health" "Backend"
    $frontendHealthy = Test-Health "http://localhost:$FrontendPort" "Frontend"

    Write-Log ""
    Write-Log "=== Current Status ==="
    Write-Log "Backend (Port $BackendPort): $(if ($backendHealthy) { "✅ Running" } else { "❌ Stopped" })"
    Write-Log "Frontend (Port $FrontendPort): $(if ($frontendHealthy) { "✅ Running" } else { "❌ Stopped" })"

    # 실행 중인 관련 프로세스 표시
    Write-Log ""
    Write-Log "=== Running Processes ==="
    $processes = Get-Process -Name "node", "npm" -ErrorAction SilentlyContinue
    if ($processes) {
        $processes | Format-Table -Property Id, ProcessName, StartTime -AutoSize
    }
    else {
        Write-Log "No related processes found."
    }
}

# 로그 표시 함수
function Show-Logs {
    param([int]$Lines = 20)

    Write-Log "Recent log files:"

    $logFiles = Get-ChildItem -Path $LogDir -Filter "*.log" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 5

    if ($logFiles) {
        foreach ($logFile in $logFiles) {
            Write-Log ""
            Write-Log "=== $($logFile.Name) ==="
            Get-Content $logFile.FullName -Tail $Lines -ErrorAction SilentlyContinue
        }
    }
    else {
        Write-Log "No log files found in $LogDir"
    }
}

# 메인 로직
switch ($Action) {
    "start" {
        Start-Servers
    }
    "stop" {
        Stop-Servers
    }
    "restart" {
        Stop-Servers
        Start-Sleep -Seconds 2
        Start-Servers
    }
    "status" {
        Get-Status
    }
    "logs" {
        Show-Logs
    }
    default {
        Write-Log "Invalid action. Use: start, stop, restart, status, logs" "ERROR"
        exit 1
    }
}