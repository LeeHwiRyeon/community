# Search Performance & Index Strategy

_Last updated: 2025-09-26_

## 1. Current Query Audit
- **Global search** (`GET /api/search`)
  - Filters: `deleted = 0` and `title LIKE ? OR content LIKE ?`
  - Sorting: `ORDER BY created_at DESC`
  - Pagination: `LIMIT ?, OFFSET ?`
  - Joins: none
  - Notes: currently always falls back to `%LIKE%` patterns, which cannot leverage indexes beyond prefix matches.
- **Board-scoped search** (`GET /api/boards/:id/posts`)
  - Primary path: MySQL `MATCH(title, content) AGAINST (? IN BOOLEAN MODE)` with optional tag filtering and popularity ordering (`LEFT JOIN` on `post_views`, optional aggregation from `votes`).
  - Fallback: `%LIKE%` terms ANDed together when FULLTEXT unsupported; sorted by popularity or recency.
  - Pagination: `LIMIT ? OFFSET ?`, with `LIMIT + 1` fetch to determine `hasMore`.
- **Non-search listing** (board feed without query)
  - Uses same JOIN/ORDER BY pipeline without the `MATCH` clause (still subject to ordering on `date`/`created_at`).
- **Instrumentation**
  - `runSearchQuery` funnels through `recordSearchQuery()` which logs `scope`, `strategy`, `durationMs`, `rowCount`, `usingFulltext` etc, but data currently remains in-process only.

## 2. Workload & Constraints
- Content volume expected to grow into tens of millions of rows; LIKE scans will degenerate quickly beyond ~100k rows.
- MySQL 8.x available in primary environments; some local devs still run MariaDB 10.5 (FULLTEXT limited but usable on InnoDB).
- Search results must include board metadata, optional view counts, and popularity score.
- Latency SLO: < 150 ms P95 for HOT queries, < 400 ms for cold queries. Slow query logging threshold is 250 ms via `SEARCH_SLOW_THRESHOLD_MS`.

## 3. Index Strategy
### 3.1 Core indexes (existing or required)
| Index | Status | Purpose |
| --- | --- | --- |
| `FULLTEXT ft_posts_title_content (title, content)` | Exists (best-effort) | Enables boolean-mode relevance search on title + content. |
| `PRIMARY KEY (id)` | Exists | Lookup by post id for hydration & joins. |
| `post_views.post_id` PK | Exists | Supports `LEFT JOIN post_views`. |

### 3.2 New / refined indexes
| Name | Definition | Rationale |
| --- | --- | --- |
| `idx_posts_board_deleted_created` | `CREATE INDEX idx_posts_board_deleted_created ON posts (board_id, deleted, created_at DESC, id);` | Supports board listings and board-scoped LIKE fallback with covering ordering. Including `id` keeps pagination deterministic. |
| `idx_posts_deleted_created` | `CREATE INDEX idx_posts_deleted_created ON posts (deleted, created_at DESC, id);` | Helps global search fallback and generic news feeds when FULLTEXT not available. |
| `idx_posts_title_prefix` | `CREATE INDEX idx_posts_title_prefix ON posts (title(191));` | Allows prefix search optimizations and improves relevance for short terms; safe even when FULLTEXT fails. |
| `idx_votes_target_score` | `CREATE INDEX idx_votes_target_score ON votes (target_type, target_id);` | Speeds up popularity `LEFT JOIN` aggregation by reducing table scans. |
| `idx_posts_updated` (optional) | `CREATE INDEX idx_posts_updated ON posts (updated_at DESC);` | If future ordering prefers `updated_at`, reduces filesort cost. |

> **Rollout note:** create indexes in staging first; production deployment should use `ALTER TABLE ... ALGORITHM=INPLACE, LOCK=NONE` during off-peak or in batches if table large.

## 4. Query Optimizations
1. **Promote FULLTEXT for global search**
   - Rewrite `/api/search` to use the same `MATCH ... AGAINST` pattern as board search when `ft_posts_title_content` exists.
   - Use boolean mode with term sanitization (`+term*` for prefix) and relevance thresholds to drop noise.
2. **Fallback hygiene**
   - When FULLTEXT unavailable, split query string into tokens; use indexed prefix search (`title LIKE 'term%'`) combined with `title_prefix` index before widening to `%term%`.
   - Limit fallback to `terms.length <= 5` to avoid runaway AND chains.
3. **Result hydration**
   - Fetch `board_title` via cached board map instead of `LEFT JOIN` for the global endpoint to reduce query cost (board table is tiny and can be preloaded in memory).
   - Materialize view counts separately: rely on `post_views` join only when percentile data required; otherwise use precomputed rank window refreshed periodically.
4. **Pagination**
   - Use `id` keyset pagination for board feeds (`WHERE created_at < ? OR (created_at = ? AND id < ?)`), leveraging new composite index.

## 5. Caching & Denormalization
- **Result cache**: store top-N (query, page, filters) hashes in Redis with 60–120s TTL for popular queries; invalidate on post publish/update events.
- **Board metadata cache**: maintain in-process `Map` synced from `/api/boards` to avoid repeated joins for labels/icons.
- **Popularity materialization**: schedule hourly job to write `post_popularity` table with `(post_id, score, decay_weight)`. Search can join on this small table rather than aggregating `votes` each time.
- **Autocomplete seed**: maintain `search_terms` table capturing frequent queries (from `recordSearchQuery`) for future typeahead.

## 6. Monitoring & Alerting
- Export `recordSearchQuery` samples to the analytics pipeline (`/client-metric` equivalent) so we can chart P50/P95 latency and fallback counts.
- Add counter for `usingFulltext=false` to detect regression (should trend toward zero once global endpoint migrated).
- Extend slow-query logger to include `scope` and top-level SQL signature (hash) for easier investigation.
- Set SLO alert: >5% of queries over 400 ms for 5 minutes triggers Slack `#alerts-search`.

## 7. Rollout Plan
1. **Staging prep**
   - Apply new indexes, measure query plans with `EXPLAIN`, and capture baseline metrics.
   - Update `/api/search` implementation to attempt FULLTEXT first; keep fallback path.
2. **Integration tests**
   - Add regression tests verifying FULLTEXT branch (flagged by `usingFulltext`).
   - Simulate fallback (disable index via session variable) to confirm LIKE path still works.
3. **Deployment**
   - Deploy index migration during low traffic window; monitor replication lag.
   - Deploy code changes once indexes live; enable Redis caching flag.
4. **Validation**
   - Track metrics for 48 hours; ensure slow-query count drops and CPU usage steady.
   - Update runbooks with new cache invalidation steps.

## 8. Open Questions
- Should we introduce language-specific analyzers (Korean + English) via external search service (e.g., OpenSearch) if FULLTEXT relevance proves weak?
- How aggressively should we decay popularity scores for old posts (current plan uses hourly job; need data to set decay).
- Do we need per-board custom ranking (e.g., `broadcast` weighting live streams higher)? Possibly in Phase 2 once data collected.

