# 성능 테스트 스크립트
Write-Host "=== 커뮤니티 플랫폼 성능 테스트 ===" -ForegroundColor Cyan

# 서버 시작
Write-Host "`n1. 서버 시작 중..." -ForegroundColor Yellow
$serverProcess = Start-Process -NoNewWindow -PassThru powershell -ArgumentList "-Command", "cd '$PWD'; node src/index.js"
Start-Sleep -Seconds 3

# 기본 상태 확인
Write-Host "`n2. 서버 상태 확인..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:50000/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ 서버 정상 동작 (Status: $($health.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ 서버 연결 실패: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Trending 성능 테스트
Write-Host "`n3. Trending 엔드포인트 성능 테스트..." -ForegroundColor Yellow

$trendingTimes = @()
for ($i = 1; $i -le 10; $i++) {
    $start = Get-Date
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:50000/api/trending" -UseBasicParsing -TimeoutSec 5
        $end = Get-Date
        $elapsed = ($end - $start).TotalMilliseconds
        $trendingTimes += $elapsed
        
        $json = $response.Content | ConvertFrom-Json
        Write-Host "  시도 ${i}: ${elapsed}ms, 소스: $($json.source), 포스트: $($json.posts.Count)개" -ForegroundColor Gray
    } catch {
        Write-Host "  시도 ${i}: 실패 - $($_.Exception.Message)" -ForegroundColor Red
    }
}

$avgTrending = ($trendingTimes | Measure-Object -Average).Average
$minTrending = ($trendingTimes | Measure-Object -Minimum).Minimum
$maxTrending = ($trendingTimes | Measure-Object -Maximum).Maximum

Write-Host "  📊 Trending 성능 결과:" -ForegroundColor Cyan
Write-Host "     평균: ${avgTrending:F2}ms" -ForegroundColor White
Write-Host "     최소: ${minTrending:F2}ms" -ForegroundColor Green
Write-Host "     최대: ${maxTrending:F2}ms" -ForegroundColor Yellow

# 채팅 API 테스트
Write-Host "`n4. 채팅 API 기능 테스트..." -ForegroundColor Yellow

# 채팅방 목록 조회
try {
    $rooms = Invoke-WebRequest -Uri "http://localhost:50000/api/chat/rooms" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ 채팅방 목록 조회 성공 (Status: $($rooms.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ 채팅방 목록 조회 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 채팅 메시지 조회 (테스트룸)
try {
    $messages = Invoke-WebRequest -Uri "http://localhost:50000/api/chat/test/messages" -UseBasicParsing -TimeoutSec 5
    $msgJson = $messages.Content | ConvertFrom-Json
    Write-Host "✓ 채팅 메시지 조회 성공 - $($msgJson.messages.Count)개 메시지" -ForegroundColor Green
} catch {
    Write-Host "✗ 채팅 메시지 조회 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 메시지 전송 테스트
$testMessage = @{
    content = "성능 테스트 메시지 $(Get-Date)"
    author = "테스트봇"
} | ConvertTo-Json

try {
    $postResult = Invoke-WebRequest -Uri "http://localhost:50000/api/chat/test/messages" -Method POST -Body $testMessage -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ 메시지 전송 성공 (Status: $($postResult.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "✗ 메시지 전송 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# Help 엔드포인트 (로깅 제외 확인)
Write-Host "`n5. Help 엔드포인트 테스트..." -ForegroundColor Yellow
try {
    $help = Invoke-WebRequest -Uri "http://localhost:50000/api/help" -UseBasicParsing -TimeoutSec 5
    $helpJson = $help.Content | ConvertFrom-Json
    Write-Host "✓ Help 엔드포인트 정상" -ForegroundColor Green
    Write-Host "  - API 엔드포인트: $($helpJson.endpoints.PSObject.Properties.Count)개" -ForegroundColor Gray
    Write-Host "  - 보안 상태: Helmet=$($helpJson.security.helmet), CSP=$($helpJson.security.csp)" -ForegroundColor Gray
    Write-Host "  - 로깅 모드: JSON=$($helpJson.logging.jsonMode)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Help 엔드포인트 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 메트릭스 확인
Write-Host "`n6. 메트릭스 및 모니터링..." -ForegroundColor Yellow
try {
    $metrics = Invoke-WebRequest -Uri "http://localhost:50000/api/metrics" -UseBasicParsing -TimeoutSec 5
    $metricsJson = $metrics.Content | ConvertFrom-Json
    Write-Host "✓ 메트릭스 수집 정상" -ForegroundColor Green
    Write-Host "  - 총 요청 수: $($metricsJson.totalRequests)" -ForegroundColor Gray
    Write-Host "  - 평균 응답시간: $($metricsJson.averageResponseTime)ms" -ForegroundColor Gray
} catch {
    Write-Host "✗ 메트릭스 조회 실패: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== 성능 테스트 완료 ===" -ForegroundColor Cyan
Write-Host "서버 프로세스 ID: $($serverProcess.Id)" -ForegroundColor Yellow
Write-Host "서버를 종료하려면 다음 명령어를 실행하세요:" -ForegroundColor Yellow
Write-Host "Stop-Process -Id $($serverProcess.Id) -Force" -ForegroundColor Yellow