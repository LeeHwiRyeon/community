param(
    [Parameter(Mandatory = $true)]
    [string]$Request
)

Write-Host "🚀 스마트 오너 요청 처리 시스템" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host ""

if ([string]::IsNullOrEmpty($Request)) {
    Write-Host "❌ 요청 내용을 입력해주세요." -ForegroundColor Red
    Write-Host ""
    Write-Host "사용법: .\smart-request.ps1 -Request '요청 내용'" -ForegroundColor Yellow
    Write-Host "예시: .\smart-request.ps1 -Request '버그 수정해줘'" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "📥 스마트 요청 처리 중..." -ForegroundColor Cyan

try {
    # Node.js 실행
    $process = Start-Process -FilePath "node" -ArgumentList "integrated-owner-request.js", "`"$Request`"" -Wait -PassThru -NoNewWindow
    
    if ($process.ExitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ 처리 완료!" -ForegroundColor Green
    }
    else {
        Write-Host ""
        Write-Host "❌ 처리 중 오류가 발생했습니다. (Exit Code: $($process.ExitCode))" -ForegroundColor Red
    }
}
catch {
    Write-Host ""
    Write-Host "❌ 실행 오류: $($_.Exception.Message)" -ForegroundColor Red
}
