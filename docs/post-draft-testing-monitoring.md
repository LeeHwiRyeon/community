# Draft Auto-save Testing & Monitoring (Step 41)

## 1. Unit Tests (Vitest)
- Latest run: 2025-09-26 via `npm run test -- src/hooks/__tests__/useDraftAutoSave.test.tsx`
- Location: `frontend/src/hooks/__tests__/useDraftAutoSave.test.tsx`
- Coverage summary:
  - Creates a fresh draft, receives a 201 response, and moves the controller to the `saved` state.
  - Handles a 409 response by moving to `conflict`, keeping `conflictDraft`, and emitting analytics events.
  - Handles a 429 response by moving to `error`, tagging the reason as `rate_limited`, and backing off retries.
- Command: `npm run test -- src/hooks/__tests__/useDraftAutoSave.test.tsx`

## 2. Playwright Scenario (Draft Conflict)
- Status: Implemented in `server-backend/tests/e2e/draft-conflict.spec.ts`.
- Scenario outline:
  - Loads the create-post page.
  - Intercepts the draft create call (201) and the next save call (409) to simulate an external edit.
  - Verifies the draft status moves to `conflict`, the warning banner is rendered, and the `drafts.metric` event contains `http_conflict`.
  - Resolves the conflict by letting the follow-up PUT succeed and checks that the status returns to `saved`.
- Local run instructions:
  1. Build the frontend and ensure dependencies are installed: `cd frontend && npm install` (once per machine).
  2. Launch the preview server in one terminal: `npm run preview -- --host 127.0.0.1 --port 4173`.
  3. In another terminal (from repository root) run `npx playwright test draft-conflict.spec.ts --project=chromium --config=server-backend/playwright.config.js`.
  4. Optionally override `FRONTEND_BASE_URL` if the preview server runs on a different host/port.

## 3. Monitoring & Alerts
- Metric source: `useDraftAutoSave` dispatches `drafts.metric` events with `{ name, status, error, reason, origin, boardId, draftId, timestamp, httpStatus? }`.
- Event collector: `frontend/src/analytics/drafts-metric-listener.ts` forwards the payload to `POST /client-metric` and tags it as `drafts.save.failure`.
- Routing rules:
  | reason | Aggregation window | Notification | Notes |
  | --- | --- | --- | --- |
  | conflict_warning | ≥3 events within 5 minutes | Slack #alerts-content (warning) | Indicates simultaneous editing; share conflict UX playbook. |
  | http_conflict | Same draft hits twice within 2 minutes | Slack #alerts-content (critical) + PagerDuty (low) | Product Ops coordinates manual reconciliation. |
  | rate_limited | >20 events across org within 10 minutes | DataDog dashboard + weekly digest | Review throttling rules or recent traffic spikes. |
  | load_failed | >5 unique drafts within 10 minutes | Slack #alerts-backend | Likely API outage or auth issue. |
  | save_failed | Error rate >2% (rolling 15 minutes) | PagerDuty (medium) + email to eng leads | Covers network or server errors. |
- Alert ownership: Platform Engineering on-call triages real-time alerts; Product Ops receives the DataDog digest each Monday.
- Follow-up SLA: acknowledge within 15 minutes (business hours) and file an incident/TODO if unresolved after 30 minutes.

## 4. Documentation Updates
- `docs/post-draft.md#4.5-testing-and-monitoring` now references this page for the full test and alert matrix.
- Update `FEATURES.md` Step 41 when Playwright smoke run and alert routing are green in staging.
