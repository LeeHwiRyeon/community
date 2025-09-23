# Community Hub

백엔드(Express + MariaDB) 중심 커뮤니티 실험 프로젝트. 과거 정적 프론트는 제거되었습니다.

## 🚀 빠른 시작 (명령체계)

### 새로운 체계화된 스크립트 (권장)

모든 실행 스크립트는 `scripts/` 디렉터리에 정리되어 있습니다.

#### 1. 풀스택 개발 환경 (프론트엔드 + 백엔드)
```bash
# Batch 파일 (Windows)
scripts\dev-start.bat                    # 프론트엔드(5500) + 백엔드(50000) 동시 실행
scripts\dev-start.bat --backend-only     # 백엔드만 실행
scripts\dev-start.bat --frontend-only    # 프론트엔드만 실행
scripts\dev-start.bat --readonly         # 백엔드 읽기 전용 모드

# PowerShell (Windows)
scripts\dev-start.ps1                    # 프론트엔드 + 백엔드 동시 실행
scripts\dev-start.ps1 -BackendOnly       # 백엔드만 실행
scripts\dev-start.ps1 -FrontendOnly      # 프론트엔드만 실행
scripts\dev-start.ps1 -ReadOnly          # 백엔드 읽기 전용 모드
```

#### 2. 백엔드 단독 실행
```bash
# Batch 파일
scripts\backend-start.bat                # 기본 실행 (포트 50000)
scripts\backend-start.bat --readonly     # 읽기 전용 모드
scripts\backend-start.bat --port 8080    # 사용자 정의 포트
scripts\backend-start.bat --no-browser   # 브라우저 자동 오픈 안함

# PowerShell
scripts\backend-start.ps1                # 기본 실행
scripts\backend-start.ps1 -ReadOnly      # 읽기 전용 모드
scripts\backend-start.ps1 -Port 8080     # 사용자 정의 포트
scripts\backend-start.ps1 -NoBrowser     # 브라우저 자동 오픈 안함
```

#### 3. 프론트엔드 단독 실행
```bash
# Batch 파일
scripts\frontend-start.bat               # 기본 실행 (포트 5500)
scripts\frontend-start.bat 8080         # 사용자 정의 포트

# PowerShell
scripts\frontend-start.ps1               # 기본 실행
scripts\frontend-start.ps1 -Port 8080    # 사용자 정의 포트
```

#### 4. 서버 종료
```bash
# Batch 파일
scripts\server-stop.bat                 # 기본 포트들 (50000, 5500) 종료
scripts\server-stop.bat 8080            # 특정 포트 종료
scripts\server-stop.bat 50000 5500 8080 # 여러 포트 종료

# PowerShell
scripts\server-stop.ps1                 # 기본 포트들 종료
scripts\server-stop.ps1 -Ports 8080     # 특정 포트 종료
scripts\server-stop.ps1 -All            # 모든 Node.js 프로세스 종료
```

### 🔄 자동 프로세스 관리
모든 시작 스크립트는 **기존 프로세스 자동 감지 및 종료** 기능을 포함합니다:
- 동일한 포트를 사용하는 기존 프로세스 자동 감지
- 기존 프로세스 안전하게 종료
- 새로운 서버 시작
- 포트 충돌 없이 즉시 재시작 가능

### 📊 실시간 로그 모니터링
개발 중 실시간 로그 확인을 위한 기능:
```bash
# 실시간 로그 활성화
set LOG_REALTIME=1
scripts\backend-start.bat

# 로그 뷰어 접속
# 브라우저: http://localhost:50000/log-viewer.html
```

#### 로그 설정 환경변수
- `LOG_LEVEL`: debug, info, warn, error (기본값: info)
- `LOG_JSON`: JSON 형태 로그 출력 (1=활성화)
- `LOG_REALTIME`: 실시간 로그 스트리밍 (1=활성화)
- `LOG_FLUSH_INTERVAL`: 로그 플러시 간격(ms, 기본값: 1000)
- `LOG_MAX_SIZE`: 로그 파일 최대 크기(bytes, 기본값: 10MB)
- `LOG_MAX_FILES`: 유지할 로그 파일 수 (기본값: 5)
- `TZ`: 타임존 설정 (예: Asia/Seoul, UTC) - 로그 시간 표시에 영향

