# 테스트 스크립트
Write-Host "서버 시작 중..."
Start-Process -NoNewWindow powershell -ArgumentList "-Command", "cd '$PWD'; node src/index.js"

# 서버가 시작될 때까지 대기
Start-Sleep -Seconds 3

Write-Host "API 테스트 시작..."

# Help 엔드포인트 테스트
Write-Host "`n=== Help 엔드포인트 테스트 ==="
try {
    $helpResponse = Invoke-WebRequest -Uri "http://localhost:50000/api/help" -UseBasicParsing -TimeoutSec 5
    Write-Host "Status: $($helpResponse.StatusCode)"
    Write-Host "Content: $($helpResponse.Content)"
} catch {
    Write-Host "Help 엔드포인트 오류: $($_.Exception.Message)"
}

# Trending 엔드포인트 테스트  
Write-Host "`n=== Trending 엔드포인트 테스트 ==="
try {
    $trendingResponse = Invoke-WebRequest -Uri "http://localhost:50000/api/trending" -UseBasicParsing -TimeoutSec 5
    Write-Host "Status: $($trendingResponse.StatusCode)"
    $json = $trendingResponse.Content | ConvertFrom-Json
    Write-Host "Posts count: $($json.posts.Count)"
    Write-Host "Source: $($json.source)"
} catch {
    Write-Host "Trending 엔드포인트 오류: $($_.Exception.Message)"
}

# Health 엔드포인트 테스트
Write-Host "`n=== Health 엔드포인트 테스트 ==="
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:50000/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "Status: $($healthResponse.StatusCode)"
    Write-Host "Content: $($healthResponse.Content)"
} catch {
    Write-Host "Health 엔드포인트 오류: $($_.Exception.Message)"
}

Write-Host "`n테스트 완료"