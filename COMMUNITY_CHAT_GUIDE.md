# 커뮤니티별 채팅 기능 가이드

## 🎯 개요
각 커뮤니티(free, news, game, image, default, test)마다 독립적인 채팅방을 제공하는 실시간 채팅 시스템입니다.

## 🚀 빠른 시작

### 1. 서버 실행
```powershell
cd server-backend
$env:REDIS_URL="redis://localhost:6379"
node src/index.js
```

### 2. 테스트 페이지 접속
브라우저에서 다음 경로 열기:
```
file:///C:/Users/hwi/Desktop/Projects/community/frontend/test-frontend.html
```

---

## 💬 커뮤니티별 채팅 기능

### 새로운 기능
- **커뮤니티별 분리**: free, news, game, image, default, test 각각 독립적인 채팅방
- **실시간 메시징**: Redis 기반 빠른 메시지 전송/조회
- **메시지 제한**: 각 채팅방당 최대 500개 메시지 자동 관리
- **히스토리 관리**: 커뮤니티별 채팅 기록 초기화 기능

### 테스트 방법

#### 📝 기본 채팅 테스트
1. **채팅 커뮤니티** 드롭다운에서 선택 (free, news, game 등)
2. **작성자 이름** 입력 (기본값: "테스터")
3. **메시지 내용** 입력
4. **메시지 전송** 버튼 클릭
5. **메시지 조회** 버튼으로 결과 확인

#### 🔍 전체 커뮤니티 확인
- **전체 커뮤니티 채팅**: 모든 커뮤니티의 메시지 수 한 번에 확인
- **모든 커뮤니티 채팅**: 커뮤니티 목록과 상세 정보 조회

#### 🧹 관리 기능
- **500개 제한 테스트**: 현재 커뮤니티에 10개 테스트 메시지 전송
- **채팅 히스토리 초기화**: 선택된 커뮤니티의 모든 메시지 삭제

---

## 🔌 API 엔드포인트

### 새로 추가된 커뮤니티 채팅 API

#### 커뮤니티 현황 조회
```http
GET /api/chat/communities
```
**응답 예시:**
```json
{
  "ok": true,
  "communities": ["free", "news", "game", "image", "default", "test"],
  "details": [
    {
      "community": "free",
      "messageCount": 15,
      "lastMessageAt": "2025-09-20T04:00:00.000Z",
      "lastUsername": "테스터"
    }
  ]
}
```

#### 커뮤니티 채팅 히스토리 초기화
```http
DELETE /api/chat/{community}/clear
```
**응답 예시:**
```json
{
  "ok": true,
  "roomId": "free",
  "deletedCount": 15,
  "message": "free 채팅 히스토리가 초기화되었습니다."
}
```

### 기존 채팅 API (커뮤니티별 사용)

#### 커뮤니티 채팅 메시지 조회
```http
GET /api/chat/{community}/messages?limit=50
```

#### 커뮤니티에 메시지 전송
```http
POST /api/chat/{community}/messages
Content-Type: application/json

{
  "content": "안녕하세요!",
  "author": "테스터"
}
```

---

## 🧪 PowerShell 테스트 스크립트

### 커뮤니티별 메시지 전송
```powershell
# free 커뮤니티에 메시지 전송
$body = @{
    content = "PowerShell에서 보낸 메시지"
    author = "PS테스터"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:50000/api/chat/free/messages" `
    -Method POST `
    -Body $body `
    -ContentType "application/json" `
    -UseBasicParsing
```

### 모든 커뮤니티 채팅 현황 확인
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:50000/api/chat/communities" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json

Write-Host "=== 커뮤니티별 채팅 현황 ===" -ForegroundColor Cyan
foreach ($detail in $data.details) {
    Write-Host "$($detail.community): $($detail.messageCount)개 메시지" -ForegroundColor Green
}
```

### 특정 커뮤니티 메시지 조회
```powershell
$community = "free"
$response = Invoke-WebRequest -Uri "http://localhost:50000/api/chat/$community/messages" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json

