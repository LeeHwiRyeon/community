# Cursor 내장 대시보드 열기 스크립트
# PowerShell 스크립트

Write-Host "Community Cursor Dashboard를 열고 있습니다..." -ForegroundColor Green

# 현재 디렉토리 확인
$currentDir = Get-Location
$dashboardPath = Join-Path $currentDir "community-cursor-dashboard.html"

# 파일 존재 확인
if (Test-Path $dashboardPath) {
    Write-Host "대시보드 파일을 찾았습니다: $dashboardPath" -ForegroundColor Green
    
    # Cursor에서 HTML 파일 열기
    try {
        # Cursor 명령어로 HTML 파일 열기
        & cursor $dashboardPath
        
        Write-Host "Community Cursor Dashboard가 열렸습니다!" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "사용 가능한 기능:" -ForegroundColor Yellow
        Write-Host "   - Ctrl+1-6: 섹션 전환" -ForegroundColor White
        Write-Host "   - Ctrl+R: 데이터 새로고침" -ForegroundColor White
        Write-Host "   - 버튼: 커뮤니티 미리보기" -ForegroundColor White
        Write-Host "   - 자동 새로고침: 5분마다" -ForegroundColor White
        Write-Host ""
        Write-Host "팁: Cursor의 사이드바에서 HTML 파일을 열어두면 실시간으로 현황을 확인할 수 있습니다!" -ForegroundColor Magenta
        
    }
    catch {
        Write-Host "Cursor에서 파일을 열 수 없습니다. 수동으로 열어주세요:" -ForegroundColor Red
        Write-Host "   $dashboardPath" -ForegroundColor White
        
        # 기본 브라우저로 열기 (대안)
        Write-Host "기본 브라우저로 열기 시도 중..." -ForegroundColor Yellow
        Start-Process $dashboardPath
    }
}
else {
    Write-Host "대시보드 파일을 찾을 수 없습니다: $dashboardPath" -ForegroundColor Red
    Write-Host "현재 디렉토리: $currentDir" -ForegroundColor Yellow
    Write-Host "파일 목록:" -ForegroundColor Yellow
    Get-ChildItem -Name "*.html" | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
}

Write-Host ""
Write-Host "스크립트 완료" -ForegroundColor Green
