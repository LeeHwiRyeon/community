# API Reference
## Metrics & Health
| Method | Path              | 沅뚰븳 | ?ㅻ챸                                  |
| ------ | ----------------- | ---- | ------------------------------------- |
| GET    | /metrics          | PUB  | JSON ?고???酉??대씪?댁뼵???몄쬆 移댁슫??|
| GET    | /metrics-prom     | PUB  | Prometheus ?띿뒪???щ㎎                |
| GET    | /health?verbose=1 | PUB  | 媛꾨떒 ?곹깭 + DB latency                |
| GET    | /live             | PUB  | ?쇱씠釉뚮땲??                           |
| GET    | /ready            | PUB  | DB ready                              |
## Client Metrics (Web Vitals)
## Profile
| Method | Path | 권한 | 설명 |
| ------ | ---- | ---- | ---- |
| GET | /profile/:userId | PUB | 사용자 레벨·배지·활동 통계를 반환 (60초 캐시) |
| GET | /profile/:userId/progress | PUB | 현재 XP/배지 요약 및 `features.rpgEnabled` 플래그를 반환 (60초 캐시) |
| POST | /profile/:userId/notifications/ack | AUTH | 알림 ID 목록을 읽음 처리 (없으면 전체) |

### 응답 예시
```json
{
  "user": { "id": "123", "display_name": "닉네임", "rpg_level": 4, "rpg_xp": 560, "last_levelup_at": "2025-09-26T02:11:00.000Z" },
  "stats": { "posts_count": 12, "comments_count": 48, "likes_received": 320, "badges_count": 5, "activity_score": 776 },
  "badges": [ { "badge_code": "first_post", "earned_at": "2025-09-20T09:12:00.000Z" } ],
  "progress": { "currentLevel": 4, "nextLevel": 5, "currentXp": 560, "nextLevelXp": 780, "progressPercent": 62 },
  "notifications": [ { "id": "notif-1", "title": "Lv.4 달성!", "type": "level" } ],
  "features": { "rpgEnabled": true, "rpgBetaCohort": true }
}
```
| Method | Path           | 沅뚰븳 | ?ㅻ챸                                           |
| ------ | -------------- | ---- | ---------------------------------------------- |
| POST   | /client-metric | PUB  | LCP/CLS/FID/INP/LAF ?꾩넚 (?섑뵆留?+ Rate Limit) |
| GET    | /client-metric | PUB  | ?섏쭛 ?붿빟 (?ν썑 蹂댄샇 ?덉젙)                     |
### ?덉떆 Payload
```json
{ "metrics": [ { "name": "LCP", "value": 1234 }, { "name": "CLS", "value": 0.05 } ] }
```
## Debug
| Method | Path               | 沅뚰븳 | ?ㅻ챸                                               |
| ------ | ------------------ | ---- | -------------------------------------------------- |
| POST   | /debug/flush-views | PUB  | view 諛곗튂 媛뺤젣 flush (?뚯뒪??濡쒖뺄, 蹂댄샇 議곌굔 ?꾩닔) |
> ?댁쁺 鍮꾪솢??沅뚯옣. `NODE_ENV=test` ?먮뒗 `ENV_ALLOW_DEBUG_FLUSH=1` 議곌굔遺 ?덉슜.
## ?ν썑 異붽? ?덉젙
- ?ㅼ젣 GitHub/Naver/Kakao/Apple/Microsoft OAuth 肄붾뱶 援먰솚
- JWKS & ??濡쒗뀒?댁뀡
- Logout / refresh revoke endpoint
- OpenAPI ?먮룞 ?ㅽ럺 ?앹꽦
---
臾몄꽌 ?듯빀: 怨쇨굅 `API_BACKEND.md` ?댁슜? 蹂?臾몄꽌(?ъ뼇) 諛?`server-backend/API_USAGE.md` (?섑뵆)濡??≪닔.
# API Reference

> ??臾몄꽌??"?붾뱶?ъ씤???ъ뼇" ??吏묒쨷?⑸땲?? ?ㅽ뻾 ?ㅻ땲???뚰겕?뚮줈 ?덉떆??`server-backend/API_USAGE.md` 李멸퀬.

Base: `http://localhost:50000/api`
Auth Base: `/api/auth`
紐⑤뱺 ?묐떟? JSON (?먮윭??`{error: string, detail?}`) 

沅뚰븳 ?쒓린:
- PUB: 臾댁씤利?
- AUTH: 濡쒓렇???꾩슂(?꾩쓽 ??븷)
- MOD: moderator ?댁긽
- ADM: admin ?꾩슜

## Auth
| Method | Path                     | 沅뚰븳 | ?ㅻ챸                                       |
| ------ | ------------------------ | ---- | ------------------------------------------ |
| GET    | /auth/providers          | PUB  | ?쒖꽦?붾맂 provider 紐⑸줉                     |
| GET    | /auth/login/:provider    | PUB  | (Google: authorize URL + PKCE / 湲고? mock) |
| GET    | /auth/callback/:provider | PUB  | code 援먰솚 / ?ъ슜???앹꽦 / 泥??ъ슜??admin  |
| GET    | /auth/me                 | AUTH | ?꾩옱 ?ъ슜??諛섑솚                           |
| POST   | /auth/refresh            | PUB  | body refresh ?좏겙 ?뚯쟾                     |
| POST   | /auth/refresh-cookie     | PUB  | 荑좏궎 湲곕컲 refresh ?뚯쟾(REFRESH_COOKIE=1)   |
| POST   | /users/:id/role          | ADM  | ??븷 蹂寃?user/moderator/admin)            |