#### 타임존(TZ) 설정
로그에 표시되는 시간을 한국 시간으로 보려면:

**PowerShell에서:**
```powershell
$env:TZ = "Asia/Seoul"
scripts\backend-start.ps1
```

**Batch 파일에서:**
```cmd
set TZ=Asia/Seoul
scripts\backend-start.bat
```

**기본 지원 타임존:**
- `Asia/Seoul` - 한국 표준시 (KST, UTC+9)
- `UTC` - 협정세계시
- `America/New_York` - 동부 표준시
- `Europe/London` - 그리니치 평균시

로그 출력 예시:
```
[2025-09-21 08:30:45 KST] INFO Starting backend server...
[2025-09-21 08:30:46 KST] INFO Database connected successfully
```

### 기존 스크립트 (하위 호환성)
```bash
run.bat --quick                         # 백엔드 퀵 스타트
run-frontend.bat                        # 프론트엔드 개발 서버
start-server.ps1                        # PowerShell 백엔드 실행
```

### 수동 실행
```bash
# 백엔드
cd server-backend
npm install
node src/index.js

# 프론트엔드
cd frontend
node _dev_static_server.js 5500
```

## 📚 추가 문서
- **[개발 가이드](DEVELOPMENT_GUIDE.md)**: AI 에이전트 사용법, 개발 도구, 문제 해결
- **[로그 보안 분석](LOG_SECURITY_ANALYSIS.md)**: 로그 관리 및 보안 강화 방안
- **[API 참조](API_REFERENCE.md)**: REST API 상세 문서
- **[테스트 가이드](TESTING_GUIDE.md)**: 테스트 실행 및 작성 방법
- **[DB 스키마](DB_SCHEMA.md)**: 데이터베이스 구조 및 관계

## 주요 기능

- 게시판/게시글 CRUD + 소프트 삭제
- 조회수 서버 측 증가(POST /api/posts/:id/view)
- 페이지네이션 + 검색(FULLTEXT → LIKE fallback)
- 통합 테스트 스크립트(무의존 단일 파일 실행)
- 런타임 메트릭(/api/metrics) + keepalive
- 뷰 조회수 배치(메모리 버퍼 → 주기/임계치 flush + 지수 백오프)
- ETag + Last-Modified 기반 304 응답 (단건 게시글)
- Prometheus 지표(/api/metrics-prom)
- 클라이언트 Web Vitals 수집 엔드포인트(`/api/client-metric`) 및 요약(옵션)

## 📖 개발 가이드

### 환경 설정

#### 필수 환경변수
- `PORT` (기본값: 50000) - 백엔드 서버 포트
- `DB_HOST` (기본값: localhost) - 데이터베이스 호스트
- `DB_USER` (기본값: root) - 데이터베이스 사용자명
- `DB_PASSWORD` - 데이터베이스 비밀번호
- `DB_DATABASE` (기본값: community) - 데이터베이스명

#### 선택적 환경변수
- `READONLY=1` - 읽기 전용 모드 활성화
- `REDIS_URL` - Redis 연결 URL (없으면 인메모리 모드)
- `ENABLE_STATIC=1` - 정적 파일 서빙 활성화
- `STATIC_ROOT` - 정적 파일 루트 경로

#### OAuth 인증 설정 (선택사항)
Google OAuth를 사용하려면 다음 환경변수를 설정하세요:

```env
# Google OAuth 설정
AUTH_ENABLED=1
OAUTH_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Google Cloud Console 설정 필요사항:**
1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 접속
2. OAuth 2.0 클라이언트 ID 생성 또는 편집
3. **승인된 JavaScript 출처**에 추가:
   - `http://localhost:50000`
   - `http://localhost:5500`
   - `http://127.0.0.1:50000`
   - `http://127.0.0.1:5500`
4. **승인된 리디렉션 URI**에 추가:
   - `http://localhost:50000/api/auth/callback/google`
   - `http://127.0.0.1:50000/api/auth/callback/google`

OAuth 설정 완료 후 다음 엔드포인트를 사용할 수 있습니다:
- `GET /api/auth/providers` - 사용 가능한 OAuth 제공자 목록
- `GET /api/auth/login/google` - Google OAuth 로그인 시작
- `GET /api/auth/me` - 현재 로그인된 사용자 정보

