# 첨부 파일 처리 설계 (Phase 1 Step 13-17)

## 1. 스토리지/정책/환경변수 (Step 13)
- 기본 스토리지: 로컬 개발은 `uploads/`, 운영은 S3 (`ATTACH_BUCKET`, `ATTACH_REGION`).
- 업로드 허용 확장자: 이미지(jpg,png,gif,webp), 영상(mp4,webm), 오디오(mp3,wav), 문서(pdf).
- 최대 용량: 기본 25MB, 관리자(ROLE=moderator 이상)는 200MB.
- 환경 변수: `ATTACH_MAX_SIZE_MB`, `ATTACH_ALLOWED_TYPES`, `ATTACH_VSCAN_ENDPOINT`.
- 서명 만료 시간: 5분. 업로드 완료 후 콜백으로 메타데이터 저장.

## 2. 업로드 서명 & 검증 (Step 14)
- 엔드포인트: `POST /api/attachments/sign`
  - 입력: { filename, mimeType, size }
  - 검증: MIME 화이트리스트 + 크기 제한 + 파일명 normalization.
  - 응답: { uploadUrl, headers, fileKey, expiresAt }
- 미들웨어: `validateAttachmentRequest`, `requireAuth`
- 바이러스 스캔: ClamAV REST 연동 (`ATTACH_VSCAN_ENDPOINT`). 업로드 완료 후 스캔 결과가 `clean`이 아닐 때는 파일 삭제 + 사용자 알림.

## 3. 비동기 처리/워커 (Step 15)
- 워커 큐: `attachment_jobs`
- 작업 종류: `thumbnail.generate`, `video.transcode`, `cleanup.orphan`
- 실행 환경: Node worker + sharp/ffmpeg 래퍼.
- 구성: 업로드 완료 -> enqueue thumbnail job -> S3에 썸네일 저장 -> 메타데이터 업데이트.
- 모니터링: `attachments.job.duration`, `attachments.job.failure` 메트릭 + DLQ 알림.

## 4. 프론트 UX & 본문 렌더러 (Step 16)
- `AttachmentUploader` 컴포넌트: 드래그&드롭 영역 + 파일 리스트 + 진행률 바.
- 실패 시 재시도 버튼, 업로드 취소 제공.
- 본문 렌더러: 이미지 lazy-loading, 비디오 HLS 플레이어, 오디오 mini-player, 외부 링크 카드(Open Graph 추출).
- 접근성: 파일 리스트는 `<ul role="list">`, 진행률은 `aria-valuenow` 표시.

## 5. 정리 및 테스트 (Step 17)
- 고아 파일 정리: 하루 1회 `cleanup.orphan` 잡 실행, DB 메타데이터에 없는 S3 객체 삭제.
- 테스트: 단위(서명 미들웨어), 통합(업로드→메타 저장), e2e(대용량 업로드).
- QA 체크리스트: 2G 네트워크 시뮬레이션, 중단 후 재개, 모바일 사파리 업로드.
- 알림: 실패 누적 3회 이상 시 Slack `#alerts-storage` 채널.


## Step 42 ? Upload Signing API (Implementation Notes)
- Worker strategy draft: `docs/attachments-worker-strategy.md` (BullMQ + cleanup jobs).
- Endpoint: `POST /api/attachments/sign` (auth required, 404 when feature flag disabled).
- Request payload example:
  ```json
  { "filename": "banner.png", "mimeType": "image/png", "size": 123456 }
  ```
- Response payload example:
  ```json
  {
    "uploadUrl": "https://upload.dev/mock?key=attachments/42/20250926-abcdef.png",
    "method": "PUT",
    "headers": { "content-type": "image/png", "x-mock-signature": "..." },
    "expiresAt": "2025-09-26T04:10:00.000Z",
    "fileKey": "attachments/42/20250926-abcdef.png",
    "contentType": "image/png",
    "bucket": "community-attachments",
    "region": "local-dev-1",
    "maxSize": 5242880,
    "scanRequired": false,
    "policy": { "allowedTypes": ["image/jpeg", "image/png", "video/mp4"], "expiresInSec": 600 }
  }
  ```
- Validation: filename sanitised (`[^A-Za-z0-9._-]` ? `-`), MIME type must match allow-list (`ATTACH_ALLOWED_TYPES` or defaults), size must be >0 and ? `ATTACH_MAX_SIZE_MB` (25 MB default, 200 MB for moderator/admin).
- Rate limit: `ATTACH_SIGN_RATE_LIMIT_PER_MIN` (default 20) exposes `X-RateLimit-Remaining-attachments` and `Retry-After` headers on 429.
- Feature toggle hierarchy: `FEATURE_ATTACH_SIGNING_FORCE_OFF` ? `FEATURE_ATTACH_SIGNING_GLOBAL` ? `FEATURE_ATTACH_SIGNING`; dev auto-enable when `USE_MOCK_DB=1` or `NODE_ENV` ? production.
- Security TODO: replace mock signer with KMS-backed flow, persist audit log, and invoke malware scanner (`ATTACH_VSCAN_ENDPOINT`) before publish (see `LOG_SECURITY_ANALYSIS.md`).
- DevOps follow-up: confirm S3 bucket/KMS alias names and log retention policy before enabling `FEATURE_ATTACH_SIGNING_GLOBAL`.

## Step 44 – Frontend Uploader & Preview (In Progress)
- Completion webhook: `POST /api/attachments/complete` (auth required).
  - Body: `{ "fileKey": string, "mimeType": string, "size": number, "originalName"?: string, "checksum"?: string, "draftId"?: string, "postId"?: string }`.
  - Response (`202 Accepted`): `{ attachmentId, status, queue, sourceType, sourceId }`.
  - Revalidates size/type via Step 42 helper, stores `attachments` row, and enqueues BullMQ processing job (disabled in mock/dev when queue flag is off).
- Status lookup: `GET /api/attachments/:id` (auth, owner or moderator/admin).
  - Returns processing state, variants array (empty until worker finishes), and timestamps.
- Schema snippet (`attachments` table): columns `file_key`, `owner_user_id`, `status`, `mime_type`, `size_bytes`, `checksum`, `original_name`, `source_type`, `source_id`, `metadata`, `variants`, `error_message`.
- Queue + cleanup pipeline described in `docs/attachments-worker-strategy.md`.
- Frontend uploader plan: see `docs/attachments-uploader-plan.md`.

## Step 45 – Testing & CI Progress

### Integration Tests
- Command: `node --test server-backend/tests/e2e/attachments-signing.spec.js`
- Command: `node --test server-backend/tests/e2e/attachments-complete.spec.js`
- Coverage: auth guard enforcement, file key validation, completion lifecycle + lookup, invalid payload handling.

### Manual QA Checklist (Large Upload Focus)
1. Upload a 5 MB image (JPEG) and confirm the row reaches `Ready` with preview thumbnail.
2. Upload a file above the configured limit and verify the size exceeded error surfaces in both the row and global toast.
3. Upload an image and a video concurrently and confirm both progress bars update independently and the list respects the maximum item count.
4. Throttle the network to simulate slow completion; ensure the status flows through Uploading → Completing → Processing before finishing.
5. Force a network failure mid-upload (offline mode) and confirm the row moves to the error state with a Retry button and toast.
6. Retry the failed upload and verify the progress resets and the second attempt succeeds.
7. Remove an in-progress attachment and make sure it disappears from the list and is not persisted when the draft reloads.
8. Reload a draft with saved attachments metadata to confirm previously uploaded items hydrate with their stored status and variants.
