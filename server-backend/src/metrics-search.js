import logger from './logger.js';
import { runtimeMetrics } from './metrics-state.js';

const SLOW_THRESHOLD_MS = parseInt(process.env.SEARCH_SLOW_THRESHOLD_MS || '250', 10);
const HISTORY_LIMIT = Math.max(1, parseInt(process.env.SEARCH_METRICS_HISTORY || '25', 10));
const history = [];

function sanitizeMeta(meta = {}) {
  const clampText = (value, max = 120) => {
    if (typeof value !== 'string') return value === undefined ? undefined : String(value).slice(0, max);
    return value.length > max ? `${value.slice(0, max)}...` : value;
  };

  return {
    ts: Date.now(),
    scope: meta.scope || 'global',
    strategy: meta.strategy || 'unknown',
    boardId: meta.boardId || null,
    limit: meta.limit ?? null,
    offset: meta.offset ?? null,
    durationMs: typeof meta.durationMs === 'number' ? Number(meta.durationMs.toFixed(3)) : null,
    rowCount: typeof meta.rowCount === 'number' ? meta.rowCount : null,
    ok: meta.ok !== false,
    error: meta.error ? clampText(meta.error, 80) : undefined,
    query: meta.query ? clampText(meta.query, 80) : undefined,
    usingFulltext: meta.usingFulltext ?? undefined
  };
}

export function recordSearchQuery(meta = {}) {
  const entry = sanitizeMeta(meta);

  runtimeMetrics.searchQueryCount = (runtimeMetrics.searchQueryCount || 0) + 1;
  runtimeMetrics.searchQueryDurationTotal = (runtimeMetrics.searchQueryDurationTotal || 0) + (entry.durationMs || 0);
  if (!runtimeMetrics.searchQueryPeakMs || (entry.durationMs || 0) > runtimeMetrics.searchQueryPeakMs) {
    runtimeMetrics.searchQueryPeakMs = entry.durationMs || 0;
  }

  if (!entry.ok) {
    runtimeMetrics.searchQueryFailures = (runtimeMetrics.searchQueryFailures || 0) + 1;
  }

  if ((entry.durationMs || 0) >= SLOW_THRESHOLD_MS) {
    runtimeMetrics.searchQuerySlow = (runtimeMetrics.searchQuerySlow || 0) + 1;
    logger.warn('search.query.slow', {
      scope: entry.scope,
      strategy: entry.strategy,
      boardId: entry.boardId,
      durationMs: entry.durationMs,
      rowCount: entry.rowCount,
      query: entry.query,
      error: entry.error
    });
  }

  history.push(entry);
  while (history.length > HISTORY_LIMIT) history.shift();
}

export function getRecentSearchQuerySamples() {
  return history.slice();
}

