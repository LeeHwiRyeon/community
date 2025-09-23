Write-Host "=== 커뮤니티 플랫폼 성능 테스트 ===" -ForegroundColor Cyan

# 서버 시작
Write-Host "1. 서버 시작 중..." -ForegroundColor Yellow
$serverProcess = Start-Process -NoNewWindow -PassThru powershell -ArgumentList "-Command", "cd '$PWD'; node src/index.js"
Start-Sleep -Seconds 3

# 서버 상태 확인
Write-Host "2. 서버 상태 확인..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:50000/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "서버 정상 동작 (Status: $($health.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "서버 연결 실패: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Trending 성능 테스트
Write-Host "3. Trending 성능 테스트 (10회)..." -ForegroundColor Yellow
$times = @()

1..10 | ForEach-Object {
    $start = Get-Date
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:50000/api/trending" -UseBasicParsing -TimeoutSec 5
        $end = Get-Date
        $elapsed = ($end - $start).TotalMilliseconds
        $times += $elapsed
        
        $json = $response.Content | ConvertFrom-Json
        Write-Host "  시도 $_`: ${elapsed}ms, 소스: $($json.source)" -ForegroundColor Gray
    } catch {
        Write-Host "  시도 $_`: 실패" -ForegroundColor Red
    }
}

if ($times.Count -gt 0) {
    $avg = ($times | Measure-Object -Average).Average
    $min = ($times | Measure-Object -Minimum).Minimum  
    $max = ($times | Measure-Object -Maximum).Maximum
    Write-Host "평균: ${avg:F2}ms, 최소: ${min:F2}ms, 최대: ${max:F2}ms" -ForegroundColor Cyan
}

# 채팅 API 테스트
Write-Host "4. 채팅 API 테스트..." -ForegroundColor Yellow
try {
    $messages = Invoke-WebRequest -Uri "http://localhost:50000/api/chat/test/messages" -UseBasicParsing -TimeoutSec 5
    Write-Host "채팅 메시지 조회 성공 (Status: $($messages.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "채팅 메시지 조회 실패: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "=== 테스트 완료 ===" -ForegroundColor Cyan
Write-Host "서버 프로세스 ID: $($serverProcess.Id)" -ForegroundColor Yellow