**OAuth 설정 테스트:**
```powershell
# OAuth 설정 상태 확인
scripts\test-oauth.ps1

# 또는 특정 서버 URL로 테스트
scripts\test-oauth.ps1 -BaseUrl "http://localhost:8080"
```

#### 성능 조정
- `VIEW_FLUSH_INTERVAL_MS` (기본값: 1500) - 뷰 카운트 플러시 간격
- `VIEW_MAX_PENDING` (기본값: 20) - 최대 대기중인 뷰 카운트
- `VIEW_BUFFER_MAX_TOTAL` - 뷰 버퍼 최대 크기
- `VIEW_MAX_BACKOFF_MS` - 최대 백오프 시간

#### 검색 및 메트릭
- `SEARCH_FULLTEXT_MIN_SCORE` (기본값: 0) - FULLTEXT 검색 최소 점수
- `CLIENT_METRIC_RPM` (기본값: 120) - 클라이언트 메트릭 분당 허용 수
- `CLIENT_METRIC_KEY_MODE` - 메트릭 키 모드 (ip|ip_ua)
- `CLIENT_METRIC_EXPORT_URL` - 메트릭 내보내기 URL
- `CLIENT_METRIC_EXPORT_INTERVAL_MS` (기본값: 60000) - 메트릭 내보내기 간격
- `HTTP_BUCKETS` - HTTP 요청 히스토그램 버킷 (ms 단위)

#### 클라이언트 설정
- `window.__LONGTASK_THRESHOLD_MS` (기본값: 50ms) - Long Task 임계값
- `window.__WEB_VITAL_SAMPLE` - Web Vitals 샘플링 비율 (0-1)

### 데이터베이스 초기화
최초 실행 시 테이블이 비어있으면 자동으로 기본 데이터가 삽입됩니다.
수동 초기화가 필요한 경우:
```bash
cd server-backend
node scripts/import-initial.js
```

## API 개요 (요약)

Base: `/api`

Boards
- `GET /boards` 목록
- `POST /boards { id,title,ordering? }`
- `PATCH /boards/:id { title?, ordering? }`
- `DELETE /boards/:id` (soft delete)

Posts
- `POST /boards/:boardId/posts { id?, title, content?, date?, tag?, thumb?, author?, category? }`
- `PATCH /boards/:boardId/posts/:pid` (부분 수정)
- `DELETE /boards/:boardId/posts/:pid` (soft delete)
- `GET /boards/:boardId/posts` (페이지네이션 + 검색)
- `GET /posts/:id` (단건 상세 + views)

조회수 & 기타
- `POST /posts/:pid/view` 조회수 +1
- `GET /posts-map` (캐시용 전체 맵 – 추후 점진적 사용 감소 예정)
- `GET /metrics` 런타임 메트릭
- `GET /health?verbose=1` 상태 + DB latency

## 페이지네이션 & 검색

`GET /api/boards/:id/posts`

Query 파라미터:
- `offset` (기본 0)
- `limit` (기본 30, 최대 100)
- `q` (검색어 – 공백 분리 다중 토큰)
- `approx=1` (FULLTEXT 결과 0 건일 때 LIKE AND fallback 허용)

응답 형식:
```json
{
	"items": [ { "id": "...", "title": "...", "views": 0, ... } ],
	"total": 123,
	"offset": 0,
	"limit": 30,
	"hasMore": true
}
```

검색 동작 순서:
1. FULLTEXT BOOLEAN MODE (title, content)
2. 결과가 없고 `approx=1` 이면 각 토큰 LIKE(AND 결합) fallback

주의: LIKE fallback 은 비용이 더 크므로 UI 에서 디바운스(현재 400ms) 적용.

## 프론트엔드 상태

이 저장소의 과거 정적 프론트(HTML/CSS/JS)는 정리되어 제거되었습니다. 본 프로젝트는 현재 API 백엔드에 집중합니다.

### (신규) 테스트 전용 Frontend 디렉토리

개발/QA 용으로 빠른 수동 검증을 위해 `frontend/` 폴더를 추가했습니다.

구성:
- `frontend/index.html` : 테스트 포털 (다른 테스트 페이지 링크)
- `frontend/test-frontend.html` : 전체 기능 통합 테스트 (게시판 CRUD, 검색, Redis 캐싱, 채팅, 보안/로깅 등)
- `frontend/simple-test.html` : 최소 핵심 API(health, trending 등) 빠른 점검용

