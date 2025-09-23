Write-Host "=== Redis 성능 비교 테스트 ===" -ForegroundColor Cyan

# Redis 모드 성능 테스트
Write-Host "`n1. Redis 최적화 모드 성능 테스트 (10회)" -ForegroundColor Yellow
$redisTimes = @()

1..10 | ForEach-Object {
    $start = Get-Date
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:50000/api/trending" -UseBasicParsing -TimeoutSec 5
        $end = Get-Date
        $elapsed = ($end - $start).TotalMilliseconds
        $redisTimes += $elapsed
        
        $json = $response.Content | ConvertFrom-Json
        Write-Host "  시도 $_`: ${elapsed:F2}ms, 소스: $($json.source)" -ForegroundColor Gray
    } catch {
        Write-Host "  시도 $_`: 실패" -ForegroundColor Red
    }
}

if ($redisTimes.Count -gt 0) {
    $redisAvg = ($redisTimes | Measure-Object -Average).Average
    $redisMin = ($redisTimes | Measure-Object -Minimum).Minimum  
    $redisMax = ($redisTimes | Measure-Object -Maximum).Maximum
    Write-Host "`n📊 Redis 모드 결과:" -ForegroundColor Cyan
    Write-Host "  평균: ${redisAvg:F2}ms" -ForegroundColor White
    Write-Host "  최소: ${redisMin:F2}ms" -ForegroundColor Green  
    Write-Host "  최대: ${redisMax:F2}ms" -ForegroundColor Yellow
}

# Redis 상태 확인
Write-Host "`n2. Redis 서버 상태 확인" -ForegroundColor Yellow
try {
    $info = & "C:\Program Files\Memurai\memurai-cli.exe" info memory
    Write-Host "Redis 메모리 사용량 확인됨" -ForegroundColor Green
} catch {
    Write-Host "Redis 상태 확인 실패" -ForegroundColor Red
}

# 최종 Help 엔드포인트 확인
Write-Host "`n3. 시스템 상태 최종 확인" -ForegroundColor Yellow
try {
    $help = Invoke-WebRequest -Uri "http://localhost:50000/api/help" -UseBasicParsing -TimeoutSec 5
    $helpJson = $help.Content | ConvertFrom-Json
    Write-Host "✅ Help 엔드포인트 정상" -ForegroundColor Green
    Write-Host "  - 보안: Helmet=$($helpJson.security.helmet), CSP=$($helpJson.security.csp)" -ForegroundColor Gray
    Write-Host "  - 로깅: JSON=$($helpJson.logging.jsonMode)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Help 엔드포인트 오류" -ForegroundColor Red
}

Write-Host "`n=== Redis 최적화 완료! ===" -ForegroundColor Cyan