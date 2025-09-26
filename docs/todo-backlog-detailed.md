### Draft & Auto-save (Steps 40-41)
1. **Step 40 – Conflict UX Delivery** (see docs/post-draft-conflict-ux.md)
   - *Goal*: design and document multi-device conflict handling for drafts.
   - *Subtasks*:
     - Audit existing auto-save behavior in `frontend/src/hooks/useDraftAutoSave.ts` (conflict path). Summarize current logic in `docs/post-draft.md`.
     - Draft modal/inline warning copy (Korean + English). Add to new doc section `docs/post-draft.md#conflict-ux`.
     - Figma flow (mobile + desktop) with CTA states (Retry, Keep local, Download). Capture link in backlog table.
     - Review with product/QA, capture sign-off checklist (expected response times, analytics events).
   - *Dependencies*: design resources, translation review, analytics instrumentation plan.

2. **Step 41 – Auto-save Testing & Monitoring** (see `docs/post-draft-testing-monitoring.md`)
   - *Goal*: ensure auto-save reliability + alerting before launch.
   - *Subtasks*:
     - ✅ Vitest coverage (`frontend/src/hooks/__tests__/useDraftAutoSave.test.tsx`) covering create/conflict/rate limit paths.
     - ✅ Implement Playwright scenario: start edit, simulate conflict (mock response 409), verify UI messaging.
     - ✅ Create alert routing spec: new metric `drafts.save.failure` -> Slack `#alerts-content`, fallback email.
     - ✅ Update `docs/post-draft.md#testing` with test matrix (unit, integration, manual) and owners.
   - *Dependencies*: test environment with mock DB, alert infrastructure (Redis/Prometheus availability).

### Attachments Pipeline (Steps 42-45)
1. **Step 42 – Upload Signing API**
   - ✅ Define API contract in `docs/attachments.md` (request payload, allowed mime types, rate limits).
   - ✅ Scaffold Express route (`server-backend/src/routes.js`) behind feature flag, returning mock signature.
   - ✅ Implement middleware skeleton for security checks (size, mime) referencing `security-plan.md`.
   - ⬜ Coordinate with DevOps on key storage (AWS KMS / Vault) and log retention policy (documented follow-up in attachment notes).

2. **Step 43 – Worker & Cleanup Strategy**
   - ✅ Evaluate queue options (BullMQ vs cron). Document pros/cons + ops requirements in `docs/attachments-worker-strategy.md`.
   - ✅ Design workflow: upload -> fanout -> resize -> cleanup; include retry/backoff logic.
   - ✅ Draft monitoring requirements (queue depth alerts, S3 orphan report) → metrics documented in `docs/attachments-worker-strategy.md#8-monitoring-metrics`.

3. **Step 44 – Frontend Uploader & Preview**
   - ✅ ~~Backend completion API + attachments table (see `docs/attachments-uploader-plan.md#2-backend-deliverables`).~~
   - ✅ ~~Build AttachmentUploader component with drag-and-drop, progress, retry states.~~
   - ✅ ~~Render attachment previews and persist selection into draft metadata.~~
   - ✅ ~~Finalize UX copy/localization + large upload QA checklist before release.~~
   - ⬜ Coordinate with Step 46 WYSIWYG integration to ensure uploader API compatibility.


4. **Step 45 – Testing & CI**
   - ✅ ~~Write integration tests for upload round-trip (mock storage).~~
   - ✅ ~~Add large file manual QA checklist to `docs/attachments.md`.~~
   - Configure CI stage to run new tests + notify on failures.

### WYSIWYG Authoring (Steps 46-48)
1. **Step 46 – Editor Wrapper Implementation**
   - Evaluate editor libraries (Tiptap, Slate, Lexical). Update comparison table in `docs/editor-wysiwyg.md`.
   - Prototype base toolbar + heading/bold/italic using chosen stack.
   - Run accessibility audit: keyboard navigation, ARIA roles, screen reader instructions.
   - Document theming requirements (light/dark) + i18n.

2. **Step 47 – Advanced Blocks**
   - Implement embed block (YouTube/Twitter) with oEmbed fallback.
   - Code block with syntax highlighting + copy button (Prism.js plan).
   - Table block: merge/split cell interactions; mobile responsive spec.
   - Add i18n strings for block labels; ensure translation placeholders.

3. **Step 48 – Serialization & Regression**
   - Define canonical JSON schema for editor content; align with backend storage format.
   - Implement serialization/deserialization with migration utilities.
   - Build regression test harness (snapshot diff + visual regression using Playwright screenshot diff).
   - Report weekly metrics: parse errors, client-side validation failures.

### Metadata & UX Enhancements (Steps 49-52)
1. **Step 49 – Taxonomy API**
   - Expand ERD (`DB_SCHEMA.md`) with taxonomy tables.
   - Define API endpoints (`/api/taxonomy` list/search) + validation rules.
   - Prepare monitoring plan (invalid tag submissions, abuse detection).

2. **Step 50 – Metadata UX & SEO History**
   - Update editor side panel with live validation messages.
   - Auto-generate SEO description (keyword extraction). Document heuristics.
   - Store history snapshots; add admin audit view design.

3. **Step 51 – Preview Mode & Feedback**
   - Align preview layout with published page styling (CSS audit).
   - Display auto-save status badges in preview header.
   - Update user guide (`news-manuals`) with “Preview + Draft” section.

4. **Step 52 – Shortcut & Templates**
   - Define keyboard shortcut catalogue; include conflict resolution with browser defaults.
   - Implement templating API (CRUD) + UI for applying templates.
   - Document safe template sharing (permissions, versioning).

### Advanced Authoring & Scheduling (Steps 53-54)
- **Step 53**: Collaboration roles, scheduled publishing flow, and version diff UI. Deliver technical spec + prototype.
- **Step 54**: Review workflow automation, SEO suggestions (internal tool or API integration). Define roll-out plan + training.

### Quality, Security, Social (Steps 55-59)
- **Step 55**: Accessibility backlog – finalize automation tooling (axe-core, pa11y) + manual audit cadence.
- **Step 56**: Security hardening – implement XSS sanitization pipeline, file scanning integration, load tests for rate limits.
- **Step 57**: Moderator tooling – spec moderation dashboard, audit trails, regression test coverage.
- **Step 58**: Follow feature rollout – backend endpoints, notification integration, training materials, metrics.
- **Step 59**: Tags & search phase 2 – finalize analytics dashboard, cache tuning, prepare Phase 2 kickoff report.









