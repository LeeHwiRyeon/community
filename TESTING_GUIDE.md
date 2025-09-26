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

## 설정 및 인코딩
- **UTF-8 인코딩**: Mock server에서 UTF-8 인코딩을 명시적으로 설정하여 다국어 텍스트(그리스어, 일본어 등)가 깨지지 않도록 함
- **게임 카테고리**: `data/categories/game.json`에 국제 카테고리(Ελληνικά, 日本語, 한국어) 추가로 다국어 지원 테스트 가능
- **자동 메뉴 생성**: `/api/menu` 엔드포인트에서 `data/categories/game.json`을 기반으로 네비게이션 메뉴를 자동 생성하여 관리 편의성 향상

---

## 스트리머 온보딩 매뉴얼 테스트 케이스

### 테스트 개요
스트리머 온보딩 매뉴얼의 각 단계별 기능을 검증하는 테스트 케이스입니다. 초보자 사용자를 대상으로 한 완전한 워크플로우 테스트를 포함합니다.

### TC-STR-001: OBS 설정 가이드 검증
**목적:** OBS 설치부터 스트리밍 설정까지의 전체 프로세스 검증

**사전 조건:**
- Windows/macOS/Linux 환경
- 인터넷 연결
- OBS 미설치 상태

**테스트 단계:**
1. OBS 공식 사이트 접속 및 다운로드
2. 설치 마법사 실행 및 완료
3. OBS 실행 및 기본 인터페이스 확인
4. 씬 생성 및 소스 추가
5. 오디오/비디오 설정 구성
6. 인코딩 설정 적용
7. 스트리밍 키 입력 및 테스트 스트리밍

**예상 결과:**
- OBS 정상 설치 및 실행
- 모든 설정 옵션 접근 가능
- 테스트 스트리밍 성공 (녹화 또는 플랫폼 연결)

**실패 케이스:**
- 설치 실패: 네트워크 문제 또는 권한 부족
- 설정 오류: 잘못된 해상도/비트레이트로 인한 품질 저하

### TC-STR-002: 플랫폼 계정 연동 테스트
**목적:** Twitch/YouTube/AfreecaTV 계정 연동 프로세스 검증

**사전 조건:**
- 각 플랫폼 계정 보유
- 스트림키 접근 권한

**테스트 단계:**
1. Twitch 계정 생성 및 이메일 인증
2. 채널 프로필/배너 설정
3. 스트림키 확인 및 복사
4. YouTube 라이브 권한 활성화
5. AfreecaTV BJ 인증 진행
6. 각 플랫폼별 권장 설정 적용

**예상 결과:**
- 모든 플랫폼 계정 정상 연동
- 스트림키 안전하게 저장
- 채널 설정 완료 상태

### TC-STR-003: 첫 방송 준비 체크리스트 검증
**목적:** 방송 준비 단계별 체크리스트 기능 테스트

**사전 조건:**
- OBS 설치 완료
- 플랫폼 계정 연동 완료

**테스트 단계:**
1. 장비 점검 (컴퓨터 사양, 인터넷 속도)
2. 마이크/웹캠 테스트
3. 조명 및 배경 설정
4. 콘텐츠 기획 (주제 선정)
5. 방송 제목/설명 작성
6. 썸네일 디자인

**예상 결과:**
- 모든 체크리스트 항목 완료
- 네트워크 속도 5Mbps 이상
- 오디오/비디오 품질 양호

### TC-STR-004: 커뮤니티 구축 전략 테스트
**목적:** Discord 서버 및 소셜 미디어 연동 검증

**사전 조건:**
- Discord 계정
- 소셜 미디어 계정 (Twitter/Instagram)

**테스트 단계:**
1. Discord 서버 생성 및 설정
2. 채널 구조 설계 (공지/일반/팬아트)
3. 역할 및 권한 설정
4. 초대 링크 생성 및 배포
5. 소셜 미디어 연동
6. 커뮤니티 규칙 작성

**예상 결과:**
- Discord 서버 정상 운영
- 채널 권한 체계 작동
- 소셜 미디어 연동 성공

### TC-STR-005: 수익화 설정 테스트
**목적:** Twitch/YouTube/AfreecaTV 수익화 기능 검증

**사전 조건:**
- 플랫폼 파트너십 자격
- 계좌 정보 준비