루트 위치의 옛 테스트 HTML 파일들은 정리되어 현재는 `frontend/` 디렉토리만 유지됩니다. 신규 테스트 기능 추가 시 반드시 `frontend/test-frontend.html` 또는 단순 점검은 `frontend/simple-test.html` 에 함수를 추가하세요. (프로세스 문서 참조)

열기 (로컬 파일 직접 열기 예시, Windows):
```
file:///C:/Users/hwi/Desktop/Projects/community/frontend/index.html
```

서버 기동 후 API 호출이 정상 동작해야 합니다. (기본: `http://localhost:50000/api`).

## 테스트 실행

```bash
cd server-backend
# (기존 단일 스크립트)
node tests/api-random.js

# 새 node --test 자동화 통합(health/auth/mod/refresh/linking 등)
npm test

# 변경 감시 (개발 반복 빠른 피드백)
npm run test:watch
```

동작:
1. 기존 외부 서버(`/api/health`) 감지 시 재사용, 없으면 임베디드 부트스트랩(ephemeral port)
2. CRUD / 조회수 / 삭제 / 페이지네이션 / 검색(FULLTEXT & fallback) / 메트릭 검증
3. 결과 요약 + `test-summary.json` 기록

### 새 자동화 테스트 구조(Node 20+ 내장 테스트 러너)

경로: `server-backend/tests/auto/*`

구성:
- `helpers.js` : 공용 fetch wrapper(j), 로그인/관리자 획득, 랜덤 타이틀
- `health.test.js` : `/api/health`, `/api/metrics` 기본 가용성
- `auth-basic.test.js` : 최초 사용자 로그인 & `/api/auth/me`
- `moderator-refresh-linking.test.js` : 2번째 사용자 생성 → moderator 승격(엔드포인트 존재 시) → refresh 회전 → 계정 링크 시도

실행 전제:
1. `AUTH_ENABLED=1` 로 서버 별도 실행하거나
2. (추후) 테스트 부트스트랩 헬퍼 추가 예정 – 현재는 이미 기동된 서버 의존

환경변수 커스터마이징 예:
```powershell
$env:AUTH_ENABLED='1'; $env:PORT='50000'; node src/index.js
```
다른 터미널에서:
```powershell
cd server-backend
npm test
```

추가 예정 항목:
- soft delete & history 상세 검증(test) 분리
- announcements/events 수정/삭제 권한 에러 경로 검증
- refresh-cookie 플로우 전용 테스트
- view batching 강제 flush 테스트 (`__flushAllViewsForTest`) 후 metrics delta 검증
- 검색 fallback (FULLTEXT=0 → LIKE) 강제 조건 구성

## 조회수 배치 (View Batching)

`POST /api/posts/:pid/view` 는 즉시 DB를 갱신하지 않고 메모리 버퍼(Map)에 적재 후 주기적(기본 1.5초) 또는 임계치(단일 게시글 pending 20회) 도달 시 일괄 flush 합니다.

동작 흐름:
1. 요청 수신 → `viewBuffer[pid].pending++` 후 `{ ok: true, buffered: true }` 즉시 응답
2. 타이머(1.5s) 또는 임계치(20) 조건 충족 시 `INSERT ... ON DUPLICATE KEY UPDATE` 다중행(UNION 패턴) 수행
3. Graceful shutdown 시 잔여 pending 강제 flush

환경변수 (배치 관련):
- `VIEW_FLUSH_INTERVAL_MS` (기본 1500)
- `VIEW_MAX_PENDING` (기본 20)
 - `VIEW_BUFFER_MAX_TOTAL` (선택: 전체 pending 합계 초과 시 강제 flush 트리거)
 - `VIEW_MAX_BACKOFF_MS` (지수 백오프 상한, flush 실패 반복 시)

메트릭(/api/metrics JSON 주요 필드):
- `uptimeSec`, `boards`, `posts`, `memory`, `dbSampleLatencyMs`
- View Batching: `viewBufferedAdds`, `viewFlushBatches`, `viewFlushRows`, `viewFlushFailures`, `viewForcedFlushes`, `viewBackoffRetries`, `viewFlushDropped`
- Client Metrics 요약: `clientSummary` (LCP/INP/CLS/FID/LAF 일부 p값) + 세부 카운터 `clientMetric` 객체
	- `clientMetric.attempts`, `accepted`, `rateLimited`, `discardNoMetrics`, `discardAllNull`, `bytes`, `exportAttempts`, `exportSuccess`, `exportFail`

