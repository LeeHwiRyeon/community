# 뉴스 페이퍼 관리자 대시보드 열기
Write-Host "📰 뉴스 페이퍼 관리자 대시보드를 열고 있습니다..." -ForegroundColor Green

# 크롬 실행 파일 경로들
$chromePaths = @(
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe",
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)

$chromePath = $null
foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        $chromePath = $path
        break
    }
}

if ($chromePath) {
    Write-Host "✅ 크롬을 찾았습니다: $chromePath" -ForegroundColor Yellow
    
    # HTML 파일의 절대 경로
    $htmlPath = Join-Path $PSScriptRoot "news-admin-dashboard.html"
    
    if (Test-Path $htmlPath) {
        Write-Host "📄 관리자 대시보드: $htmlPath" -ForegroundColor Cyan
        
        # 크롬으로 HTML 파일 열기 (관리자 모드)
        Start-Process -FilePath $chromePath -ArgumentList "`"$htmlPath`"", "--new-window", "--disable-web-security", "--disable-features=VizDisplayCompositor", "--start-maximized"
        
        Write-Host "🎉 관리자 대시보드가 열렸습니다!" -ForegroundColor Green
        Write-Host "💡 기능:" -ForegroundColor Magenta
        Write-Host "   📊 실시간 통계 모니터링" -ForegroundColor Cyan
        Write-Host "   🔧 시스템 상태 확인" -ForegroundColor Cyan
        Write-Host "   ⚡ 빠른 작업 실행" -ForegroundColor Cyan
        Write-Host "   ⌨️ 단축키: Ctrl+R(새로고침), Ctrl+B(브라우저), Ctrl+A(분석)" -ForegroundColor Cyan
    }
    else {
        Write-Host "❌ 관리자 대시보드 파일을 찾을 수 없습니다: $htmlPath" -ForegroundColor Red
    }
}
else {
    Write-Host "❌ 크롬을 찾을 수 없습니다. 기본 브라우저로 열겠습니다..." -ForegroundColor Red
    
    # 기본 브라우저로 열기
    $htmlPath = Join-Path $PSScriptRoot "news-admin-dashboard.html"
    if (Test-Path $htmlPath) {
        Start-Process $htmlPath
        Write-Host "✅ 기본 브라우저에서 열었습니다!" -ForegroundColor Green
    }
}

Write-Host "`n🔧 서버 상태 확인:" -ForegroundColor Yellow
Write-Host "   프론트엔드: http://localhost:5002" -ForegroundColor Cyan
Write-Host "   백엔드: http://localhost:50000" -ForegroundColor Cyan
Write-Host "   관리자 대시보드: $htmlPath" -ForegroundColor Cyan
