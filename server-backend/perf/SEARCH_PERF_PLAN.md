# Search API Performance Plan
- Seed 10k posts via scripts/mock-seed-search.ps1 with varying titles.
- Benchmark /api/search?q=keyword with warm cache and cold cache using utocannon.
- Capture query plan (EXPLAIN) for LIKE and FULLTEXT variants.
- Record P95 latency budget (<= 120ms) and update metrics dashboard.

## Prioritized Index Candidates
| Priority | Index Name | Columns | Target Query / Endpoint | Notes |
| --- | --- | --- | --- | --- |
| P0 | t_posts_title_content | FULLTEXT(title, content) | /api/search + /boards/:id/posts (fulltext branch) | Already provisioned by schema guard; verify existence per env.
| P1 | idx_posts_board_deleted_date | (board_id, deleted, date DESC, created_at DESC) | /boards/:id/posts listing & LIKE fallback | Add via migration to avoid filesort when filtering by board.
| P2 | idx_posts_deleted_created | (deleted, created_at DESC) | /api/search global fallback ordering | Helps pagination when LIKE fallback hits many rows.
| P2 | idx_posts_category_deleted_created | (category, deleted, created_at DESC) | /api/search when filtered by category (future) | Stage once category filter shipped.

## Verification & Rollout Checklist
1. **DDL staging**: run SHOW INDEX FROM posts LIKE 'idx_posts_board_deleted_date'; create index only if absent.
2. **Explain plans**: capture EXPLAIN ANALYZE for:
   - SELECT ... WHERE board_id=? AND MATCH(...) (fulltext)
   - SELECT ... WHERE board_id=? AND title LIKE ? (fallback)
   - SELECT ... WHERE deleted=0 ORDER BY created_at (global search)
3. **Latency sampling**: enable SEARCH_SLOW_THRESHOLD_MS (default 250) and review search.query.slow warnings in logs.
4. **Runtime metrics audit**: inspect 
untimeMetrics.searchQuery* counters via /api/metrics to ensure instrumentation is emitting data post-deploy.
5. **Regression guard**: extend 
pm run test:search smoke in CI; add MySQL container job executing EXPLAIN scripts once migrations applied.

## To-do After Index Creation
- Document migration SQL in DB_SCHEMA.md and ship reversible migration script.
- Update performance dashboard with new metrics (searchQueryCount, searchQuerySlow).
- Schedule quarterly review of slow-query samples stored via getRecentSearchQuerySamples() helper.