Prometheus 추가 카운터(/api/metrics-prom):
```
client_metric_attempts
client_metric_accepted
client_metric_rate_limited
client_metric_discard_no_metrics
client_metric_discard_all_null
client_metric_bytes
client_metric_export_attempts
client_metric_export_success
client_metric_export_fail
http_request_duration_ms_bucket{le="..."}
http_request_duration_ms_count
http_request_duration_ms_avg
```

Prometheus 노출: `GET /api/metrics-prom`
```
app_uptime_seconds 123
app_view_buffered_adds 42
... 등
```

장점:
- 다수의 빠른 페이지뷰 트래픽에서 DB write 횟수 대폭 감소
단점:
- flush 주기 내(최대 ~1.5s) 조회수 UI 반영 지연 가능
- 서버 비정상 종료 시 해당 주기의 카운트 소실 (최대 1.5s 윈도우 허용)

프론트 전략:
- 즉시 정확한 값이 필요하면(예: 상세 페이지) 작은 지연 후 재조회 또는 posts 리스트 재호출
- 현재 구현은 즉시 반환된 응답만 사용하고 뷰 숫자 실시간 보정은 향후 선택사항

향후 개선 아이디어:
- Flush 실패 시 지수 백오프 재시도 + 실패 카운터 메트릭
- 버퍼 총량(예: pending 합계)이 임계치 초과 시 강제 flush & warn 로그
- 단건 post 상세 조회 API(`/api/posts/:id`) 추가하여 polling 비용 절감 및 정밀 뷰 fetch
- Flush 주기 동적 조정 (트래픽 기반: TPS 낮으면 즉시 flush 비율 증가)
- Prometheus 노출 포맷(/metrics-prom) 추가로 외부 모니터링 연계
 - 서버 재시작 시 최근 flush 타임스탬프 기반 초기 즉시 flush 여부 판단

## ETag / Last-Modified 전략

`GET /api/posts/:id` 응답 시:

- ETag: `W/"post-<id>-<lastModEpoch>-<views>"` 형태 (views 포함 → 조회수 변화 시 강제 캐시 무효)
- Last-Modified: `updated_at` (없으면 `created_at`)
- 클라이언트가 `If-None-Match` 로 동일 ETag 전송 시 304 반환 (본문 없음)

장점:
- 단건 상세 재조회 시 전송량 감소
- 조회수 변동 반영 (ETag 내 views 포함) → Stale 표시 최소화

주의:
- 뷰가 배치로 지연 반영되므로 0→N 변화가 flush 전까지 지연될 수 있음
- 즉시 정확한 값이 필요하면 일정 지연 후(배치 주기 ~1.5s) 재호출 권장

## 프론트 관련 기록(레거시)
이전 버전의 정적 프론트 기능/UX 기록은 삭제되었습니다. 필요 시 Git 히스토리에서 복원 가능합니다.

## 테스트 성능 최적화

문제점 (초기):
- 순차적 게시글 생성 다수 → 전체 실행 시간 증가
- View flush 타이밍 레이스로 간헐 실패

개선:
- 게시글 생성 Promise.all 병렬화
- 필요 이상 생성 수 축소 (pagination 경계만 충족되는 최소 수)
- Flush 대기: 고정 sleep → Polling + 최대 5회 재시도 + 메트릭 힌트 기반 조기 종료
- Soft delete 검증 시 배열 참조 방식 오류 수정

효과:
- 평균 실행 시간 단축 (환경별 변동, 로컬에서는 수 초 수준 감소)
- 실패율 감소, 간헐적 레이스 재현 확률↓

추가 권장:
- Node --test 전환(미래) / 최소 단위 모듈 테스트 도입
- GitHub Actions 워크플로 구성 (lint + integration)

## 인증 / 권한 (v0.3 스냅샷)

`AUTH_ENABLED=1` 설정 시 `/api/auth/*` 활성화.

