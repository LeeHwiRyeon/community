# API Reference
## Metrics & Health
| Method | Path              | 권한 | 설명                                  |
| ------ | ----------------- | ---- | ------------------------------------- |
| GET    | /metrics          | PUB  | JSON 런타임/뷰/클라이언트/인증 카운터 |
| GET    | /metrics-prom     | PUB  | Prometheus 텍스트 포맷                |
| GET    | /health?verbose=1 | PUB  | 간단 상태 + DB latency                |
| GET    | /live             | PUB  | 라이브니스                            |
| GET    | /ready            | PUB  | DB ready                              |
## Client Metrics (Web Vitals)
| Method | Path           | 권한 | 설명                                           |
| ------ | -------------- | ---- | ---------------------------------------------- |
| POST   | /client-metric | PUB  | LCP/CLS/FID/INP/LAF 전송 (샘플링 + Rate Limit) |
| GET    | /client-metric | PUB  | 수집 요약 (향후 보호 예정)                     |
### 예시 Payload
```json
{ "metrics": [ { "name": "LCP", "value": 1234 }, { "name": "CLS", "value": 0.05 } ] }
```
## Debug
| Method | Path               | 권한 | 설명                                               |
| ------ | ------------------ | ---- | -------------------------------------------------- |
| POST   | /debug/flush-views | PUB  | view 배치 강제 flush (테스트/로컬, 보호 조건 필수) |
> 운영 비활성 권장. `NODE_ENV=test` 또는 `ENV_ALLOW_DEBUG_FLUSH=1` 조건부 허용.
## 향후 추가 예정
- 실제 GitHub/Naver/Kakao/Apple/Microsoft OAuth 코드 교환
- JWKS & 키 로테이션
- Logout / refresh revoke endpoint
- OpenAPI 자동 스펙 생성
---
문서 통합: 과거 `API_BACKEND.md` 내용은 본 문서(사양) 및 `server-backend/API_USAGE.md` (샘플)로 흡수.
# API Reference

> 이 문서는 "엔드포인트 사양" 에 집중합니다. 실행 스니펫/워크플로 예시는 `server-backend/API_USAGE.md` 참고.

Base: `http://localhost:50000/api`
Auth Base: `/api/auth`
모든 응답은 JSON (에러시 `{error: string, detail?}`) 

권한 표기:
- PUB: 무인증
- AUTH: 로그인 필요(임의 역할)
- MOD: moderator 이상
- ADM: admin 전용

## Auth
| Method | Path                     | 권한 | 설명                                       |
| ------ | ------------------------ | ---- | ------------------------------------------ |
| GET    | /auth/providers          | PUB  | 활성화된 provider 목록                     |
| GET    | /auth/login/:provider    | PUB  | (Google: authorize URL + PKCE / 기타 mock) |
| GET    | /auth/callback/:provider | PUB  | code 교환 / 사용자 생성 / 첫 사용자 admin  |
| GET    | /auth/me                 | AUTH | 현재 사용자 반환                           |
| POST   | /auth/refresh            | PUB  | body refresh 토큰 회전                     |
| POST   | /auth/refresh-cookie     | PUB  | 쿠키 기반 refresh 회전(REFRESH_COOKIE=1)   |
| POST   | /users/:id/role          | ADM  | 역할 변경(user/moderator/admin)            |

### Login Callback 성공 응답
```json
{
  "provider":"google",
  "userId":1,
  "access":"<JWT>",
  "refresh":"<JWT>",
  "access_expires_in":900,
  "refresh_expires_in":1209600,
  "legacyToken":"tok_...",
  "linked":false
}
```

### 오류 코드 예 (발췌)
| error                       | 설명                        |
| --------------------------- | --------------------------- |
| provider_disabled           | 비활성 provider             |
| invalid_state               | OAuth state 미일치/만료     |
| invalid_refresh             | 잘못되거나 재사용된 refresh |
| admin_required              | 관리자 권한 필요            |
| moderator_or_admin_required | moderator 또는 admin 필요   |
| read_only_mode              | READONLY=1 쓰기 차단        |

## Boards
| Method | Path        | 권한 | 설명                     |
| ------ | ----------- | ---- | ------------------------ |
| GET    | /boards     | PUB  | 활성 boards 목록         |
| POST   | /boards     | PUB  | 새 board 생성 (id,title) |
| PATCH  | /boards/:id | PUB  | 제목/ordering 수정       |
| DELETE | /boards/:id | PUB  | soft delete (deleted=1)  |

