## 목차
1. 프로바이더 목록 조회
2. 로그인 (Mock / Google)
3. 현재 사용자 조회 (/me)
4. Refresh 토큰 회전 (Body/쿠키)
5. 계정 링크 (Account Linking)
6. Boards & Posts 기본 CRUD + 검색
7. Announcements / Events (Moderator & Admin)
8. Moderator 승격
9. Metrics & Prometheus
10. Debug / View Flush
11. 에러 패턴
## 9. Metrics
| Method | Path              | 권한 | 설명                                  |
| ------ | ----------------- | ---- | ------------------------------------- |
| GET    | /metrics          | PUB  | JSON 런타임/뷰/클라이언트/인증 카운터 |
| GET    | /metrics-prom     | PUB  | Prometheus 텍스트 포맷                |
| GET    | /health?verbose=1 | PUB  | 간단 상태 + DB latency                |
| GET    | /live             | PUB  | 라이브니스                            |
| GET    | /ready            | PUB  | DB ready                              |
## 10. Debug / View Flush
| Method | Path               | 권한 | 설명                                               |
| ------ | ------------------ | ---- | -------------------------------------------------- |
| POST   | /debug/flush-views | PUB  | view 배치 강제 flush (테스트/로컬, 보호 조건 필수) |
> 조건: `NODE_ENV=test` 또는 `ENV_ALLOW_DEBUG_FLUSH=1` (운영 비활성 권장)
## 11. 에러 패턴
문의/확장 요청 환영: 추가로 필요한 샘플(axios, PowerShell Invoke-RestMethod 등) 알려주세요.
---
통합 알림: 기존 `API_BACKEND.md` 삭제됨 (사양은 `../../API_REFERENCE.md`).
# API Usage Samples

이 문서는 프론트엔드 없이 백엔드 REST API 를 단독 호출하여 기본 기능을 시험하거나 자동화 스크립트를 작성할 때 참고할 수 있는 샘플을 제공합니다.

Base URL (기본 포트): `http://localhost:50000/api`

환경 전제 (예시):
```
AUTH_ENABLED=1
JWT_SECRET=dev_secret_change
# (선택) Redis
REDIS_URL=redis://127.0.0.1:6379/0
```

## 목차
1. 프로바이더 목록 조회
2. 로그인 (Mock / Google)
3. 현재 사용자 조회 (/me)
4. Refresh 토큰 회전 (Body/쿠키)
5. 계정 링크 (Account Linking)
6. Boards & Posts 기본 CRUD + 검색
7. Announcements / Events (Moderator & Admin)
8. Moderator 승격
9. Metrics & Prometheus
10. 에러 패턴

---
## 1. 프로바이더 목록
```bash
curl -s http://localhost:50000/api/auth/providers | jq
```
응답:
```json
{ "providers": [ { "provider": "google", "enabled": true }, ... ] }
```

## 2. 로그인
### 2.1 Mock / 간단 (provider callback 직접 호출)
```bash
LOGIN_JSON=$(curl -s "http://localhost:50000/api/auth/callback/google?code=demo")
echo "$LOGIN_JSON" | jq '.access,.refresh,.userId'
ACCESS=$(echo "$LOGIN_JSON" | jq -r '.access')
REFRESH=$(echo "$LOGIN_JSON" | jq -r '.refresh')
```
> Google 실제 OAuth 를 사용하려면 `GET /api/auth/login/google` 로 authorize URL 받아 브라우저에서 승인 후 `code` 로 callback.

### 2.2 실제 Google 흐름 (요약)
1. `curl -s http://localhost:50000/api/auth/login/google` → JSON 내 `authorize` URL 획득
2. 브라우저에서 URL 방문 → 승인 → redirect 로 받은 `code` 추출
3. `curl -s "http://localhost:50000/api/auth/callback/google?code=..."`

## 3. 현재 사용자
```bash
curl -s -H "Authorization: Bearer $ACCESS" http://localhost:50000/api/auth/me | jq
```
응답 (예):
```json
{"user":{"id":1,"display_name":"google_demo","role":"admin"},"tokenType":"jwt","exp":1699999999}
```

## 4. Refresh 토큰 회전
### 4.1 Body 방식
```bash
curl -s -X POST http://localhost:50000/api/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refresh":"'$REFRESH'"}' | jq
```
출력 내 새 access/refresh 추출.

### 4.2 쿠키 방식 (REFRESH_COOKIE=1)
최초 로그인 응답 `Set-Cookie: refresh_token=...` 포함. 이후:
```bash
curl -i -X POST http://localhost:50000/api/auth/refresh-cookie \
  -H 'Cookie: refresh_token=<기존refreshJWT>'
```

