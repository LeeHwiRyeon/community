Write-Host "=== 채팅 기능 테스트 ===" -ForegroundColor Cyan

# 1. 채팅방 목록 조회
Write-Host "1. 채팅방 목록 조회..." -ForegroundColor Yellow
try {
    $rooms = Invoke-WebRequest -Uri "http://localhost:50000/api/chat/rooms" -UseBasicParsing -TimeoutSec 5
    $roomsJson = $rooms.Content | ConvertFrom-Json
    Write-Host "✓ 성공 - $($roomsJson.rooms.Count)개 채팅방" -ForegroundColor Green
} catch {
    Write-Host "✗ 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. 기존 메시지 조회
Write-Host "2. 기존 메시지 조회 (test 룸)..." -ForegroundColor Yellow
try {
    $messages = Invoke-WebRequest -Uri "http://localhost:50000/api/chat/test/messages" -UseBasicParsing -TimeoutSec 5
    $msgJson = $messages.Content | ConvertFrom-Json
    Write-Host "✓ 성공 - $($msgJson.messages.Count)개 메시지" -ForegroundColor Green
} catch {
    Write-Host "✗ 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. 새 메시지 전송
Write-Host "3. 새 메시지 전송..." -ForegroundColor Yellow
$testMessage = @{
    content = "성능 테스트 메시지 - $(Get-Date -Format 'HH:mm:ss')"
    author = "테스트봇"
} | ConvertTo-Json

try {
    $postResult = Invoke-WebRequest -Uri "http://localhost:50000/api/chat/test/messages" -Method POST -Body $testMessage -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
    $postJson = $postResult.Content | ConvertFrom-Json
    Write-Host "✓ 메시지 전송 성공 - ID: $($postJson.messageId)" -ForegroundColor Green
} catch {
    Write-Host "✗ 전송 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. 전송 후 메시지 재조회
Write-Host "4. 전송 후 메시지 재조회..." -ForegroundColor Yellow
try {
    $messages2 = Invoke-WebRequest -Uri "http://localhost:50000/api/chat/test/messages" -UseBasicParsing -TimeoutSec 5
    $msg2Json = $messages2.Content | ConvertFrom-Json
    Write-Host "✓ 성공 - $($msg2Json.messages.Count)개 메시지 (방금 전송한 메시지 포함)" -ForegroundColor Green
    
    # 최신 메시지 확인
    if ($msg2Json.messages.Count -gt 0) {
        $latest = $msg2Json.messages[0]
        Write-Host "  최신 메시지: '$($latest.content)' by $($latest.author)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ 재조회 실패: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "=== 채팅 테스트 완료 ===" -ForegroundColor Cyan