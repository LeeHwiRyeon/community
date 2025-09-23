4. Document new env vars in API docs (`API_REFERENCE.md` / `API_USAGE.md`).
# Backend Hardening Plan

Status: Living document (initial version)
Last Updated: 2025-09-20

## 1. Completed Baseline
- Rate limiting (write/search per IP, in-memory)
- Input validation (ID pattern, title/content constraints)
- Security headers (CSP optional, frame deny, referrer policy, permissions policy)
- Sanitized error output (hide stack in production)
- READONLY mode (blocks all mutating verbs)
- Metrics: JSON + Prometheus (rate limit counters, view batching, client perf ingestion/export)
- View batching with flush backoff & metrics
- FULLTEXT + LIKE fallback search
- ETag + Last-Modified support for posts detail
- Deterministic test suite (api-strict) and security-focused suite (security-strict)
- CI script chaining (strict + readonly + security)

## 2. Threat & Reliability Focus Areas
| Area                              | Current                  | Risk                         | Priority |
| --------------------------------- | ------------------------ | ---------------------------- | -------- |
| Input sanitization (XSS)          | Basic length checks only | Stored/Reflected XSS         | HIGH     |
| Observability (latency quantiles) | Basic counters           | Blind to p95/p99 regressions | MEDIUM   |
| Data retention (soft delete GC)   | None                     | Unbounded growth             | LOW      |
| Search abuse (query flood)        | Same as rate limit       | Resource exhaustion          | MEDIUM   |
## 3. Roadmap (Phased)
### Phase A (Security & Traceability First)
### Phase B (Resilience & Observability)
5. Redis (optional) backend for rate limiting (feature-detect via ENV RATE_LIMIT_BACKEND=redis)
6. HTTP duration histogram w/ p95,p99, error rate gauges
7. View buffer persistence: snapshot every N seconds & on shutdown (fallback replay)
### Phase C (Data Integrity & Cleanup)
9. Add foreign key constraints (posts.board_id -> boards.id) + migration
### Phase D (Advanced Hardening)
12. Token rotation / JWT expansion (exp claim, roles)

## 4. Design Sketches
### 4.1 Request ID & Logging
Middleware:
- If `X-Request-Id` absent, generate UUID v4
- Attach to `res.locals.reqId`
- Log line JSON: `{ ts, level, reqId, ip, method, path, status, ms, bytesOut }`
- Provide correlation for downstream error log lines.

### 4.2 Admin Token
- ENV: `ADMIN_TOKEN` (string, required for write when set)
- Behavior:
  - If set: all mutating requests without header `x-admin-token` or mismatch -> 403 `admin_token_required`
  - If READONLY=1 and valid admin token present -> allow (maintenance override)
- Actions: `board.create`, `board.update`, `board.delete`, `post.create`, `post.update`, `post.delete`
- Rotation: new file per day; no truncation
- Future: ship to external collector

### 4.4 HTML Sanitization
Option 1 (Escape All): replace `<` `>` `&` with entities => simplest, safe
Option 2 (Allowlist): allow `<b><i><code><pre><a href>` remove others
- Config via ENV: `SANITIZE_MODE=escape|allow`
- Metrics: `sanitizeApplied` counter

### 4.5 Redis Rate Limit (Optional)
- If `RATE_LIMIT_BACKEND=redis`, connect once; key pattern: `rl:{ip}:{bucket}:{epochMinute}`
- INCR w/ EXPIRE 60; read count; compare
- Fallback to in-memory on failure (circuit breaker)

### 4.6 View Buffer Durability
- Snapshot file: `runtime/view-buffer-snap.json` every 30s (if dirty)
- On startup: load & merge counts then unlink
| Feature     | Test Case                                                |
| ----------- | -------------------------------------------------------- |
| Admin Token | Missing -> 403, valid -> 201 write success in READONLY=1 |
| Request ID  | Response header echo, unique across requests             |
 Document new env vars in `API_REFERENCE.md` / `API_USAGE.md`.
| Sanitization            | Script injection -> escaped/stripped content persisted    |
| Redis RL (if available) | Exceed threshold across restart still enforced            |
| View Snapshot           | Simulate batch increments + snapshot load restores counts |
| Slow Query              | Inject deliberate SLEEP query -> metric/log line present  |

## 6. Metrics Extensions
Add counters/gauges:
- `admin_auth_fail`
- `audit_events_total`
- `sanitize_applied_total`
- `http_requests_total{status}` + histogram w/ buckets (existing simplified logic can be extended)
- `slow_query_total` + `slow_query_last_ms`

## 7. Rollout Strategy
1. Implement Phase A incrementally (small PRs): request-id/logging -> admin token -> audit -> sanitization.
2. After each step: extend tests; keep CI green.
3. Optional components (Redis) behind env flags to avoid local friction.
4. Document new env vars in `API_REFERENCE.md` / `API_USAGE.md`.

## 8. Env Var Reference (New Planned)
| Name                | Purpose                            | Default |
| ------------------- | ---------------------------------- | ------- |
| ADMIN_TOKEN         | Protect mutating endpoints         | (unset) |
| SANITIZE_MODE       | Content sanitization strategy      | escape  |
| RATE_LIMIT_BACKEND  | Choose limiter store (in-memory    | redis)  | in-memory |
| DB_SLOW_MS          | Slow query threshold ms            | 300     |
| GC_SOFT_DELETE_DAYS | Purge soft-deleted older than days | (unset) |
| CSP_REPORT_ONLY     | Send CSP in report-only mode       | 0       |

## 9. Open Questions
- Do we need user-level accounts soon? (Impacts audit actor model)
- Should audit logs include diffs of content? (Privacy vs forensic value)
- Multi-instance deployment timeline? (Determines urgency of Redis limiter)

## 10. Next Immediate Task Suggestion
Start with Request ID + structured logging middleware; low risk, high diagnostic value.

---
(End of Plan)