## Posts
| Method | Path                   | 권한 | 설명                             |
| ------ | ---------------------- | ---- | -------------------------------- |
| GET    | /boards/:id/posts      | PUB  | 게시판 글 목록 + 검색(q, approx) |
| POST   | /boards/:id/posts      | PUB  | 글 생성(title 필수)              |
| PATCH  | /boards/:id/posts/:pid | PUB  | 글 수정                          |
| DELETE | /boards/:id/posts/:pid | PUB  | soft delete                      |
| GET    | /posts/:pid            | PUB  | 단건 + views + ETag              |
| POST   | /posts/:pid/view       | PUB  | 조회수 버퍼 증가                 |
| GET    | /posts-map             | PUB  | 전체 맵 (캐시/관리용)            |

### 목록 예시 응답 (부분)
```json
{
  "items":[{"id":"pabc","title":"첫 글","views":10}],
  "total":1,
  "offset":0,
  "limit":30,
  "hasMore":false
}
```

## Announcements
| Method | Path               | 권한 | 설명                                                 |
| ------ | ------------------ | ---- | ---------------------------------------------------- |
| GET    | /announcements     | PUB  | 활성 + 시간창 필터                                   |
| POST   | /announcements     | MOD  | 생성 (title 필수)                                    |
| PATCH  | /announcements/:id | MOD  | 부분 수정                                            |
| DELETE | /announcements/:id | ADM  | soft delete (deleted=1, active=0) + history snapshot |

### Announcement 생성 응답 예
```json
{
  "id":5,
  "slug":null,
  "title":"공지",
  "body":"본문",
  "priority":50,
  "active":1,
  "deleted":0
}
```

## Events
| Method | Path                     | 권한 | 설명                  |
| ------ | ------------------------ | ---- | --------------------- |
| GET    | /events?status=published | PUB  | 상태 + 종료시간 필터  |
| POST   | /events                  | MOD  | 생성(title 필수)      |
| PATCH  | /events/:id              | MOD  | 수정                  |
| DELETE | /events/:id              | ADM  | soft delete + history |

## Metrics & Health
| Method | Path              | 권한 | 설명                                  |
| ------ | ----------------- | ---- | ------------------------------------- |
| GET    | /metrics          | PUB  | JSON 런타임/뷰/클라이언트/인증 카운터 |
| GET    | /metrics-prom     | PUB  | Prometheus 텍스트 포맷                |
| GET    | /health?verbose=1 | PUB  | 간단 상태 + DB latency                |
| GET    | /live             | PUB  | 라이브니스                            |
| GET    | /ready            | PUB  | DB ready                              |

### /metrics 핵심 필드
```json
{
  "boards": 3,
  "posts": 120,
  "authLoginSuccess": 4,
  "authRefresh": 2,
  "clientMetric": {"attempts": 10, "accepted": 8}
}
```

## Error Response 형식
```json
{"error":"invalid_refresh","detail":"(dev 환경에서만 추가)"}
```

## Authentication 흐름 (단축)
1. /auth/login/google → authorize URL (실제 구글) 또는 mock
2. /auth/callback/google?code=... → access/refresh 발급
3. /auth/me (Bearer access)
4. /auth/refresh (body) 또는 /auth/refresh-cookie
5. Linking: 두번째 provider callback + `link=1` + 기존 Bearer → linked:true

## Rate Limit
- 쓰기: 분당 기본 120 (환경변수 조정) 초과 시 429 `rate_limited_write`
- 검색(q 포함): 분당 기본 180  `rate_limited_search`

## Soft Delete & History 요약
- 삭제 시 UPDATE deleted=1 (announcements는 active=0 포함) → history 테이블 create/update/delete snapshot

## Versioning Note
현재 API는 v1 path prefix 미사용. 향후 break change 시 `/api/v2` 분리 제안.

## Change Log (요약)
| 버전 | 변경                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------- |
| 0.3  | Google PKCE, Redis refresh, moderator role, soft delete+history, audit metrics, cookie refresh |

## 향후 추가 예정
- 실제 GitHub/Naver/Kakao/Apple/Microsoft OAuth 코드 교환
- JWKS & 키 로테이션
- Logout / refresh revoke endpoint
- OpenAPI 자동 스펙 생성