Write-Host "=== $community 커뮤니티 채팅 ===" -ForegroundColor Cyan
foreach ($msg in $data.messages) {
    Write-Host "[$($msg.author)]: $($msg.content)" -ForegroundColor Yellow
}
```

---

## 📋 테스트 체크리스트

### ✅ 기본 기능 테스트
- [ ] 커뮤니티 선택 후 메시지 전송 성공
- [ ] 메시지 조회로 전송된 메시지 확인
- [ ] 다른 커뮤니티로 변경 후 메시지 분리 확인
- [ ] 작성자 이름 변경 후 메시지 전송

### ✅ 전체 시스템 테스트
- [ ] 전체 커뮤니티 채팅 현황 조회
- [ ] 모든 커뮤니티 채팅 목록 확인
- [ ] 커뮤니티별 메시지 수 정상 표시

### ✅ 제한 및 관리 테스트
- [ ] 500개 제한 테스트 실행
- [ ] 채팅 히스토리 초기화 실행
- [ ] 초기화 후 메시지 목록 확인

### ✅ 성능 테스트
- [ ] Redis 캐싱 동작 확인 (redis → memory_cache)
- [ ] 응답 시간 20ms 이내 유지
- [ ] 대량 메시지 처리 안정성

---

## 🎯 예상 결과

### 정상 동작 시
```
✅ free 채팅 메시지 전송 성공
ID: msg_abc123
시간: 2025-09-20 13:00:00
커뮤니티: free

✅ free 채팅 메시지 조회 성공
메시지 수: 5개 메시지
소스: redis
```

### 전체 커뮤니티 확인 시
```
✅ 전체 커뮤니티 채팅 확인 완료
free: 5개 메시지
news: 0개 메시지
game: 3개 메시지
image: 0개 메시지
default: 0개 메시지
test: 10개 메시지
```

---

## 🛠️ 문제 해결

### 메시지 전송 실패
1. **빈 메시지**: 메시지 내용을 입력했는지 확인
2. **서버 오류**: 브라우저 개발자 도구에서 네트워크 탭 확인
3. **CORS 오류**: 서버에서 CORS 설정 확인

### 메시지 조회 실패
1. **Redis 연결**: Memurai 서버 실행 상태 확인
2. **DB 연결**: 데이터베이스 파일 존재 여부 확인
3. **권한 문제**: 파일 접근 권한 확인

### 성능 저하
1. **Redis 최적화**: `$env:REDIS_URL="redis://localhost:6379"` 설정 확인
2. **메모리 부족**: 시스템 메모리 사용량 확인
3. **포트 충돌**: 포트 50000 사용 중인 다른 프로세스 확인

---

## 🔧 Redis 설정 확인

### Memurai 연결 테스트
```powershell
& "C:\Program Files\Memurai\memurai-cli.exe" ping
```
**예상 결과**: `PONG`

### 채팅 데이터 확인
```powershell
# 채팅 관련 키 조회
& "C:\Program Files\Memurai\memurai-cli.exe" keys "chat:*"

# 특정 커뮤니티 메시지 수 확인
& "C:\Program Files\Memurai\memurai-cli.exe" llen "chat:free:messages"
```

---

## 📊 성능 모니터링

### 응답 시간 측정
```javascript
// 브라우저 개발자 도구 콘솔에서 실행
const start = performance.now();
fetch('/api/chat/free/messages')
  .then(response => response.json())
  .then(data => {
    const elapsed = performance.now() - start;
    console.log(`응답 시간: ${elapsed.toFixed(1)}ms`);
    console.log(`소스: ${data.source}`);
  });
```

### 네트워크 상태 확인
브라우저 개발자 도구 → 네트워크 탭에서:
- 요청 상태 코드 (200 OK)
- 응답 시간 (< 100ms)
- 응답 크기 확인