# 🔍 AUTOAGENTS 전체 시스템 통합 테스트 실행 스크립트
# 
# 모든 자동화 시스템의 통합 테스트를 실행하고 결과를 분석합니다.
# 
# @author AUTOAGENTS Manager
# @version 2.0.0
# @created 2025-10-02

param(
    [string]$TestSuite = "all",
    [switch]$Verbose = $false,
    [switch]$GenerateReport = $true,
    [string]$OutputDir = "reports"
)

# 색상 함수 정의
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success { Write-ColorOutput Green $args }
function Write-Warning { Write-ColorOutput Yellow $args }
function Write-Error { Write-ColorOutput Red $args }
function Write-Info { Write-ColorOutput Cyan $args }

# 시작 시간 기록
$StartTime = Get-Date

Write-Success "🔍 AUTOAGENTS 전체 시스템 통합 테스트 시작!"
Write-Info ""
Write-Info "📋 테스트 설정:"
Write-Info "  • 테스트 스위트: $TestSuite"
Write-Info "  • 상세 로그: $Verbose"
Write-Info "  • 보고서 생성: $GenerateReport"
Write-Info "  • 출력 디렉토리: $OutputDir"
Write-Info ""

try {
    # 1. 환경 준비
    Write-Info "🏗️ 1단계: 테스트 환경 준비..."
    
    # Node.js 및 npm 버전 확인
    Write-Info "📦 Node.js 환경 확인..."
    $NodeVersion = node --version 2>$null
    $NpmVersion = npm --version 2>$null
    
    if (-not $NodeVersion) {
        throw "Node.js가 설치되지 않았거나 PATH에 없습니다."
    }
    
    Write-Success "  ✅ Node.js: $NodeVersion"
    Write-Success "  ✅ npm: $NpmVersion"
    
    # 의존성 설치 확인
    Write-Info "📦 의존성 확인..."
    if (-not (Test-Path "node_modules")) {
        Write-Info "  📥 의존성 설치 중..."
        npm install --silent
        if ($LASTEXITCODE -ne 0) {
            throw "의존성 설치 실패"
        }
    }
    Write-Success "  ✅ 의존성 확인 완료"
    
    # 테스트 디렉토리 생성
    Write-Info "📁 테스트 디렉토리 준비..."
    $TestDirs = @("reports", "logs", "temp")
    foreach ($dir in $TestDirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    Write-Success "  ✅ 테스트 디렉토리 준비 완료"
    
    # 2. 서버 상태 확인
    Write-Info "🌐 2단계: 서버 상태 확인..."
    
    # 백엔드 서버 확인
    Write-Info "  🔍 백엔드 서버 상태 확인..."
    try {
        $Response = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method Get -TimeoutSec 10 -ErrorAction Stop
        Write-Success "  ✅ 백엔드 서버 정상 (포트 5001)"
    }
    catch {
        Write-Warning "  ⚠️ 백엔드 서버 미실행 - 테스트 서버 시작 중..."
        
        # 테스트용 서버 시작
        $ServerProcess = Start-Process -FilePath "npm" -ArgumentList "run", "start:test" -PassThru -WindowStyle Hidden
        Start-Sleep -Seconds 10
        
        try {
            $Response = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method Get -TimeoutSec 5
            Write-Success "  ✅ 테스트 서버 시작 완료"
        }
        catch {
            Write-Error "  ❌ 서버 시작 실패 - 통합 테스트를 계속 진행합니다"
        }
    }
    
    # 3. 통합 테스트 실행
    Write-Info "🧪 3단계: 통합 테스트 실행..."
    
    $TestCommand = "npm test -- --grep `"AUTOAGENTS 전체 시스템 통합 테스트`""
    
    if ($Verbose) {
        $TestCommand += " --reporter spec"
    }
    else {
        $TestCommand += " --reporter json"
    }
    
    Write-Info "  🚀 테스트 명령 실행: $TestCommand"
    
    # 테스트 실행
    $TestOutput = ""
    $TestError = ""
    
    $ProcessInfo = New-Object System.Diagnostics.ProcessStartInfo
    $ProcessInfo.FileName = "cmd"
    $ProcessInfo.Arguments = "/c $TestCommand"
    $ProcessInfo.RedirectStandardOutput = $true
    $ProcessInfo.RedirectStandardError = $true
    $ProcessInfo.UseShellExecute = $false
    $ProcessInfo.CreateNoWindow = $true
    
    $Process = New-Object System.Diagnostics.Process
    $Process.StartInfo = $ProcessInfo
    $Process.Start() | Out-Null
    
    $TestOutput = $Process.StandardOutput.ReadToEnd()
    $TestError = $Process.StandardError.ReadToEnd()
    $Process.WaitForExit()
    
    $TestExitCode = $Process.ExitCode
    
    # 테스트 결과 분석
    Write-Info "📊 4단계: 테스트 결과 분석..."
    
    if ($TestExitCode -eq 0) {
        Write-Success "  ✅ 모든 통합 테스트 통과!"
    }
    else {
        Write-Warning "  ⚠️ 일부 테스트 실패 (종료 코드: $TestExitCode)"
    }
    
    # 테스트 출력 로그 저장
    $LogFile = Join-Path $OutputDir "integration-test-log-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
    $TestOutput | Out-File -FilePath $LogFile -Encoding UTF8
    
    if ($TestError) {
        $ErrorLogFile = Join-Path $OutputDir "integration-test-errors-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
        $TestError | Out-File -FilePath $ErrorLogFile -Encoding UTF8
        Write-Warning "  ⚠️ 오류 로그 저장: $ErrorLogFile"
    }
    
    Write-Success "  ✅ 테스트 로그 저장: $LogFile"
    
    # 5. 성능 메트릭 수집
    Write-Info "📈 5단계: 성능 메트릭 수집..."
    
    $PerformanceMetrics = @{
        timestamp     = Get-Date
        testDuration  = (Get-Date) - $StartTime
        systemMetrics = @{
            cpuUsage    = (Get-Counter "\Processor(_Total)\% Processor Time" -SampleInterval 1 -MaxSamples 1).CounterSamples.CookedValue
            memoryUsage = [math]::Round((Get-Process -Name "node" -ErrorAction SilentlyContinue | Measure-Object WorkingSet -Sum).Sum / 1MB, 2)
            diskSpace   = (Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'" | Select-Object @{Name = "FreeSpaceGB"; Expression = { [math]::Round($_.FreeSpace / 1GB, 2) } }).FreeSpaceGB
        }
        testResults   = @{
            exitCode  = $TestExitCode
            hasErrors = $TestError -ne ""
            logSize   = (Get-Item $LogFile -ErrorAction SilentlyContinue).Length
        }
    }
    
    Write-Success "  ✅ 성능 메트릭 수집 완료"
    Write-Info "    • CPU 사용률: $([math]::Round($PerformanceMetrics.systemMetrics.cpuUsage, 2))%"
    Write-Info "    • 메모리 사용량: $($PerformanceMetrics.systemMetrics.memoryUsage) MB"
    Write-Info "    • 디스크 여유공간: $($PerformanceMetrics.systemMetrics.diskSpace) GB"
    
    # 6. 보고서 생성
    if ($GenerateReport) {
        Write-Info "📋 6단계: 통합 테스트 보고서 생성..."
        
        $ReportData = @{
            testSuite       = $TestSuite
            timestamp       = Get-Date
            duration        = (Get-Date) - $StartTime
            environment     = @{
                nodeVersion = $NodeVersion
                npmVersion  = $NpmVersion
                platform    = $env:OS
                hostname    = $env:COMPUTERNAME
            }
            results         = @{
                exitCode  = $TestExitCode
                success   = $TestExitCode -eq 0
                hasErrors = $TestError -ne ""
                logFile   = $LogFile
            }
            performance     = $PerformanceMetrics
            summary         = @{
                totalTests  = "통합 테스트 스위트"
                passedTests = if ($TestExitCode -eq 0) { "모든 테스트 통과" } else { "일부 테스트 실패" }
                failedTests = if ($TestExitCode -ne 0) { "실패한 테스트 있음" } else { "실패 없음" }
                coverage    = "통합 테스트 커버리지"
            }
            recommendations = @()
        }
        
        # 권장사항 생성
        if ($TestExitCode -ne 0) {
            $ReportData.recommendations += "실패한 테스트를 검토하고 수정하세요."
        }
        
        if ($PerformanceMetrics.systemMetrics.cpuUsage -gt 80) {
            $ReportData.recommendations += "CPU 사용률이 높습니다. 시스템 최적화를 고려하세요."
        }
        
        if ($PerformanceMetrics.systemMetrics.memoryUsage -gt 1000) {
            $ReportData.recommendations += "메모리 사용량이 높습니다. 메모리 누수를 확인하세요."
        }
        
        # JSON 보고서 생성
        $JsonReportFile = Join-Path $OutputDir "integration-test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
        $ReportData | ConvertTo-Json -Depth 10 | Out-File -FilePath $JsonReportFile -Encoding UTF8
        
        # HTML 보고서 생성
        $HtmlReportFile = Join-Path $OutputDir "integration-test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').html"
        $HtmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>AUTOAGENTS 통합 테스트 보고서</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
        .metric { margin: 10px 0; }
        .section { margin: 20px 0; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 AUTOAGENTS 통합 테스트 보고서</h1>
        <p><strong>생성 시간:</strong> $(Get-Date)</p>
        <p><strong>테스트 기간:</strong> $((Get-Date) - $StartTime)</p>
        <p><strong>테스트 결과:</strong> $(if ($TestExitCode -eq 0) { '<span class="success">✅ 성공</span>' } else { '<span class="error">❌ 실패</span>' })</p>
    </div>
    
    <div class="section">
        <h2>📊 시스템 메트릭</h2>
        <div class="metric">CPU 사용률: $([math]::Round($PerformanceMetrics.systemMetrics.cpuUsage, 2))%</div>
        <div class="metric">메모리 사용량: $($PerformanceMetrics.systemMetrics.memoryUsage) MB</div>
        <div class="metric">디스크 여유공간: $($PerformanceMetrics.systemMetrics.diskSpace) GB</div>
    </div>
    
    <div class="section">
        <h2>📋 테스트 환경</h2>
        <table>
            <tr><th>항목</th><th>값</th></tr>
            <tr><td>Node.js 버전</td><td>$NodeVersion</td></tr>
            <tr><td>npm 버전</td><td>$NpmVersion</td></tr>
            <tr><td>플랫폼</td><td>$($env:OS)</td></tr>
            <tr><td>호스트명</td><td>$($env:COMPUTERNAME)</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>💡 권장사항</h2>
        $(if ($ReportData.recommendations.Count -gt 0) {
            "<ul>" + ($ReportData.recommendations | ForEach-Object { "<li>$_</li>" }) + "</ul>"
        } else {
            "<p class='success'>모든 시스템이 정상적으로 작동하고 있습니다.</p>"
        })
    </div>
</body>
</html>
"@
        
        $HtmlContent | Out-File -FilePath $HtmlReportFile -Encoding UTF8
        
        Write-Success "  ✅ 보고서 생성 완료"
        Write-Info "    • JSON 보고서: $JsonReportFile"
        Write-Info "    • HTML 보고서: $HtmlReportFile"
    }
    
    # 7. 최종 결과 요약
    Write-Info ""
    Write-Success "🎉 AUTOAGENTS 통합 테스트 완료!"
    Write-Info ""
    Write-Info "📊 최종 결과 요약:"
    Write-Info "  • 테스트 기간: $((Get-Date) - $StartTime)"
    Write-Info "  • 종료 코드: $TestExitCode"
    Write-Info "  • 결과: $(if ($TestExitCode -eq 0) { '✅ 성공' } else { '❌ 실패' })"
    Write-Info "  • 로그 파일: $LogFile"
    
    if ($GenerateReport) {
        Write-Info "  • 보고서: $JsonReportFile"
    }
    
    # 성공 시 추가 정보
    if ($TestExitCode -eq 0) {
        Write-Success ""
        Write-Success "🌟 모든 AUTOAGENTS 시스템이 정상적으로 통합되어 작동하고 있습니다!"
        Write-Success "🚀 완전 자동화 생태계가 성공적으로 검증되었습니다!"
    }
    
}
catch {
    Write-Error ""
    Write-Error "❌ 통합 테스트 실행 중 오류 발생:"
    Write-Error "  $($_.Exception.Message)"
    Write-Error ""
    
    # 오류 로그 저장
    $ErrorLogFile = Join-Path $OutputDir "integration-test-error-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
    $_.Exception | Out-File -FilePath $ErrorLogFile -Encoding UTF8
    Write-Error "오류 로그 저장: $ErrorLogFile"
    
    exit 1
}
finally {
    # 정리 작업
    Write-Info ""
    Write-Info "🧹 정리 작업..."
    
    # 테스트용 서버 종료 (필요한 경우)
    if ($ServerProcess -and !$ServerProcess.HasExited) {
        Write-Info "  🛑 테스트 서버 종료 중..."
        $ServerProcess.Kill()
        $ServerProcess.WaitForExit(5000)
        Write-Success "  ✅ 테스트 서버 종료 완료"
    }
    
    Write-Info "  ✅ 정리 작업 완료"
}

Write-Info ""
Write-Success "🏁 AUTOAGENTS 통합 테스트 스크립트 실행 완료!"

exit $TestExitCode