### Login Callback ?깃났 ?묐떟
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

### ?ㅻ쪟 肄붾뱶 ??(諛쒖톸)
| error                       | ?ㅻ챸                        |
| --------------------------- | --------------------------- |
| provider_disabled           | 鍮꾪솢??provider             |
| invalid_state               | OAuth state 誘몄씪移?留뚮즺     |
| invalid_refresh             | ?섎せ?섍굅???ъ궗?⑸맂 refresh |
| admin_required              | 愿由ъ옄 沅뚰븳 ?꾩슂            |
| moderator_or_admin_required | moderator ?먮뒗 admin ?꾩슂   |
| read_only_mode              | READONLY=1 ?곌린 李⑤떒        |

## Boards
| Method | Path        | 沅뚰븳 | ?ㅻ챸                     |
| ------ | ----------- | ---- | ------------------------ |
| GET    | /boards     | PUB  | ?쒖꽦 boards 紐⑸줉         |
| POST   | /boards     | PUB  | ??board ?앹꽦 (id,title) |
| PATCH  | /boards/:id | PUB  | ?쒕ぉ/ordering ?섏젙       |
| DELETE | /boards/:id | PUB  | soft delete (deleted=1)  |

## Posts
| Method | Path                   | 沅뚰븳 | ?ㅻ챸                             |
| ------ | ---------------------- | ---- | -------------------------------- |
| GET    | /boards/:id/posts      | PUB  | 寃뚯떆??湲 紐⑸줉 + 寃??q, approx) |
| POST   | /boards/:id/posts      | PUB  | 湲 ?앹꽦(title ?꾩닔)              |
| PATCH  | /boards/:id/posts/:pid | PUB  | 湲 ?섏젙                          |
| DELETE | /boards/:id/posts/:pid | PUB  | soft delete                      |
| GET    | /posts/:pid            | PUB  | ?④굔 + views + ETag              |
| POST   | /posts/:pid/view       | PUB  | 議고쉶??踰꾪띁 利앷?                 |
| GET    | /posts-map             | PUB  | ?꾩껜 留?(罹먯떆/愿由ъ슜)            |

### 紐⑸줉 ?덉떆 ?묐떟 (遺遺?
```json
{
  "items":[{"id":"pabc","title":"泥?湲","views":10}],
  "total":1,
  "offset":0,
  "limit":30,
  "hasMore":false
}
```

## Post Drafts
| Method | Path | 권한 | 설명 |
| ------ | ---- | ---- | ---- |
| GET | /posts/drafts | AUTH | 로그인 사용자의 초안 목록을 최신순으로 반환 (`limit` 1-20, 기본 10) |
| GET | /posts/drafts/:id | AUTH | 본인 소유 초안을 단건 조회 (없으면 404) |
| POST | /posts/drafts | AUTH | 초안을 생성하고 Location 헤더(`/api/posts/drafts/:id`)를 제공합니다 |
| PUT | /posts/drafts/:id | AUTH | `If-Unmodified-Since` 헤더 기반 낙관적 잠금으로 내용과 메타데이터를 갱신 |
| DELETE | /posts/drafts/:id | AUTH | 초안을 보관(status=archived) 처리 |

- 응답 헤더: `Last-Modified` (최종 저장 시각), `X-RateLimit-Remaining-drafts`
- 레이트 리밋: 사용자별 10 req/min, 초과 시 429 `rate_limited_drafts`

## Announcements
| Method | Path               | 沅뚰븳 | ?ㅻ챸                                                 |
| ------ | ------------------ | ---- | ---------------------------------------------------- |
| GET    | /announcements     | PUB  | ?쒖꽦 + ?쒓컙李??꾪꽣                                   |
| POST   | /announcements     | MOD  | ?앹꽦 (title ?꾩닔)                                    |
| PATCH  | /announcements/:id | MOD  | 遺遺??섏젙                                            |
| DELETE | /announcements/:id | ADM  | soft delete (deleted=1, active=0) + history snapshot |

### Announcement ?앹꽦 ?묐떟 ??
```json
{
  "id":5,
  "slug":null,
  "title":"怨듭?",
  "body":"蹂몃Ц",
  "priority":50,
  "active":1,
  "deleted":0
}
```

## Events
| Method | Path                     | 沅뚰븳 | ?ㅻ챸                  |
| ------ | ------------------------ | ---- | --------------------- |
| GET    | /events?status=published | PUB  | ?곹깭 + 醫낅즺?쒓컙 ?꾪꽣  |
| POST   | /events                  | MOD  | ?앹꽦(title ?꾩닔)      |
| PATCH  | /events/:id              | MOD  | ?섏젙                  |
| DELETE | /events/:id              | ADM  | soft delete + history |

