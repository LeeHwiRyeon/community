# Community Server Job Manager
# 용도: 백그라운드로 실행 중인 서버 Job 관리
# 사용법: .\job-manager.ps1 [명령어]

param(
    [ValidateSet("list", "status", "logs", "stop", "stopall", "restart")]
    [string]$Command = "list",
    [int]$JobId,
    [switch]$Help
)

if ($Help) {
    Write-Host "Community Server Job Manager" -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "사용법: .\job-manager.ps1 -Command <명령어> [옵션]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "명령어:" -ForegroundColor Green
    Write-Host "  list     - 실행 중인 Job 목록 (기본값)"
    Write-Host "  status   - Job 상태 상세 정보"
    Write-Host "  logs     - 특정 Job의 로그 출력"
    Write-Host "  stop     - 특정 Job 중지"
    Write-Host "  stopall  - 모든 Job 중지"
    Write-Host "  restart  - Job 재시작"
    Write-Host ""
    Write-Host "옵션:" -ForegroundColor Green
    Write-Host "  -JobId <번호>  - 특정 Job ID 지정"
    Write-Host "  -Help          - 이 도움말 표시"
    Write-Host ""
    Write-Host "예시:" -ForegroundColor Yellow
    Write-Host "  .\job-manager.ps1                      # Job 목록"
    Write-Host "  .\job-manager.ps1 -Command status      # 상태 정보"
    Write-Host "  .\job-manager.ps1 -Command logs -JobId 1   # Job 1 로그"
    Write-Host "  .\job-manager.ps1 -Command stop -JobId 1   # Job 1 중지"
    Write-Host "  .\job-manager.ps1 -Command stopall     # 모든 Job 중지"
    Write-Host ""
    return
}

Write-Host "🔧 Community Server Job Manager" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Job 이름 패턴 (우리 서버 관련 Job들)
$ServerJobPattern = "*backend*", "*frontend*", "*community*"

function Get-CommunityJobs {
    return Get-Job | Where-Object { 
        $jobName = $_.Name
        $ServerJobPattern | ForEach-Object { 
            if ($jobName -like $_) { return $true }
        }
        # 스크립트 블록에서 서버 관련 키워드 찾기
        if ($_.Command -like "*backend*" -or $_.Command -like "*frontend*" -or $_.Command -like "*community*") {
            return $true
        }
        return $false
    }
}

function Format-JobInfo {
    param($Job)
    
    $status = switch ($Job.State) {
        "Running" { "🟢 실행중" }
        "Completed" { "✅ 완료" }
        "Failed" { "❌ 실패" }
        "Stopped" { "⏹️ 중지됨" }
        default { "⚪ $($Job.State)" }
    }
    
    $elapsed = if ($Job.PSBeginTime) {
        $span = (Get-Date) - $Job.PSBeginTime
        "{0:dd}d {0:hh}h {0:mm}m {0:ss}s" -f $span
    } else {
        "알 수 없음"
    }
    
    return [PSCustomObject]@{
        ID = $Job.Id
        Name = $Job.Name
        Status = $status
        Elapsed = $elapsed
        Command = ($Job.Command -split "`n")[0].Substring(0, [Math]::Min(50, $Job.Command.Length)) + "..."
    }
}

switch ($Command) {
    "list" {
        $communityJobs = Get-CommunityJobs
        
        if ($communityJobs.Count -eq 0) {
            Write-Host "실행 중인 Community Server Job이 없습니다." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "백그라운드로 서버를 시작하려면:" -ForegroundColor Cyan
            Write-Host "  .\quick-start.ps1 -Mode background" -ForegroundColor Gray
        } else {
            Write-Host "Community Server Jobs:" -ForegroundColor Green
            Write-Host ""
            
            $communityJobs | ForEach-Object {
                $info = Format-JobInfo $_
                Write-Host "  ID: $($info.ID) | $($info.Status) | 실행시간: $($info.Elapsed)" -ForegroundColor White
                Write-Host "      명령: $($info.Command)" -ForegroundColor Gray
                Write-Host ""
            }
        }
    }
    
    "status" {
        $allJobs = Get-Job
        
        if ($allJobs.Count -eq 0) {
            Write-Host "실행 중인 Job이 없습니다." -ForegroundColor Yellow
        } else {
            Write-Host "모든 PowerShell Jobs:" -ForegroundColor Green
            Write-Host ""
            
            $allJobs | ForEach-Object {
                $info = Format-JobInfo $_
                Write-Host "  ID: $($info.ID) | Name: $($info.Name) | $($info.Status)" -ForegroundColor White
                Write-Host "      실행시간: $($info.Elapsed)" -ForegroundColor Gray
                Write-Host "      명령: $($info.Command)" -ForegroundColor Gray
                Write-Host ""
            }
        }
    }
    
    "logs" {
        if (-not $JobId) {
            Write-Host "Job ID가 필요합니다. 예: -JobId 1" -ForegroundColor Red
            return
        }
        
        $job = Get-Job -Id $JobId -ErrorAction SilentlyContinue
        if (-not $job) {
            Write-Host "Job ID $JobId를 찾을 수 없습니다." -ForegroundColor Red
            return
        }
        
        Write-Host "Job $JobId 로그 출력:" -ForegroundColor Green
        Write-Host "=====================" -ForegroundColor Green
        
        try {
            $output = Receive-Job -Id $JobId -Keep
            if ($output) {
                $output | ForEach-Object { Write-Host $_ }
            } else {
                Write-Host "로그 출력이 없습니다." -ForegroundColor Yellow
            }
        } catch {
            Write-Host "로그를 가져오는 중 오류 발생: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    "stop" {
        if (-not $JobId) {
            Write-Host "Job ID가 필요합니다. 예: -JobId 1" -ForegroundColor Red
            return
        }
        
        $job = Get-Job -Id $JobId -ErrorAction SilentlyContinue
        if (-not $job) {
            Write-Host "Job ID $JobId를 찾을 수 없습니다." -ForegroundColor Red
            return
        }
        
        Write-Host "Job $JobId ($($job.Name)) 중지 중..." -ForegroundColor Yellow
        
        try {
            Stop-Job -Id $JobId
            Remove-Job -Id $JobId
            Write-Host "Job $JobId가 성공적으로 중지되었습니다." -ForegroundColor Green
        } catch {
            Write-Host "Job 중지 중 오류 발생: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    "stopall" {
        $allJobs = Get-Job
        
        if ($allJobs.Count -eq 0) {
            Write-Host "중지할 Job이 없습니다." -ForegroundColor Yellow
        } else {
            Write-Host "모든 Job 중지 중..." -ForegroundColor Yellow
            
            try {
                Get-Job | Stop-Job
                Get-Job | Remove-Job
                Write-Host "모든 Job이 성공적으로 중지되었습니다." -ForegroundColor Green
            } catch {
                Write-Host "Job 중지 중 오류 발생: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
    "restart" {
        Write-Host "Job 재시작 기능은 아직 구현되지 않았습니다." -ForegroundColor Yellow
        Write-Host "대신 다음 단계를 수행하세요:" -ForegroundColor Cyan
        Write-Host "1. .\job-manager.ps1 -Command stopall" -ForegroundColor Gray
        Write-Host "2. .\quick-start.ps1 -Mode background" -ForegroundColor Gray
    }
    
    default {
        Write-Host "알 수 없는 명령어: $Command" -ForegroundColor Red
        Write-Host "사용 가능한 명령어: list, status, logs, stop, stopall, restart" -ForegroundColor Yellow
        Write-Host "도움말: .\job-manager.ps1 -Help" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan