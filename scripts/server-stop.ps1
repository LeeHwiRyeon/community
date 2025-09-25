# Community Server Stop PowerShell Script
# 용도: 커뮤니티 서버 프로세스 종료
# 사용법: .\server-stop.ps1 [-Ports 포트번호들] [-All]

param(
    [int[]]$Ports = @(),
    [switch]$All,
    [switch]$Verbose
)

$DefaultBackendPort = 50000
$DefaultFrontendPort = 5000

# 포트 결정
if ($All) {
    # 모든 Node.js 프로세스 종료
    $TargetPorts = @()
    $ProcessName = "node"
} elseif ($Ports.Count -eq 0) {
    # 기본 포트들
    $TargetPorts = @($DefaultBackendPort, $DefaultFrontendPort)
} else {
    # 사용자 지정 포트들
    $TargetPorts = $Ports
}

Write-Host "===============================" -ForegroundColor Cyan
Write-Host "Community Server Stop" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

if ($All) {
    Write-Host "모든 Node.js 프로세스를 종료합니다..." -ForegroundColor Yellow
    
    try {
        $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($nodeProcesses) {
            foreach ($process in $nodeProcesses) {
                Write-Host "[INFO] Node.js 프로세스 종료 중 (PID: $($process.Id))..." -ForegroundColor Yellow
                Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                Write-Host "[SUCCESS] PID $($process.Id) 종료 완료" -ForegroundColor Green
            }
        } else {
            Write-Host "[INFO] 실행 중인 Node.js 프로세스가 없습니다" -ForegroundColor Green
        }
    } catch {
        Write-Host "[ERROR] Node.js 프로세스 종료 중 오류: $_" -ForegroundColor Red
    }
} else {
    Write-Host "대상 포트: $($TargetPorts -join ', ')" -ForegroundColor Yellow
    
    foreach ($Port in $TargetPorts) {
        Write-Host "`n[INFO] 포트 $Port 사용 중인 프로세스 확인..." -ForegroundColor Yellow
        
        try {
            $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
            if ($connections) {
                foreach ($connection in $connections) {
                    $processId = $connection.OwningProcess
                    Write-Host "[INFO] 프로세스 발견 (PID: $processId), 종료 중..." -ForegroundColor Yellow
                    
                    try {
                        Stop-Process -Id $processId -Force -ErrorAction Stop
                        Write-Host "[SUCCESS] PID $processId 종료 완료" -ForegroundColor Green
                    } catch {
                        Write-Host "[WARNING] PID $processId 종료 실패: $_" -ForegroundColor Red
                    }
                }
                
                # 포트 해제 확인
                Start-Sleep -Seconds 1
                $stillUsed = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
                if (-not $stillUsed) {
                    Write-Host "[SUCCESS] 포트 $Port 해제 완료" -ForegroundColor Green
                } else {
                    Write-Host "[WARNING] 포트 $Port 여전히 사용 중" -ForegroundColor Red
                }
            } else {
                Write-Host "[INFO] 포트 $Port 사용 중인 프로세스 없음" -ForegroundColor Green
            }
        } catch {
            Write-Host "[WARNING] 포트 $Port 확인 중 오류: $_" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n===============================" -ForegroundColor Cyan
Write-Host "서버 종료 작업 완료" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

if (-not $All -and $TargetPorts.Count -gt 0) {
    Write-Host "`n현재 포트 상태 확인:" -ForegroundColor Yellow
    foreach ($Port in $TargetPorts) {
        $stillUsed = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($stillUsed) {
            Write-Host "  포트 $Port : 사용 중" -ForegroundColor Red
        } else {
            Write-Host "  포트 $Port : 사용 가능" -ForegroundColor Green
        }
    }
}

Read-Host "`nPress Enter to exit"