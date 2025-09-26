# Attachments Worker & Cleanup Strategy (Step 43)

## 1. Goals
- Ensure uploaded files are processed (resize/transcode/thumbnail) and invalid assets are cleaned up automatically.
- Provide observability and back-pressure controls prior to enabling large media uploads.
- Keep implementation modular so we can swap storage providers or worker backends without touching API contract.

## 2. Queue Backend Evaluation
| Option | Pros | Cons | Decision |
| --- | --- | --- | --- |
| **BullMQ (Redis)** | Native Node support, built-in repeatable jobs/backoff, minimal infra (re-use Redis cluster), first-class TypeScript types | Requires persistent Redis with reliable disk (AOF/RDB), need to manage queue metrics | ✅ Preferred: reuse existing Redis footprint, aligns with realtime metrics + notification queues |
| **RabbitMQ + custom worker** | Strong routing/fanout semantics | Extra cluster to manage, higher ops overhead, not needed for current scale | ❌ |
| **Cron-only (node-cron)** | Simple to bootstrap | Hard to scale, no persistence or retry visibility | ❌ |

**Conclusion**: adopt BullMQ running against the existing Redis connection. Long running jobs will execute inside a dedicated worker process (`scripts/attachments-worker.js`).

## 3. Proposed Workflow
1. **Upload Sign** (Step 42) returns `fileKey` + metadata.
2. **Client** uploads to storage; upon completion it POSTs `/api/attachments/complete` (Step 44) with checksum + metadata.
3. **API** enqueues job `attachments.process` with payload `{ fileKey, mimeType, size, variants: [...] }`.
4. **Worker** pulls job, performs:
   - Virus re-check if `ATTACH_VSCAN_ENDPOINT` provided (fail → quarantine queue).
   - Generate derivative assets (thumbnails, webp, mp4 transcode) using `sharp`/`ffmpeg`.
   - Update DB rows (`attachments` table) with status + variant pointers.
5. **Cleanup**: repeatable job `attachments.cleanup.orphan` runs every 15 minutes, removes stale `status='uploaded'` rows older than 2h and deletes associated S3 objects.

## 4. Job Definitions
| Job | Purpose | Notes |
| --- | --- | --- |
| `attachments.process` | Per upload derivatives + metadata | Concurrency configurable, default 3 |
| `attachments.vscan.retry` | Requeue when scanner unavailable | Backoff exponential (base 2s, max 5m) |
| `attachments.cleanup.orphan` | Remove stale uploads | Repeat every 15m (configurable) |

## 5. Configuration
Environment variables (documented in `.env.example` later):
- `ATTACH_QUEUE_ENABLED` (default 1 when signing enabled)
- `ATTACH_QUEUE_CONCURRENCY=3`
- `ATTACH_WORKER_LOG_LEVEL=info`
- `ATTACH_CLEANUP_CRON=15m`

Redis keys: namespace prefix `attach:` (e.g. `attach:jobs:process`). Metrics to emit via existing Prom client (`attachments.jobs.processed`, `attachments.jobs.failed`).

## 6. Observability
- Use BullMQ event hooks to push metrics into `metrics-state.js` (success/failure, duration histogram).
- Alerting (Step 45) to watch `attachments.jobs.failed` > 5 in 10 min → Slack `#alerts-storage`.
- Add ops dashboard panels: queue depth, processing latency, cleanup duration.

## 7. Next Actions
1. Scaffold worker bootstrap (`server-backend/scripts/attachments-worker.js`) that consumes BullMQ queues.
2. Extend `LOG_SECURITY_ANALYSIS.md` with anti-virus workflow + audit logging requirements.
3. Schema update: `attachments` table with `status`, `variants` JSON, `checksum`.
4. API endpoints: `/api/attachments/complete` & `/api/attachments/:id` retrieval (Step 44+).

---
_Last updated: 2025-09-26_

## 8. Monitoring Metrics
- Runtime counters exposed via `runtimeMetrics`:
  - `attachmentsJobsCompleted`, `attachmentsJobsFailed`, `attachmentsJobsRetried`, `attachmentsCleanupRuns`.
  - `attachmentsQueueDepth` (per queue waiting/active/delayed counts) + `attachmentsQueueUpdatedAt`.
- Worker emits metrics on BullMQ events (`completed`, `failed`) and refreshes queue depth after each event.
- Alerts: if `attachmentsJobsFailed` increases by >5 in 10 minutes → Slack `#alerts-storage` (Step 45 implementation).
- Dashboard tiles:
  - Queue depth stacked bar (process vs cleanup).
  - Job failure rate (failed/completed).
  - Cleanup executions (ensure ≥4 per hour).