**테스트 단계:**
1. Twitch Cheer/Subscribe 설정
2. YouTube 수퍼챗 활성화
3. AfreecaTV 별풍선 설정
4. Patreon 연동
5. 수익금 출금 설정
6. 세금 신고 준비

**예상 결과:**
- 모든 수익화 옵션 정상 설정
- 테스트 기부/구독 성공
- 출금 프로세스 이해

### TC-STR-006: 고급 기능 활용 테스트
**목적:** 채팅봇, 스트림 덱, 녹화 편집 등 고급 기능 검증

**사전 조건:**
- 기본 방송 설정 완료
- 추가 도구 설치 (Stream Deck 등)

**테스트 단계:**
1. StreamElements 채팅봇 설정
2. 스트림 덱 버튼 구성
3. OBS 고급 소스 활용
4. 녹화 및 편집 워크플로우
5. VOD 관리
6. 협업 방송 설정

**예상 결과:**
- 고급 기능 정상 작동
- 자동화 프로세스 효율성 확인
- 콘텐츠 품질 향상

### TC-STR-007: 문제 해결 가이드 검증
**목적:** 일반적인 방송 문제 해결 능력 테스트

**사전 조건:**
- 방송 환경 구축 완료

**테스트 단계:**
1. 네트워크 문제 시뮬레이션 및 해결
2. 오디오 에코 제거 테스트
3. 비디오 랙 현상 해결
4. 플랫폼 연결 실패 대응
5. 긴급 상황 (인터넷 끊김) 대처

**예상 결과:**
- 모든 문제 유형에 대한 해결책 적용 가능
- 백업 계획 작동
- 문제 해결 시간 최소화

### TC-STR-008: 매뉴얼 웹사이트 UX 테스트
**목적:** 대화형 매뉴얼 웹사이트 사용자 경험 검증

**사전 조건:**
- 매뉴얼 웹사이트 배포 완료

**테스트 단계:**
1. 단계별 진행 바 확인
2. 체크리스트 상호작용 테스트
3. 비디오 임베드 재생
4. 검색 기능 테스트
5. 모바일 반응형 확인
6. 접근성 준수 검증

**예상 결과:**
- 직관적인 사용자 인터페이스
- 모든 기능 정상 작동
- 모바일/데스크톱 호환성 양호

### TC-STR-009: 베타 테스터 피드백 수집
**목적:** 실제 사용자 피드백 기반 개선 검증

**사전 조건:**
- 베타 테스터 모집 완료

**테스트 단계:**
1. 테스터 대상 사용성 테스트
2. 피드백 설문조사 실시
3. A/B 테스트 (텍스트 vs 비디오)
4. 완료율 및 만족도 측정
5. 피드백 기반 개선 적용

**예상 결과:**
- 사용자 피드백 체계적 수집
- 개선 포인트 식별
- 만족도 점수 향상

### TC-STR-010: 종합 워크플로우 테스트
**목적:** 초보자부터 첫 방송까지 완전한 여정 테스트

**사전 조건:**
- 모든 매뉴얼 구성 요소 준비 완료

**테스트 단계:**
1. 완전 초보자 시뮬레이션
2. 매뉴얼 따라 단계별 진행
3. 각 단계별 시간 측정
4. 장애물 발생 및 해결
5. 최종 방송 성공

**예상 결과:**
- 80% 이상 완료율 달성
- 평균 소요 시간 45분 이내
- 사용자 만족도 높음

### 테스트 자동화 제안
```javascript
// 스트리머 매뉴얼 테스트 자동화 예시
const { test, expect } = require('@playwright/test');

test('스트리머 매뉴얼 워크플로우', async ({ page }) => {
  // OBS 다운로드 페이지 접근
  await page.goto('https://obsproject.com');
  await expect(page.locator('text=Download')).toBeVisible();
  
  // 플랫폼 가이드 확인
  await page.goto('/manual/platform-setup');
  await expect(page.locator('text=Twitch 계정 생성')).toBeVisible();
  
  // 체크리스트 상호작용
  await page.check('#equipment-check');
  await expect(page.locator('.progress-bar')).toHaveAttribute('style', /width: \d+%/);
});
```

### 성능 및 안정성 테스트
- **페이지 로딩 시간:** 매뉴얼 페이지 3초 이내 로딩
- **비디오 재생:** 버퍼링 없이 원활한 재생
- **모바일 호환성:** 터치 인터페이스 정상 작동
- **접근성:** 스크린 리더 지원, 키보드 내비게이션