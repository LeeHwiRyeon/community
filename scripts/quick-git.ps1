# Quick Git Workflow Script
# 빠른 Git 작업을 위한 간단한 스크립트

param(
    [Parameter(Mandatory=$true)]
    [string]$Message,
    [string]$Files = ".",
    [bool]$Push = $false,
    [bool]$Pull = $false,
    [int]$Timeout = 20
)

# 색상 설정
$ErrorColor = "Red"
$SuccessColor = "Green"
$WarningColor = "Yellow"
$InfoColor = "Cyan"

# 로깅 함수
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [string]$Color = $InfoColor
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Write-Host $logMessage -ForegroundColor $Color
}

# 타임아웃이 있는 명령 실행
function Invoke-QuickCommand {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Log "실행: $Description" "INFO" $InfoColor
    
    try {
        $job = Start-Job -ScriptBlock { 
            param($cmd)
            Invoke-Expression $cmd
        } -ArgumentList $Command
        
        $result = Wait-Job -Job $job -Timeout $Timeout
        
        if ($result) {
            $output = Receive-Job -Job $job
            Remove-Job -Job $job
            Write-Log "완료: $Description" "SUCCESS" $SuccessColor
            return $output
        } else {
            Stop-Job -Job $job
            Remove-Job -Job $job
            Write-Log "타임아웃: $Description" "ERROR" $ErrorColor
            return $null
        }
    } catch {
        Write-Log "오류: $Description - $($_.Exception.Message)" "ERROR" $ErrorColor
        return $null
    }
}

# 메인 실행
try {
    Write-Log "=== 빠른 Git 워크플로우 시작 ===" "INFO" $InfoColor
    
    # 1. 상태 확인
    Write-Log "1. 상태 확인" "INFO" $InfoColor
    $status = Invoke-QuickCommand "git status --porcelain" "상태 확인"
    if (-not $status) {
        Write-Log "상태 확인 실패" "ERROR" $ErrorColor
        exit 1
    }
    
    # 2. 파일 추가
    Write-Log "2. 파일 추가" "INFO" $InfoColor
    $addResult = Invoke-QuickCommand "git add $Files" "파일 추가"
    if (-not $addResult) {
        Write-Log "파일 추가 실패" "ERROR" $ErrorColor
        exit 1
    }
    
    # 3. 커밋
    Write-Log "3. 커밋 생성" "INFO" $InfoColor
    $commitResult = Invoke-QuickCommand "git commit -m `"$Message`"" "커밋 생성"
    if (-not $commitResult) {
        Write-Log "커밋 실패" "ERROR" $ErrorColor
        exit 1
    }
    
    # 4. 풀 (선택사항)
    if ($Pull) {
        Write-Log "4. 원격 변경사항 풀" "INFO" $InfoColor
        $pullResult = Invoke-QuickCommand "git pull" "변경사항 풀"
        if (-not $pullResult) {
            Write-Log "풀 실패, 계속 진행" "WARNING" $WarningColor
        }
    }
    
    # 5. 푸시 (선택사항)
    if ($Push) {
        Write-Log "5. 변경사항 푸시" "INFO" $InfoColor
        $pushResult = Invoke-QuickCommand "git push" "변경사항 푸시"
        if (-not $pushResult) {
            Write-Log "푸시 실패" "ERROR" $ErrorColor
            exit 1
        }
    }
    
    Write-Log "=== 빠른 Git 워크플로우 완료 ===" "SUCCESS" $SuccessColor
    
} catch {
    Write-Log "워크플로우 오류: $($_.Exception.Message)" "ERROR" $ErrorColor
    exit 1
}
