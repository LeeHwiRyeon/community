# 크롬으로 커뮤니티 미리보기 열기
Write-Host "🚀 크롬으로 커뮤니티 UI 미리보기를 열고 있습니다..." -ForegroundColor Green

# 크롬 실행 파일 경로들 (여러 가능한 위치 확인)
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
    $htmlPath = Join-Path $PSScriptRoot "community-preview.html"
    
    if (Test-Path $htmlPath) {
        Write-Host "📄 HTML 파일: $htmlPath" -ForegroundColor Cyan
        
        # 크롬으로 HTML 파일 열기
        Start-Process -FilePath $chromePath -ArgumentList "`"$htmlPath`"", "--new-window", "--disable-web-security", "--disable-features=VizDisplayCompositor"
        
        Write-Host "🎉 크롬에서 커뮤니티 미리보기가 열렸습니다!" -ForegroundColor Green
        Write-Host "💡 팁: Ctrl+R로 새로고침, Ctrl+B로 브라우저에서 열기" -ForegroundColor Magenta
    }
    else {
        Write-Host "❌ HTML 파일을 찾을 수 없습니다: $htmlPath" -ForegroundColor Red
    }
}
else {
    Write-Host "❌ 크롬을 찾을 수 없습니다. 기본 브라우저로 열겠습니다..." -ForegroundColor Red
    
    # 기본 브라우저로 열기
    $htmlPath = Join-Path $PSScriptRoot "community-preview.html"
    if (Test-Path $htmlPath) {
        Start-Process $htmlPath
        Write-Host "✅ 기본 브라우저에서 열었습니다!" -ForegroundColor Green
    }
}

Write-Host "`n🔧 서버 상태 확인:" -ForegroundColor Yellow
Write-Host "   프론트엔드: http://localhost:5002" -ForegroundColor Cyan
Write-Host "   백엔드: http://localhost:50000" -ForegroundColor Cyan
