# 珥덉븞 ???湲곕뒫 ?ㅺ퀎 (Phase 1 Step 08-12)

## 1. ?뺤콉 諛??섎챸 二쇨린 (Step 08)
- ?먮룞 ???二쇨린: ?낅젰 蹂寃?媛먯? ??20珥?debounce, ?낅젰 ?녿뒗 ?곹깭 5遺?吏????以묐떒.
- 蹂댁〈 湲고븳: 理쒖떊 20媛?珥덉븞 ?좎?, 30??寃쎄낵 ????젣 諛곗튂濡??뺣━.
- ?숈떆 ?몄쭛 ?뺤콉: 媛??理쒓렐 ??μ옄媛 ?곗꽑, ??꾩뒪?ы봽 鍮꾧탳濡?寃쎄퀬.
- 臾몄꽌???꾩튂: `docs/post-draft.md` (?꾩옱 臾몄꽌) + ?댁쁺 ?몃뱶遺?留곹겕 ?덉젙.

## 2. ?곗씠???ㅽ궎留?諛?TTL ?꾨왂 (Step 09)
```
post_drafts
- id BIGINT PK AUTO_INCREMENT
- post_id VARCHAR(64) NULL (寃뚯떆 ?덉젙 湲怨??곌껐)
- author_id BIGINT FK users.id
- title TEXT
- content MEDIUMTEXT
- metadata JSON NULL (移댄뀒怨좊━, ?쒓렇 ??
- status ENUM('active','archived','conflict') DEFAULT 'active'
- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
- expires_at TIMESTAMP GENERATED ALWAYS AS (updated_at + INTERVAL 30 DAY)

INDEX post_drafts_author_updated_idx (author_id, updated_at DESC)
INDEX post_drafts_expires_idx (expires_at)
```
MariaDB 10.5 ?댁긽 ?섍꼍?먯꽌 ?대깽???ㅼ?以꾨윭 ?먮뒗 諛곗튂 ?≪쑝濡?`expires_at < NOW()` ?덉퐫?쒕? ?쒓굅?⑸땲??

## 3. REST API ?ㅺ퀎 (Step 10)
| Method | Path | ?ㅻ챸 |
| --- | --- | --- |
| GET | `/api/posts/drafts` | 濡쒓렇???ъ슜?먯쓽 珥덉븞 紐⑸줉, ?섏씠吏?(湲곕낯 10媛? |
| GET | `/api/posts/drafts/:id` | ?⑥씪 珥덉븞 議고쉶. 沅뚰븳 泥댄겕: author 蹂몄씤 ?먮뒗 ?몄쭛 沅뚰븳 |
| POST | `/api/posts/drafts` | 珥덉븞 ?앹꽦. body: { title, content, metadata } |
> 2025-09-27: Step 38
> 2025-09-27: Step 39 ?꾨줎??Create/Edit ?먮뵒?곗뿉 ?먮룞 ???猷⑦봽(useDraftAutoSave)? ?곹깭 諛곗?媛 ?곌껐?섏뿀?듬땲?? 諛깆뿏???쇱슦??`/api/posts/drafts*`)? Jest ?⑥쐞 ?뚯뒪??`server-backend/tests/unit/post-drafts.test.js`)媛 諛고룷?섏뿀?듬땲??

| PUT | `/api/posts/drafts/:id` | 珥덉븞 ?낅뜲?댄듃. optimistic locking??`If-Unmodified-Since` ?ㅻ뜑 ?ъ슜 |
| DELETE | `/api/posts/drafts/:id` | 珥덉븞 ??젣 (soft delete: status=archived) |

?묐떟?먮뒗 `conflict_warning` ?뚮옒洹??숈떆 ?몄쭛 媛먯? ??瑜??ы븿?⑸땲?? ?몄쬆? JWT 湲곕컲 ?몄뀡 ?ъ슜. rate limit: 10 req/min.

## 4. ?꾨줎?몄뿏???곹깭 諛??먮룞 ???(Step 11)
- `useDraftStore` ?낆뿉??濡쒖뺄 ?곹깭 + ?쒕쾭 ?숆린??
- ?먮룞 ???猷⑦봽: `setInterval` ???`requestIdleCallback` fallback, debounce 20珥? ?ㅽ뙣 ??exponential backoff (理쒕? 5遺?.
- 異⑸룎 媛먯?: `serverUpdatedAt > localUpdatedAt`?대㈃ 紐⑤떖 ?쒓났(李⑥씠 diff UI??異뷀썑).
- ?꾩떆 ????쒖떆: ?먮뵒???곷떒??"留덉?留????HH:MM" 諛곗? ?쒖떆.

## 5. ?뚯뒪??諛?紐⑤땲?곕쭅 (Step 12)
- ?⑥쐞 ?뚯뒪?? draft reducer, debounce 濡쒖쭅, conflict detector.
- ?듯빀 ?뚯뒪?? API CRUD + 沅뚰븳 泥댄겕. Playwright ?쒕굹由ъ삤(?묒꽦 ???덈줈怨좎묠 ??蹂듭썝).
- 紐⑤땲?곕쭅: `drafts.save.success`, `drafts.save.failure`, `drafts.conflict.detected` 硫뷀듃由?
- ?뚮┝: 5遺꾧컙 ?ㅽ뙣 5???댁긽 ??Slack `#alerts-content` 梨꾨꼸??寃쎈낫.
## 4.5 테스트 & 모니터링 (Step 41)
- 유닛 테스트: `frontend/src/hooks/__tests__/useDraftAutoSave.test.tsx`
  - 초안 생성 → 자동 저장 확인
  - 409 충돌 → 모달/배너 대응 확인
  - 429 레이트리밋 → 오류 배너 확인
- 계획된 Playwright 시나리오: `draft-conflict.spec.ts` (세션 A/B 충돌 재현)
- 모니터링: `drafts.save.failure` 지표 수집, Slack #alerts-content, 이메일 요약.
- 세부 계획: `docs/post-draft-testing-monitoring.md`
- 濡쒓렇 蹂댁〈: ?ㅽ뙣 payload (200諛붿씠???댄븯) 留덉뒪????湲곕줉.
## 4.1 Conflict Handling Notes (Step 40 in progress)
- Optimistic locking uses the `If-Unmodified-Since` header populated from the last successful `updated_at` (or `created_at`) timestamp.
- When the API answers with `conflict_warning: true`, the hook keeps the latest local snapshot but moves the controller state to `status="conflict"`, exposes the server draft through `conflictDraft`, and records a `drafts.save.failure` metric with reason `conflict_warning`.
- A hard HTTP 409 response (caused by another client committing newer content) also sets `status="conflict"` and stores the conflicting server payload (`error.data.draft`) so the UI can render a comparison.
- Both paths leave the draft id and snapshot intact; the caller must decide whether to reopen the remote version or force an overwrite.
- 404 responses clear the local storage record (draft deleted elsewhere) and return the controller to `idle` with `error="load_failed"`.
- Each failure path emits `drafts.save.failure` with reason codes: `conflict_warning`, `http_conflict`, `rate_limited`, `save_failed`, or `load_failed` to feed Step 41 alerting.

### Open items for Step 40
1. ~~Draft inline/modal copy (KO/EN) that references the two conflict surfaces above.~~ (2025-09-27 Docs updated)
2. Link final Figma flow (desktop + mobile) illustrating retry vs. keep-local vs. download fallback. (docs/post-draft-conflict-ux.md §9 captures requirements; awaiting design share URL)
3. Schedule sign-off with Product & QA on analytics/alert routing (see docs/post-draft-testing-monitoring.md §3); target meeting 2025-10-02.