구성 요소:
- Google OAuth (실제 Authorization Code + PKCE + state) — `OAUTH_GOOGLE_CLIENT_ID/SECRET` 필요
- 기타 제공자는 현재 mock fallback (추후 실제 교체 예정)
- Access JWT + Refresh JWT (Redis 사용 시 jti TTL 저장, 미사용 시 메모리)
- 선택적 Refresh HttpOnly Cookie (`REFRESH_COOKIE=1`, HTTPS 환경에서 `COOKIE_SECURE=1` 권장)
- 계정 링크: 두번째(provider) 로그인 시 `?link=1` + 기존 Access 토큰 → 동일 user_id로 identity 추가
- 역할: admin / moderator / user
	- moderator: 공지/이벤트 생성·수정 가능, 삭제는 admin만 (soft delete)
- Soft Delete & History: announcements/events 삭제 시 `deleted=1` + history snapshot(announcement_history / event_history)
- 감사 로그: `auth_audit` (login_success, login_fail, refresh_success, login_link_success 등)
- 메트릭: authLoginSuccess / authLoginFail / authRefresh / authLink → `/api/metrics`, `/api/metrics-prom`
- 테스트 스크립트: `server-backend/tests/auth-*.test.js`

엔드포인트 요약:
- `GET /api/auth/providers`
- `GET /api/auth/login/:provider`
- `GET /api/auth/callback/:provider?code=...&link=1`
- `GET /api/auth/me`
- `POST /api/auth/refresh` (JSON body)
- `POST /api/auth/refresh-cookie` (쿠키 기반)

환경변수(추가):
- `JWT_ACCESS_TTL_SEC` / `JWT_REFRESH_TTL_SEC`
- `REFRESH_COOKIE=1` (쿠키 사용), `COOKIE_SECURE=1`
- `REDIS_URL` (Refresh store + state storage)

향후 계획:
- 나머지 소셜(OAuth) 실제 교환 구현 (GitHub/Naver/Kakao/Apple/MS)
- Refresh 토큰 기기 목록 / 로그아웃 / 강제 revoke
- JWKS & 키 로테이션 (HS→RS 마이그레이션 가능성 고려)
- MFA / 이상징후 탐지

## Web Vitals & Sampling / Rate Limit

### 수집 방식
클라이언트 측 수집 스크립트는 저장소에 포함되어 있지 않습니다. 외부 웹앱에서 수집 후 본 API의 `/api/client-metric` 으로 전송하는 방식을 가정합니다.

### 샘플링
- 기본 50% 확률(`window.__WEB_VITAL_SAMPLE` 또는 스크립트 태그 `data-wv-sample` 로 재정의 가능 0..1)
- Math.random() > rate 이면 조기 종료(수집 비용 절감)

### Long Animation Frame (LAF)
- `PerformanceObserver('long-animation-frame')` 지원 시 frame duration 수집
- LAF: 러닝 평균, LAF_MAX: 최대 frame duration → 서버 RingBuffer 집계
- Fallback: 지원 안될 경우 PerformanceObserver('longtask') 기반 평균/최대(longtask duration)로 추정

### 서버 유효성 & Rate Limit
- `/api/client-metric` IP 당 분당 기본 120건 (환경변수 `CLIENT_METRIC_RPM` 조정)
- Rate Key 모드: `CLIENT_METRIC_KEY_MODE=ip_ua` 로 IP+User-Agent 조합 제한 가능
- 모든 시간 기반 값 0~60000ms, CLS 0~10 범위 밖은 폐기(null 처리)
- 전체 값 null 시 payload 무시

### Metrics Summary (JSON)
`GET /api/metrics` 응답 내 `clientSummary` 예시:
```json
"clientSummary": {
	"collected": 42,
	"windowMinutes": 120,
	"LCP": { "p50": 1200, "p90": 1900 },
	"INP": { "p90": 180 },
	"CLS": { "p90": 0.08 },
	"FID": { "p90": 18 },
	"LAF": { "p90": 42 }
}
```

## Prometheus Metrics 확장

엔드포인트: `GET /api/metrics-prom`

노출 주요 지표:
- `app_uptime_seconds`
- `app_boards`, `app_posts`
- `app_keepalive_fail`
- `app_view_buffered_adds`, `app_view_flush_batches`, `app_view_flush_rows`