## 5. 계정 링크
이미 로그인된 상태에서 두번째 provider callback 에 `link=1` 추가.
```bash
curl -s -H "Authorization: Bearer $ACCESS" \
  "http://localhost:50000/api/auth/callback/github?code=abc&link=1" | jq '.linked,.userId'
```
`linked` 가 true 이고 동일 userId 반환되면 성공.

## 6. Boards & Posts
### 6.1 Board 생성
```bash
curl -s -X POST http://localhost:50000/api/boards -H 'Content-Type: application/json' \
  -d '{"id":"free","title":"자유게시판"}' | jq
```
### 6.2 Post 작성
```bash
curl -s -X POST http://localhost:50000/api/boards/free/posts \
  -H 'Content-Type: application/json' \
  -d '{"title":"첫 글","content":"내용"}' | jq
```
### 6.3 검색
```bash
curl -s "http://localhost:50000/api/boards/free/posts?q=첫&approx=1" | jq '.items[0].title'
```

## 7. Announcements / Events
(Moderator 이상 생성/수정, 삭제는 Admin)
```bash
# 공지 생성
curl -s -X POST http://localhost:50000/api/announcements \
  -H 'Authorization: Bearer $ACCESS' -H 'Content-Type: application/json' \
  -d '{"title":"공지","body":"본문","priority":50}' | jq

# 이벤트 생성
curl -s -X POST http://localhost:50000/api/events \
  -H 'Authorization: Bearer $ACCESS' -H 'Content-Type: application/json' \
  -d '{"title":"이벤트","status":"published"}' | jq
```
Soft delete 예:
```bash
curl -s -X DELETE http://localhost:50000/api/announcements/1 -H "Authorization: Bearer $ACCESS" | jq
```

## 8. Moderator 승격
(첫 사용자 = admin)
```bash
# 두번째 사용자 로그인 → userId 추출 SECOND
SECOND=$(curl -s "http://localhost:50000/api/auth/callback/google?code=another" | jq -r '.userId')
# 역할 변경
curl -s -X POST http://localhost:50000/api/users/$SECOND/role \
  -H 'Authorization: Bearer $ACCESS' -H 'Content-Type: application/json' \
  -d '{"role":"moderator"}' | jq
```

## 9. Metrics
```bash
curl -s http://localhost:50000/api/metrics | jq '.boards,.posts,.authLoginSuccess'
```
Prometheus 형식:
```bash
curl -s http://localhost:50000/api/metrics-prom | grep auth_login_success
```

## 10. 에러 패턴
| 상황           | 상태 | 예시 JSON                      |
| -------------- | ---- | ------------------------------ |
| 인증 누락      | 401  | {"error":"no_token"}           |
| 권한 부족      | 403  | {"error":"admin_required"}     |
| 잘못된 refresh | 401  | {"error":"invalid_refresh"}    |
| 속도 제한      | 429  | {"error":"rate_limited_write"} |
| 읽기 전용 모드 | 403  | {"error":"read_only_mode"}     |

---
## Node.js fetch 예시 (ESM)
```js
// Node 18+ 에서는 글로벌 fetch 사용 가능
const base = 'http://localhost:50000/api';
const login = await (await fetch(`${base}/auth/callback/google?code=demo`)).json();
const access = login.access;
const me = await (await fetch(`${base}/auth/me`, { headers: { Authorization: `Bearer ${access}` }})).json();
console.log('Me', me);
```

## 보안 관련 권장
- 운영 환경: HTTPS + COOKIE_SECURE=1 + 긴 JWT_SECRET(32+ random) + 키 로테이션 전략
- Google id_token 실제 검증(JWKS) 추가 권장 (현재 Todo)
- Redis 사용 시 접근 제어(비밀번호 / 네트워크 제한)

## Troubleshooting
| 증상                | 점검                             | 해결                                       |
| ------------------- | -------------------------------- | ------------------------------------------ |
| login provider 404  | AUTH_ENABLED=1? provider env?    | OAUTH_* 설정 또는 AUTH_ENABLE_ALL=1 (mock) |
| refresh 실패        | refresh 만료/재사용? Redis 연결? | 새 로그인, Redis 로그 확인                 |
| moderator 권한 안됨 | role 토큰 즉시 반영 X            | /auth/me 재호출로 role 확인                |

필요 시 OpenAPI 스펙 자동 생성이 가능하도록 후속 작업에서 `/api` 라우트 메타 데이터를 추출하는 스크립트 추가할 수 있습니다.

---
문의/확장 요청 환영: 추가로 필요한 샘플(axios, PowerShell Invoke-RestMethod 등) 알려주세요.