## Metrics & Health
| Method | Path              | 沅뚰븳 | ?ㅻ챸                                  |
| ------ | ----------------- | ---- | ------------------------------------- |
| GET    | /metrics          | PUB  | JSON ?고???酉??대씪?댁뼵???몄쬆 移댁슫??|
| GET    | /metrics-prom     | PUB  | Prometheus ?띿뒪???щ㎎                |
| GET    | /health?verbose=1 | PUB  | 媛꾨떒 ?곹깭 + DB latency                |
| GET    | /live             | PUB  | ?쇱씠釉뚮땲??                           |
| GET    | /ready            | PUB  | DB ready                              |

### /metrics ?듭떖 ?꾨뱶
```json
{
  "boards": 3,
  "posts": 120,
  "authLoginSuccess": 4,
  "authRefresh": 2,
  "clientMetric": {"attempts": 10, "accepted": 8}
}
```

## Error Response ?뺤떇
```json
{"error":"invalid_refresh","detail":"(dev ?섍꼍?먯꽌留?異붽?)"}
```

## Authentication ?먮쫫 (?⑥텞)
1. /auth/login/google ??authorize URL (?ㅼ젣 援ш?) ?먮뒗 mock
2. /auth/callback/google?code=... ??access/refresh 諛쒓툒
3. /auth/me (Bearer access)
4. /auth/refresh (body) ?먮뒗 /auth/refresh-cookie
5. Linking: ?먮쾲吏?provider callback + `link=1` + 湲곗〈 Bearer ??linked:true

## Rate Limit
- ?곌린: 遺꾨떦 湲곕낯 120 (?섍꼍蹂??議곗젙) 珥덇낵 ??429 `rate_limited_write`
- 寃??q ?ы븿): 遺꾨떦 湲곕낯 180  `rate_limited_search`

## Soft Delete & History ?붿빟
- ??젣 ??UPDATE deleted=1 (announcements??active=0 ?ы븿) ??history ?뚯씠釉?create/update/delete snapshot

## Versioning Note
?꾩옱 API??v1 path prefix 誘몄궗?? ?ν썑 break change ??`/api/v2` 遺꾨━ ?쒖븞.

## Change Log (?붿빟)
| 踰꾩쟾 | 蹂寃?                                                                                          |
| ---- | ---------------------------------------------------------------------------------------------- |
| 0.3  | Google PKCE, Redis refresh, moderator role, soft delete+history, audit metrics, cookie refresh |

## ?ν썑 異붽? ?덉젙
- ?ㅼ젣 GitHub/Naver/Kakao/Apple/Microsoft OAuth 肄붾뱶 援먰솚
- JWKS & ??濡쒗뀒?댁뀡
- Logout / refresh revoke endpoint
- OpenAPI ?먮룞 ?ㅽ럺 ?앹꽦

### GET /api/search
- **Query Params**: `q` (string, required), `limit` (1-100, default 20), `offset` (>=0).
- **Response**: `{ ok: boolean, query: string, count: number, total: number, offset: number, limit: number, items: Array<{ id, board, board_title?, board_icon?, title, author?, category?, created_at, updated_at }> }`.
- Returns empty list when `q` is blank and respects rate limiting (429 `rate_limited_search`).
- **Errors**: `400 bad_request` (malformed params), `404 not_found`, `429 rate_limited_search`, `500 database_error`.
- **Errors**: `400 bad_request` (malformed params), `404 not_found`, `429 rate_limited_search`, `500 database_error`.

## Attachments
| Method | Path | Access | Notes |
| ------ | ---- | ------ | ----- |
| POST | /attachments/sign | AUTH | Returns upload URL + headers (404 when feature flag disabled) |
| POST | /attachments/complete | AUTH | Records uploaded file metadata, enqueues processing job |
| GET | /attachments/:id | AUTH | Fetch attachment processing status/variants (owner or moderator/admin) |
- `/attachments/sign` request: `{ "filename": string, "mimeType": string, "size": number }`. Response contains `{ uploadUrl, method, headers, expiresAt, fileKey, contentType, bucket, region, maxSize, scanRequired, policy }`. Rate limit via `ATTACH_SIGN_RATE_LIMIT_PER_MIN`; headers `X-RateLimit-Remaining-attachments`, `Retry-After`.
- `/attachments/complete` request: `{ "fileKey": string, "mimeType": string, "size": number, "originalName"?: string, "checksum"?: string, "draftId"?: string, "postId"?: string }`. Response (`202`) includes `{ attachmentId, status, queue, sourceType, sourceId }`.
- `/attachments/:id` returns `{ attachmentId, status, variants, fileKey, mimeType, size, checksum, originalName, sourceType, sourceId, createdAt, updatedAt }`.
- Feature flags: `FEATURE_ATTACH_SIGNING_FORCE_OFF`, `FEATURE_ATTACH_SIGNING_GLOBAL`, `FEATURE_ATTACH_SIGNING`. Queue behavior controlled by `ATTACH_QUEUE_ENABLED`.

