# Git Workflow Improved Script
# 커밋 후 멈추는 현상을 방지하는 개선된 Git 워크플로우

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("add", "commit", "push", "status", "pull", "merge", "checkout", "branch", "log", "diff")]
    [string]$Action,
    
    [string]$Message = "",
    [string]$Branch = "",
    [string]$Files = "",
    [int]$Timeout = 30,
    [switch]$Force = $false,
    [switch]$Verbose = $false
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
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    if ($Verbose -or $Level -eq "ERROR" -or $Level -eq "WARNING") {
        Write-Host $logMessage -ForegroundColor $Color
    }
}

# 타임아웃이 있는 명령 실행
function Invoke-CommandWithTimeout {
    param(
        [string]$Command,
        [int]$TimeoutSeconds = 30,
        [string]$Description = ""
    )
    
    Write-Log "실행 중: $Description" "INFO" $InfoColor
    
    try {
        $job = Start-Job -ScriptBlock { 
            param($cmd)
            Invoke-Expression $cmd
        } -ArgumentList $Command
        
        $result = Wait-Job -Job $job -Timeout $TimeoutSeconds
        
        if ($result) {
            $output = Receive-Job -Job $job
            Remove-Job -Job $job
            Write-Log "완료: $Description" "SUCCESS" $SuccessColor
            return $output
        } else {
            Stop-Job -Job $job
            Remove-Job -Job $job
            Write-Log "타임아웃: $Description (${TimeoutSeconds}초)" "ERROR" $ErrorColor
            return $null
        }
    } catch {
        Write-Log "오류: $Description - $($_.Exception.Message)" "ERROR" $ErrorColor
        return $null
    }
}

# Git 상태 확인
function Get-GitStatus {
    Write-Log "Git 상태 확인 중..." "INFO" $InfoColor
    
    $status = Invoke-CommandWithTimeout "git status --porcelain" 10 "Git 상태 확인"
    if ($status) {
        Write-Log "Git 상태 확인 완료" "SUCCESS" $SuccessColor
        return $status
    } else {
        Write-Log "Git 상태 확인 실패" "ERROR" $ErrorColor
        return $null
    }
}

# 파일 추가
function Add-Files {
    param([string]$FilePattern = ".")
    
    Write-Log "파일 추가 중: $FilePattern" "INFO" $InfoColor
    
    if ($FilePattern -eq ".") {
        $command = "git add ."
    } else {
        $command = "git add $FilePattern"
    }
    
    $result = Invoke-CommandWithTimeout $command $Timeout "파일 추가"
    if ($result -ne $null) {
        Write-Log "파일 추가 완료" "SUCCESS" $SuccessColor
        return $true
    } else {
        Write-Log "파일 추가 실패" "ERROR" $ErrorColor
        return $false
    }
}