추가된 클라이언트 Web Vitals 및 HTTP 지표 예시 (수집된 경우):
```
client_lcp_p50 1234
client_lcp_p90 1800
client_lcp_p99 2500
client_lcp_avg 1400
client_lcp_count 42
client_cls_p50 0.01
...
client_ttfb_p50 120
client_laf_p50 14
http_request_duration_ms_bucket{le="50"} 10
http_request_duration_ms_bucket{le="100"} 25
http_request_duration_ms_bucket{le="200"} 40
http_request_duration_ms_bucket{le="+Inf"} 42
http_request_duration_ms_avg 145.2
```

확장 아이디어:
- 검색 쿼리 수 / fallback 발생 수
- API 라우트 레이턴시 히스토그램 (예: prom-client summary/histogram)
- Web Vitals 장기 저장소 연동 (TSDB)

## 운영 팁

- Flush 지연으로 상세 페이지 즉시 반영 필요 시: POST /view 후 1~2회(간격 400~500ms) polling
- 트래픽 급증 시험: `ab` 혹은 `wrk` 로 `/posts/:id/view` 스파이크 후 메트릭에서 flush 배치 수/행 수 증가 확인
- DB write 빈도 튜닝: `VIEW_FLUSH_INTERVAL_MS` (짧으면 write 빈도↑, 지연↓) / `VIEW_MAX_PENDING` (작으면 단일 post 집중 트래픽 시 즉시 flush↑)

## 변경 로그 (최근)

- feat: View batching + metrics + Prometheus 노출
- feat: ETag/Last-Modified 캐싱 (단건 post)
- feat: 폰트 스케일 토글 & Skeleton 로딩
- feat: 화제글 트렌드 Delta (랭크 변화 표시)
- feat: UI 컴포넌트 헬퍼 추출 (renderPostRow 등)
- feat: 반응형 타이포그래피 scale 적용
- feat: 접근성 1차 개선 (skip link / landmark / focus 개선)
- feat: Web Vitals(LCP/CLS/FID/INP/FCP/TTFB) 수집 & `/api/client-metric` 라우트 + Prometheus 집계 노출
- feat: LAF(Long Animation Frame) / INP Event Timing 기반 정식 측정 + 샘플링 + 서버 Rate Limit + /metrics summary
- feat: HTTP 요청 지연 히스토그램 (간단 버킷) + Prometheus 노출
- feat: client metric export stub (ENV CLIENT_METRIC_EXPORT_URL)
- feat: ClientMetricBuffer (ring buffer) 도입
 - feat: Client metric ingestion/export counters + /metrics JSON 확장(viewFlushFailures 등)
- feat: A11y 2차 – aria-live hot 갱신 알림 / contrast audit 쿼리 파라미터
- perf(test): 병렬 생성/대기 로직 개선
- docs: README 확장 (본 섹션들)

## 향후 계획 (요약)

1. 뷰(batch) 업데이트 지연(1~2초 버퍼 큐) → DB write 압축
2. 에러 응답 포맷 통일(JSON { error, code })
3. Export/Import 스냅샷 (JSON dump & 재적재)
4. 간단 CI (GitHub Actions) + lint/test run
5. 보안 헤더 + rate limit 기본 가드
6. Observability 확장 (요청 지연 히스토그램 / 실패 카운터)
7. 클라이언트 Web Vitals → Prometheus / 장기 스토리지 연동
8. 검색/에러 레이턴시 히스토그램 + SLO 대시보드 다듬기
9. (완료) Web Vitals INP 정식 측정 & LAF (longtask fallback)
10. Contrast CI 자동 감사 (axe-core + Puppeteer)
11. HTTP duration 버킷 / TSDB export stub

## Contrast Audit CI

`/.github/workflows/contrast.yml` 워크플로:
- 푸시/PR 시 Puppeteer 로 대표 페이지 로드 → axe-core 실행 → color-contrast 심각(severe) 이상 존재 시 실패
- 결과 `contrast-report.json` artifact 업로드

로컬 실행:
```bash
cd server-backend
npm run test:contrast
```

## 기여 & 커스터마이징

- 색상/레이아웃: `styles.css`
- 게시판 로직: `board.js`
- 백엔드 라우트: `server-backend/src/routes.js`
- DB 초기 데이터: `server-backend/scripts/import-initial.js`

## 라이선스
학습/실험 목적. 별도 명시 전 상업적 사용 시 저자 문의 권장.
