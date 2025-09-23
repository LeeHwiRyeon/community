# 커뮤니티 플랫폼 테스트 가이드

## 🚀 빠른 테스트 (기본 기능 확인)

### 1. 서버 상태 확인
```powershell
Invoke-WebRequest -Uri "http://localhost:50000/api/health" -UseBasicParsing
```

### 2. Help 엔드포인트 (모든 API 목록)
```powershell
Invoke-WebRequest -Uri "http://localhost:50000/api/help" -UseBasicParsing | ConvertFrom-Json | ConvertTo-Json -Depth 3
```

### 3. Redis 최적화된 Trending 확인
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:50000/api/trending" -UseBasicParsing
$json = $response.Content | ConvertFrom-Json
Write-Host "소스: $($json.source)" -ForegroundColor Green
Write-Host "포스트 수: $($json.items.Count)" -ForegroundColor Green
```

## 📊 성능 테스트

### Redis vs Memory Cache 성능 비교
```powershell
# 첫 요청 (Redis에서 조회)
Measure-Command { Invoke-WebRequest -Uri "http://localhost:50000/api/trending" -UseBasicParsing }

# 두 번째 요청 (메모리 캐시에서 조회)
Measure-Command { Invoke-WebRequest -Uri "http://localhost:50000/api/trending" -UseBasicParsing }
```

### 연속 성능 테스트
```powershell
1..10 | ForEach-Object {
    $start = Get-Date
    $r = Invoke-WebRequest -Uri "http://localhost:50000/api/trending" -UseBasicParsing
    $elapsed = ((Get-Date) - $start).TotalMilliseconds
    $json = $r.Content | ConvertFrom-Json
    Write-Host "시도 $_`: ${elapsed:F1}ms, 소스: $($json.source)"
}
```

## 💬 채팅 기능 테스트

### 채팅방 목록 조회
```powershell
Invoke-WebRequest -Uri "http://localhost:50000/api/chat/rooms" -UseBasicParsing | ConvertFrom-Json
```

### 메시지 조회
```powershell
Invoke-WebRequest -Uri "http://localhost:50000/api/chat/test/messages" -UseBasicParsing | ConvertFrom-Json
```

### 메시지 전송
```powershell
$message = @{
    content = "테스트 메시지 $(Get-Date -Format 'HH:mm:ss')"
    author = "테스터"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:50000/api/chat/test/messages" -Method POST -Body $message -ContentType "application/json" -UseBasicParsing
```

## 🔍 Redis 상태 확인

### Redis 서버 연결 테스트
```powershell
& "C:\Program Files\Memurai\memurai-cli.exe" ping
```

### 저장된 데이터 확인
```powershell
# 모든 키 확인
& "C:\Program Files\Memurai\memurai-cli.exe" keys "*"

# 트렌딩 포스트 수 확인
& "C:\Program Files\Memurai\memurai-cli.exe" zcard "trending:posts"

# 상위 5개 랭킹 확인
& "C:\Program Files\Memurai\memurai-cli.exe" zrevrange "trending:posts" 0 4 WITHSCORES
```

## 🛡️ 보안 테스트

### CORS 헤더 확인
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:50000/api/health" -UseBasicParsing
$response.Headers
```

### CSP 헤더 확인
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:50000/api/trending" -UseBasicParsing
$response.Headers["Content-Security-Policy"]
```

## 📝 로깅 확인

### JSON 로그 모드 테스트
```powershell
# 환경 변수 설정 후 서버 재시작
$env:LOG_JSON = "1"
$env:REDIS_URL = "redis://localhost:6379"
node src/index.js
```

### 로그 필드 확인
서버 로그에서 다음 필드들이 포함되는지 확인:
- `m`: HTTP 메서드
- `p`: 경로  
- `ip`: 클라이언트 IP
- `ua`: User-Agent
- `reqBytes`: 요청 바이트
- `respBytes`: 응답 바이트
- `ms`: 응답시간

## 🧪 고급 테스트

### 부하 테스트 (간단)
```powershell
1..100 | ForEach-Object -Parallel {
    Invoke-WebRequest -Uri "http://localhost:50000/api/trending" -UseBasicParsing
} -ThrottleLimit 10
```

### 메모리 캐시 TTL 테스트
```powershell
# 첫 요청
Invoke-WebRequest -Uri "http://localhost:50000/api/trending" -UseBasicParsing

# 30초 후 요청 (캐시 만료 확인)
Start-Sleep 31
Invoke-WebRequest -Uri "http://localhost:50000/api/trending" -UseBasicParsing
```

## 🚨 오류 시나리오 테스트

### Redis 서버 중단 시 Fallback 테스트
```powershell
# Redis 서비스 중단
Stop-Service -Name "Memurai"

# API 호출 (DB fallback 동작 확인)
Invoke-WebRequest -Uri "http://localhost:50000/api/trending" -UseBasicParsing

# Redis 서비스 재시작
Start-Service -Name "Memurai"
```

## 📊 성능 지표 확인

### 메트릭스 엔드포인트
```powershell
Invoke-WebRequest -Uri "http://localhost:50000/api/metrics" -UseBasicParsing | ConvertFrom-Json
```

## 🎯 자동 테스트 스크립트 실행

프로젝트에 이미 준비된 테스트 스크립트들:
```powershell
# 기본 성능 테스트
powershell -ExecutionPolicy Bypass -File simple-test.ps1

# Redis 성능 테스트  
powershell -ExecutionPolicy Bypass -File redis-performance-test.ps1

# 채팅 기능 테스트
powershell -ExecutionPolicy Bypass -File chat-test.ps1
```

## 📱 브라우저 테스트

브라우저에서 직접 확인:
- `http://localhost:50000/api/help` - API 문서
- `http://localhost:50000/api/trending` - 인기글 랭킹
- `http://localhost:50000/api/health` - 서버 상태
- `http://localhost:50000/api/metrics` - 성능 지표

---

**💡 팁: 가장 빠른 테스트는 `http://localhost:50000/api/help`를 브라우저에서 열어보는 것입니다!**

---

## ♻️ 수동 테스트 페이지 갱신 절차 (frontend/test-frontend.html)

새 기능(엔드포인트/행동) 추가 시 아래 순서를 따라 테스트 HTML을 갱신합니다.

1. 어떤 동작을 검증할지 정의 (요청 메서드/URL/필수 body/query)
2. `frontend/test-frontend.html` 내 관련 섹션(게시글/채팅/보안 등) 선택 또는 새로운 "test-card" 블록 추가
3. 버튼(`<button onclick="...">`) 추가 + 결과 출력용 `<div id="XXXResult" class="result"></div>` 준비
4. JS 하단에 공용 `makeRequest(...)` 재사용하여 async 함수 구현
5. 성공/실패 메시지는 `showResult(elementId, message, type)` 패턴 사용 (type: success|error|info)
6. 커뮤니티 의존 기능은 현재 선택값(`currentCommunity` 또는 드롭다운 value) 반영
7. 필요한 경우 반복/성능 측정 시 `performance.now()` 이용해 소요(ms) 포함
8. 저장 후 브라우저에서 새로고침(F5) → 기능 수동 확인
9. 자동화 가능/중요 경로라면 `server-backend/tests/auto/*.test.js` 로도 스모크 추가

예시 스니펫:
```html
<button onclick="testNewFeature()">신규 기능 테스트</button>
<div id="newFeatureResult" class="result"></div>
```
```javascript
async function testNewFeature() {
    showLoading('newFeatureResult');
    const res = await makeRequest(`${API_BASE}/new/endpoint`, { method: 'POST', body: JSON.stringify({ foo: 'bar' }) });
    if (res.success) {
        showResult('newFeatureResult', `✅ 성공: id=${res.data.id}`, 'success');
    } else {
        showResult('newFeatureResult', `❌ 실패: ${res.error}`, 'error');
    }
}
```

경량 점검만 필요한 경우 `frontend/simple-test.html` 에도 동일 방식으로 소규모 버튼을 추가할 수 있습니다.

문서화 체크: 기능 추가 후 README 또는 관련 가이드(CATEGORY, CHAT, AUTH 등)에서 참조 필요 여부 검토 → 필요 시 링크/설명 보강.