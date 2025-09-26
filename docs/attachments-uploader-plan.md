# Step 44 Delivery Plan – Attachment Uploader & Preview

## 1. Scope & Goals
- Expose a full upload lifecycle to end users editing/creating posts (drag & drop, progress, preview thumbnails, removal).
- Ensure uploaded files are validated, signed (Step 42), queued (Step 43), and surfaced back to the editor once derivatives are ready.
- Provide graceful handling for large files (progress, pause/cancel, post-upload status) and fallback messaging until Step 46 WYSIWYG lands.

## 2. Backend Deliverables
1. **Completion Webhook** – `POST /api/attachments/complete`
   - Body: `{ fileKey, originalName, mimeType, size, checksum?, draftId?, postId? }`.
   - Validations: verify signing metadata (size/type vs Step 42 limits), optional checksum.
   - Behaviour: enqueue `attachments.process` job, persist placeholder row in `attachments` table (status = `queued`).
   - Response: `{ attachmentId, status, variants: [], retryAfter? }`.
2. **Attachment Lookup API** – `GET /api/attachments/:id`
   - Returns processing status + variant URLs (populated after worker completes).
   - Include `cache-control: no-store` while processing; normal caching once ready.
3. **Schema & Model**
   - Table `attachments`: columns `id`, `file_key`, `owner_user_id`, `status`, `mime_type`, `size_bytes`, `checksum`, `source` (`draft`, `post`), `source_id`, `variants` JSON, timestamps.
   - Index on `(source, source_id)` for quick lookup from posts/drafts.
4. **Integration Hooks**
   - Draft service update to allow linking attachments to drafts (for Step 46 autosave interplay).
   - Audit logging stub (records user, file key, size) for later security review.
5. **Metrics**
   - Emit `attachmentsUploaded` counter when `/complete` accepted.
   - Reuse Step 43 runtime metrics to report active attachments per status.

## 3. Frontend Deliverables
1. **Core Component** – `frontend/src/components/AttachmentUploader.tsx`
   - Features: drag-and-drop + file picker, list of selected files with per-item progress, cancel/remove buttons, retry on failure.
   - Uses `/api/attachments/sign` to obtain upload target and performs direct upload (XHR with progress events).
   - After upload success, call `/api/attachments/complete` and poll `/api/attachments/:id` until `status === 'ready'`.
   - Emits callbacks (`onChange`, `onError`, `onProcessingUpdate`) for host forms.
2. **Preview Renderer** – `AttachmentPreviewList`
   - Renders ready variants (image thumbnail, video poster, file icon fallback), displays processing state (spinner + text), and removal control.
   - Supports accessibility (`aria-live` updates when status changes) and keyboard navigation.
3. **Page Integration**
   - Inject uploader + preview into `CreatePostPage` and `EditPostPage` forms (above content textarea for now).
   - Persist attachment selections in draft metadata (array of attachment ids) so Step 46 WYSIWYG can hydrate later.
4. **Styling & Assets**
   - Global CSS utilities for dropzone state (`--texture-panel` backgrounds) with focus/drag states.
   - Responsive layout: single column on mobile, grid on desktop.
5. **Error Handling**
   - Surface size/type errors before upload (client-side) using Step 42 config (exposed via public config endpoint or embed constants).
   - Show toast/banner on network failure with retry per file.

## 4. UX & Copy Tasks
- Strings for drag instructions, progress (`{filename} 업로드 중…`), processing (`썸네일 생성 중`), errors (rate limit, size exceeded), and removal confirmation.
- Localization placeholders for EN/KR; update `frontend/src/i18n` once structure defined.
- Draft copy for large upload guidance (link to help doc).

## 5. Testing Strategy
- **Unit**: upload helper utilities (signing, progress state reducer) via Vitest.
- **Component**: AttachmentUploader interactions using Testing Library (mock fetch + mock upload).
- **E2E**: Playwright flow – add image, wait for preview ready, publish post, ensure attachment metadata stored.
- **Backend**: supertest coverage for `/api/attachments/complete` (valid, duplicate, invalid mime/size, unauthenticated).
- **Performance**: measure upload chunking for >50MB (simulate using mock storage server) – verify UI stays responsive.

## 6. Dependencies & Sequencing
- Step 43 worker handlers need implementation before enabling ready-status polling (complete job processors; targeted next iteration).
- Step 45 will integrate queue metrics with alerting and CI tests.
- Step 46 WYSIWYG will replace textarea; current uploader must expose API compatible with future editor plugin.
- DevOps: confirm S3 bucket + KMS, update `.env.example` with queue vars.

## 7. Open Questions
- Should attachments be stored per draft or globally (allow reuse between posts)? Initial plan: scoped to draft/post id.
- Do we support simultaneous video + image uploads? (assume yes; limit 5 files per action by default.)
- Maximum concurrent uploads per user (configurable `ATTACH_MAX_CONCURRENT_UPLOADS`).

## 8. Milestones
1. **Backend MVP** – schema migration, `/complete` endpoint, job enqueue, metrics (feature-flagged) – target Day 1.
2. **Frontend Uploader Alpha** – component with progress + error states, integration on create/edit page – target Day 3.
3. **Preview + Polling** – ready status rendering, remove action, draft metadata link – target Day 4.
4. **QA & Docs** – update attachments.md usage guide, write manual QA checklist for large files – target Day 5.

_Authors: Step 44 implementation squad (frontend + backend). Updated 2025-09-26._