# 커밋 생성
function New-Commit {
    param([string]$CommitMessage)
    
    if ([string]::IsNullOrEmpty($CommitMessage)) {
        Write-Log "커밋 메시지가 필요합니다" "ERROR" $ErrorColor
        return $false
    }
    
    Write-Log "커밋 생성 중: $CommitMessage" "INFO" $InfoColor
    
    # 커밋 전 상태 확인
    $status = Get-GitStatus
    if (-not $status) {
        Write-Log "Git 상태 확인 실패로 커밋 중단" "ERROR" $ErrorColor
        return $false
    }
    
    # 커밋 실행
    $command = "git commit -m `"$CommitMessage`""
    $result = Invoke-CommandWithTimeout $command $Timeout "커밋 생성"
    
    if ($result -ne $null) {
        Write-Log "커밋 생성 완료" "SUCCESS" $SuccessColor
        return $true
    } else {
        Write-Log "커밋 생성 실패" "ERROR" $ErrorColor
        return $false
    }
}

# 푸시 실행
function Push-Changes {
    param([string]$BranchName = "", [switch]$ForcePush = $false)
    
    Write-Log "변경사항 푸시 중..." "INFO" $InfoColor
    
    $command = "git push"
    if ($BranchName) {
        $command += " origin $BranchName"
    }
    if ($ForcePush) {
        $command += " --force"
    }
    
    $result = Invoke-CommandWithTimeout $command $Timeout "변경사항 푸시"
    if ($result -ne $null) {
        Write-Log "푸시 완료" "SUCCESS" $SuccessColor
        return $true
    } else {
        Write-Log "푸시 실패" "ERROR" $ErrorColor
        return $false
    }
}

# 풀 실행
function Pull-Changes {
    param([string]$BranchName = "")
    
    Write-Log "변경사항 풀 중..." "INFO" $InfoColor
    
    $command = "git pull"
    if ($BranchName) {
        $command += " origin $BranchName"
    }
    
    $result = Invoke-CommandWithTimeout $command $Timeout "변경사항 풀"
    if ($result -ne $null) {
        Write-Log "풀 완료" "SUCCESS" $SuccessColor
        return $true
    } else {
        Write-Log "풀 실패" "ERROR" $ErrorColor
        return $false
    }
}

# 브랜치 전환
function Switch-Branch {
    param([string]$BranchName)
    
    if ([string]::IsNullOrEmpty($BranchName)) {
        Write-Log "브랜치 이름이 필요합니다" "ERROR" $ErrorColor
        return $false
    }
    
    Write-Log "브랜치 전환 중: $BranchName" "INFO" $InfoColor
    
    $command = "git checkout $BranchName"
    $result = Invoke-CommandWithTimeout $command $Timeout "브랜치 전환"
    
    if ($result -ne $null) {
        Write-Log "브랜치 전환 완료" "SUCCESS" $SuccessColor
        return $true
    } else {
        Write-Log "브랜치 전환 실패" "ERROR" $ErrorColor
        return $false
    }
}

# 브랜치 생성
function New-Branch {
    param([string]$BranchName)
    
    if ([string]::IsNullOrEmpty($BranchName)) {
        Write-Log "브랜치 이름이 필요합니다" "ERROR" $ErrorColor
        return $false
    }
    
    Write-Log "브랜치 생성 중: $BranchName" "INFO" $InfoColor
    
    $command = "git checkout -b $BranchName"
    $result = Invoke-CommandWithTimeout $command $Timeout "브랜치 생성"
    
    if ($result -ne $null) {
        Write-Log "브랜치 생성 완료" "SUCCESS" $SuccessColor
        return $true
    } else {
        Write-Log "브랜치 생성 실패" "ERROR" $ErrorColor
        return $false
    }
}

# 통합 워크플로우
function Invoke-CompleteWorkflow {
    param(
        [string]$CommitMessage,
        [string]$FilePattern = ".",
        [string]$BranchName = "",
        [switch]$Push = $false,
        [switch]$Pull = $false
    )
    
    Write-Log "=== Git 통합 워크플로우 시작 ===" "INFO" $InfoColor
    
    # 1. 현재 상태 확인
    Write-Log "1단계: 현재 상태 확인" "INFO" $InfoColor
    $status = Get-GitStatus
    if (-not $status) {
        Write-Log "상태 확인 실패로 워크플로우 중단" "ERROR" $ErrorColor
        return $false
    }
    
    # 2. 파일 추가
    Write-Log "2단계: 파일 추가" "INFO" $InfoColor
    if (-not (Add-Files $FilePattern)) {
        Write-Log "파일 추가 실패로 워크플로우 중단" "ERROR" $ErrorColor
        return $false
    }
    
    # 3. 커밋 생성
    Write-Log "3단계: 커밋 생성" "INFO" $InfoColor
    if (-not (New-Commit $CommitMessage)) {
        Write-Log "커밋 생성 실패로 워크플로우 중단" "ERROR" $ErrorColor
        return $false
    }
    
    # 4. 풀 (선택사항)
    if ($Pull) {
        Write-Log "4단계: 원격 변경사항 풀" "INFO" $InfoColor
        if (-not (Pull-Changes $BranchName)) {
            Write-Log "풀 실패, 계속 진행" "WARNING" $WarningColor
        }
    }
    
    # 5. 푸시 (선택사항)
    if ($Push) {
        Write-Log "5단계: 변경사항 푸시" "INFO" $InfoColor
        if (-not (Push-Changes $BranchName)) {
            Write-Log "푸시 실패" "ERROR" $ErrorColor
            return $false
        }
    }
    
    Write-Log "=== Git 통합 워크플로우 완료 ===" "SUCCESS" $SuccessColor
    return $true
}

# 메인 실행 로직
try {
    Write-Log "Git 워크플로우 시작: $Action" "INFO" $InfoColor
    
    switch ($Action) {
        "add" {
            if (Add-Files $Files) {
                Write-Log "파일 추가 성공" "SUCCESS" $SuccessColor
            } else {
                Write-Log "파일 추가 실패" "ERROR" $ErrorColor
                exit 1
            }
        }
        
        "commit" {
            if (New-Commit $Message) {
                Write-Log "커밋 성공" "SUCCESS" $SuccessColor
            } else {
                Write-Log "커밋 실패" "ERROR" $ErrorColor
                exit 1
            }
        }
        
        "push" {
            if (Push-Changes $Branch $Force) {
                Write-Log "푸시 성공" "SUCCESS" $SuccessColor
            } else {
                Write-Log "푸시 실패" "ERROR" $ErrorColor
                exit 1
            }
        }
        
        "status" {
            $status = Get-GitStatus
            if ($status) {
                Write-Host $status
            } else {
                Write-Log "상태 확인 실패" "ERROR" $ErrorColor
                exit 1
            }
        }
        
        "pull" {
            if (Pull-Changes $Branch) {
                Write-Log "풀 성공" "SUCCESS" $SuccessColor
            } else {
                Write-Log "풀 실패" "ERROR" $ErrorColor
                exit 1
            }
        }
        
        "checkout" {
            if (Switch-Branch $Branch) {
                Write-Log "브랜치 전환 성공" "SUCCESS" $SuccessColor
            } else {
                Write-Log "브랜치 전환 실패" "ERROR" $ErrorColor
                exit 1
            }
        }
        
        "branch" {
            if (New-Branch $Branch) {
                Write-Log "브랜치 생성 성공" "SUCCESS" $SuccessColor
            } else {
                Write-Log "브랜치 생성 실패" "ERROR" $ErrorColor
                exit 1
            }
        }
        
        "log" {
            $command = "git log --oneline -10"
            $result = Invoke-CommandWithTimeout $command $Timeout "커밋 로그 조회"
            if ($result) {
                Write-Host $result
            } else {
                Write-Log "로그 조회 실패" "ERROR" $ErrorColor
                exit 1
            }
        }
        
        "diff" {
            $command = "git diff --name-only"
            $result = Invoke-CommandWithTimeout $command $Timeout "변경사항 조회"
            if ($result) {
                Write-Host $result
            } else {
                Write-Log "변경사항 조회 실패" "ERROR" $ErrorColor
                exit 1
            }
        }
        
        default {
            Write-Log "알 수 없는 액션: $Action" "ERROR" $ErrorColor
            exit 1
        }
    }
    
    Write-Log "Git 워크플로우 완료" "SUCCESS" $SuccessColor
    
} catch {
    Write-Log "Git 워크플로우 오류: $($_.Exception.Message)" "ERROR" $ErrorColor
    exit 1
}
