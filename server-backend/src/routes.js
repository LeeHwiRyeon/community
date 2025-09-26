import { query } from './db.js';
import 'seedrandom'; // deterministic seeding support for mock generator when seed provided
import { performance } from 'node:perf_hooks';
import { recordSearchQuery } from './metrics-search.js';
import { requireAdmin, requireModOrAdmin } from './auth/jwt.js';
import { bufferViewIncrement, __flushAllViewsForTest } from './server.js';
import express from 'express';
import { getClientMetricBuffer } from './metrics-client-buffer.js';
import { isRedisEnabled, zRevRange, lPush, lRange, lTrim, publish } from './redis.js';
import { isMockDatabaseEnabled, listBoards as mockListBoards, listCategories as mockListCategories, getPostsPage as mockGetPostsPage, getAllPostsPage as mockGetAllPostsPage, getPostById as mockGetPostById, incrementViews as mockIncrementViews, getTrending as mockGetTrending, getHomeAggregate as mockGetHomeAggregate, createPost as mockCreatePost, updatePost as mockUpdatePost, deletePost as mockDeletePost, mockSearch, mockGeneratePosts, mockResetPosts, mockStatus, getMetricsSummary as mockGetMetricsSummary, BOARD_ICON_MAP } from './mock-data-provider.js';
import { applyActivityEvent, getProfileOverview, getProfileProgress, acknowledgeProfileNotifications } from './services/profile/profile-progress-service.js';
import { listDraftsForAuthor, getDraftById, createDraftForAuthor, updateDraftForAuthor, archiveDraftForAuthor } from './services/posts/post-drafts-service.js';
import { getAttachmentConfig, isAttachmentSigningEnabled, validateAttachmentRequest } from './services/attachments/upload-signing-service.js';
import { createAttachmentRecord, getAttachmentById, enqueueAttachmentProcessing } from './services/attachments/attachments-service.js';
import { SAMPLE_TITLES, SAMPLE_SNIPPETS, SAMPLE_AUTHORS, SAMPLE_CATEGORIES, SAMPLE_THUMBS, mockRandInt as randInt, mockPick as pick, mockRandomId as randomId } from './mock-samples.js';
const router = express.Router();
const useMockDb = isMockDatabaseEnabled();

const PROFILE_CACHE_TTL_MS = 60 * 1000;
const profileCache = new Map();
const profileProgressCache = new Map();

const DRAFT_RATE_LIMIT_PER_MIN = parseInt(process.env.DRAFT_RATE_LIMIT_PER_MIN || '10', 10);
const DRAFT_RATE_WINDOW_MS = 60 * 1000;
const draftRateBuckets = new Map();
const mockDraftState = { seq: 1, byUser: new Map() };

const ATTACH_SIGN_RATE_LIMIT_PER_MIN = parseInt(process.env.ATTACH_SIGN_RATE_LIMIT_PER_MIN || '20', 10);
const ATTACH_SIGN_RATE_WINDOW_MS = 60 * 1000;
const attachmentSignRateBuckets = new Map();

function resolveRequestUser(req) {
    if (req.user) return req.user;
    if (useMockDb) {
        const headerId = req.headers['x-mock-user-id'] || req.headers['x-test-user-id'];
        if (!headerId) return null;
        const id = Number.parseInt(headerId, 10);
        if (!Number.isFinite(id) || id <= 0) return null;
        const displayName = req.headers['x-mock-user-name'] || `mock-user-${id}`;
        const mockUser = { id, display_name: displayName, role: 'user' };
        req.user = mockUser;
        return mockUser;
    }
    return null;
}

function ensureAuthenticatedUser(req, res) {
    const user = resolveRequestUser(req);
    if (!user) {
        res.status(401).json({ error: 'auth_required' });
        return null;
    }
    return user;
}

function ensureDraftAuth(req, res) {
    return ensureAuthenticatedUser(req, res);
}

function consumeDraftRateLimit(userId) {
    if (!DRAFT_RATE_LIMIT_PER_MIN || DRAFT_RATE_LIMIT_PER_MIN <= 0) {
        return { allowed: true, remaining: Number.POSITIVE_INFINITY, retryAfterSec: 0 };
    }
    const now = Date.now();
    let bucket = draftRateBuckets.get(userId);
    if (!bucket || now - bucket.start >= DRAFT_RATE_WINDOW_MS) {
        bucket = { count: 0, start: now };
        draftRateBuckets.set(userId, bucket);
    }
    bucket.count += 1;
    const remaining = Math.max(0, DRAFT_RATE_LIMIT_PER_MIN - bucket.count);
    const allowed = bucket.count <= DRAFT_RATE_LIMIT_PER_MIN;
    const retryAfterSec = allowed ? 0 : Math.ceil((bucket.start + DRAFT_RATE_WINDOW_MS - now) / 1000);
    return { allowed, remaining, retryAfterSec };
}

function applyDraftRateLimit(res, userId) {
    const outcome = consumeDraftRateLimit(userId);
    if (Number.isFinite(outcome.remaining)) {
        res.setHeader('X-RateLimit-Remaining-drafts', String(Math.max(0, outcome.remaining)));
    }
    if (!outcome.allowed && outcome.retryAfterSec > 0) {
        res.setHeader('Retry-After', String(outcome.retryAfterSec));
    }
    return outcome;
}

function consumeAttachmentSignRateLimit(userId) {
    if (!ATTACH_SIGN_RATE_LIMIT_PER_MIN || ATTACH_SIGN_RATE_LIMIT_PER_MIN <= 0) {
        return { allowed: true, remaining: Number.POSITIVE_INFINITY, retryAfterSec: 0 };
    }
    const now = Date.now();
    let bucket = attachmentSignRateBuckets.get(userId);
    if (!bucket || now - bucket.start >= ATTACH_SIGN_RATE_WINDOW_MS) {
        bucket = { count: 0, start: now };
        attachmentSignRateBuckets.set(userId, bucket);
    }
    bucket.count += 1;
    const remaining = Math.max(0, ATTACH_SIGN_RATE_LIMIT_PER_MIN - bucket.count);
    const allowed = bucket.count <= ATTACH_SIGN_RATE_LIMIT_PER_MIN;
    const retryAfterSec = allowed ? 0 : Math.ceil((bucket.start + ATTACH_SIGN_RATE_WINDOW_MS - now) / 1000);
    return { allowed, remaining, retryAfterSec };
}

function applyAttachmentSignRateLimit(res, userId) {
    const outcome = consumeAttachmentSignRateLimit(userId);
    if (Number.isFinite(outcome.remaining)) {
        res.setHeader('X-RateLimit-Remaining-attachments', String(Math.max(0, outcome.remaining)));
    }
    if (!outcome.allowed && outcome.retryAfterSec > 0) {
        res.setHeader('Retry-After', String(outcome.retryAfterSec));
    }
    return outcome;
}

function parseDraftLimit(value) {
    const num = Number.parseInt(value, 10);
    if (Number.isNaN(num) || num <= 0) return 10;
    return Math.min(num, 20);
}

function parseDraftOffset(value) {
    const num = Number.parseInt(value, 10);
    if (Number.isNaN(num) || num < 0) return 0;
    return num;
}

function sanitizeMockMetadata(input) {
    if (input == null) return null;
    if (typeof input === 'string') {
        try {
            return JSON.parse(input);
        } catch {
            return { value: input };
        }
    }
    if (typeof input === 'object') {
        try {
            return JSON.parse(JSON.stringify(input));
        } catch {
            return null;
        }
    }
    return null;
}

function getMockDraftBucket(userId) {
    const key = String(userId);
    let bucket = mockDraftState.byUser.get(key);
    if (!bucket) {
        bucket = new Map();
        mockDraftState.byUser.set(key, bucket);
    }
    return bucket;
}

function cloneMockDraft(draft) {
    return {
        ...draft,
        metadata: draft.metadata == null ? null : sanitizeMockMetadata(draft.metadata)
    };
}

function listMockDrafts(userId) {
    const bucket = getMockDraftBucket(userId);
    return Array.from(bucket.values())
        .filter((draft) => draft.status !== 'archived')
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .map(cloneMockDraft);
}

function createMockDraft(userId, payload = {}) {
    const id = mockDraftState.seq++;
    const now = new Date();
    const draft = {
        id: String(id),
        post_id: payload?.post_id ? String(payload.post_id).slice(0, 64) : null,
        author_id: userId,
        title: typeof payload?.title === 'string' ? payload.title : '',
        content: typeof payload?.content === 'string' ? payload.content : '',
        metadata: sanitizeMockMetadata(payload?.metadata),
        status: 'active',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        expires_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        conflict_warning: false
    };
    getMockDraftBucket(userId).set(draft.id, draft);
    return cloneMockDraft(draft);
}

function getMockDraft(userId, draftId) {
    const bucket = getMockDraftBucket(userId);
    const draft = bucket.get(String(draftId));
    if (!draft || draft.status === 'archived') return null;
    return cloneMockDraft(draft);
}

function updateMockDraft(userId, draftId, payload = {}, ifUnmodifiedSince) {
    const bucket = getMockDraftBucket(userId);
    const current = bucket.get(String(draftId));
    if (!current || current.status === 'archived') {
        return { notFound: true };
    }
    if (ifUnmodifiedSince) {
        const headerDate = new Date(ifUnmodifiedSince);
        if (!Number.isNaN(headerDate.getTime())) {
            const updatedAt = new Date(current.updated_at);
            if (!Number.isNaN(updatedAt.getTime()) && updatedAt > headerDate) {
                return { conflict: true, draft: cloneMockDraft({ ...current, conflict_warning: true }) };
            }
        }
    }
    current.title = typeof payload?.title === 'string' ? payload.title : '';
    current.content = typeof payload?.content === 'string' ? payload.content : '';
    current.metadata = sanitizeMockMetadata(payload?.metadata);
    current.post_id = payload?.post_id ? String(payload.post_id).slice(0, 64) : null;
    current.status = 'active';
    const now = new Date();
    current.updated_at = now.toISOString();
    current.expires_at = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    current.conflict_warning = false;
    bucket.set(String(draftId), current);
    return { draft: cloneMockDraft(current) };
}

function archiveMockDraft(userId, draftId) {
    const bucket = getMockDraftBucket(userId);
    const current = bucket.get(String(draftId));
    if (!current || current.status === 'archived') {
        return { archived: false };
    }
    current.status = 'archived';
    current.updated_at = new Date().toISOString();
    bucket.set(String(draftId), current);
    return { archived: true };
}

function getCacheEntry(cache, key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (entry.expires <= Date.now()) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCacheEntry(cache, key, data, ttlMs = PROFILE_CACHE_TTL_MS) {
    cache.set(key, { data, expires: Date.now() + ttlMs });
}

function invalidateProfileCaches(userId) {
    if (!userId) return;
    profileCache.delete(userId.toString());
    profileProgressCache.delete(userId.toString());
}


const hasPerfNow = typeof performance === 'object' && typeof performance.now === 'function';
const searchTimeNow = () => (hasPerfNow ? performance.now() : Date.now());

async function runSearchQuery(sql, params, context = {}) {
    const start = searchTimeNow();
    try {
        const rows = await query(sql, params);
        recordSearchQuery({
            ...context,
            durationMs: searchTimeNow() - start,
            rowCount: Array.isArray(rows) ? rows.length : 0,
            ok: true
        });
        return rows;
    } catch (err) {
        recordSearchQuery({
            ...context,
            durationMs: searchTimeNow() - start,
            rowCount: 0,
            ok: false,
            error: err?.message
        });
        throw err;
    }
}

if (useMockDb) {
    const mapBoardForResponse = (board) => ({
        id: board.id,
        title: board.title,
        ordering: board.ordering ?? board.order ?? 1000,
        deleted: board.deleted ?? 0,
        created_at: board.created_at ?? new Date().toISOString(),
        updated_at: board.updated_at ?? board.created_at ?? new Date().toISOString()
    });

    const mapPostForResponse = (post) => ({
        id: post.id,
        board: post.board_id,
        board_id: post.board_id,
        title: post.title,
        content: post.content,
        date: post.date,
        tag: post.tag,
        thumb: post.thumb,
        author: post.author,
        category: post.category,
        deleted: post.deleted ?? 0,
        created_at: post.created_at,
        updated_at: post.updated_at,
        views: post.views ?? 0,
        status: post.status ?? 'published',
        excerpt: post.excerpt ?? null,
        hero_media_id: post.hero_media_id ?? null,
        hero_media: post.hero_media ?? null,
        media: post.media ?? null,
        blocks: post.blocks ?? null,
        layout_settings: post.layout_settings ?? null,
        last_edited_at: post.last_edited_at ?? post.updated_at ?? null,
        last_edited_by: post.last_edited_by ?? null,
        score: post.score ?? 0,
        versions: post.versions ?? null
    });;

    router.get('/boards', (req, res) => {
        res.json(mockListBoards().map(mapBoardForResponse));
    });

    router.get('/categories', (req, res) => {
        const categories = mockListCategories();
        res.json({ categories, count: categories.length });
    });

    router.get('/boards/:id/posts', (req, res) => {
        const boardId = req.params.id;
        const off = Math.max(0, parseInt(req.query.offset ?? '0', 10) || 0);
        let lim = parseInt(req.query.limit ?? '30', 10) || 30;
        if (lim <= 0) lim = 30; if (lim > 100) lim = 100;
        const search = (req.query.q || '').trim() || undefined;
        const { items, total } = mockGetPostsPage({ boardId, offset: off, limit: lim, search });
        const formatted = items.map(mapPostForResponse);
        const hasMore = off + lim < total;
        res.json({ items: formatted, total, offset: off, limit: lim, hasMore });
    });

    router.get('/posts', (req, res) => {
        const pageNum = Math.max(1, parseInt(req.query.page ?? '1', 10) || 1);
        let lim = parseInt(req.query.limit ?? '30', 10) || 30;
        if (lim <= 0) lim = 30; if (lim > 100) lim = 100;
        const off = (pageNum - 1) * lim;
        const search = (req.query.q || '').trim() || undefined;
        const { items, total } = mockGetAllPostsPage({ offset: off, limit: lim, search });
        const formatted = items.map(mapPostForResponse);
        const hasMore = off + lim < total;
        const totalPages = Math.ceil(total / lim) || 1;
        res.json({
            posts: formatted,
            pagination: {
                page: pageNum,
                limit: lim,
                total,
                totalPages,
                hasMore
            }
        });
    });

    router.get('/posts/:pid', (req, res, next) => {
        if (req.params.pid === 'drafts') return next();
        const post = mockGetPostById(req.params.pid);
        if (!post) return res.status(404).json({ error: 'not_found' });
        res.json(mapPostForResponse(post));
    });

    router.post('/posts/:pid/view', (req, res) => {
        mockIncrementViews(req.params.pid, 1);
        res.json({ ok: true, buffered: false });
    });

    router.get('/posts-map', (req, res) => {
        const map = {};
        mockListBoards().forEach((board) => {
            const { items } = mockGetPostsPage({ boardId: board.id, offset: 0, limit: 1000 });
            if (items.length) {
                map[board.id] = items.map(mapPostForResponse);
            }
        });
        res.json(map);
    });

    router.post('/boards/:id/posts', (req, res) => {
        try {
            const payload = req.body || {};
            const post = mockCreatePost(req.params.id, payload);
            if (payload.author_id) {
                applyActivityEvent(payload.author_id, 'post.created', { boardId: req.params.id, postId: post.id })
                    .then(() => invalidateProfileCaches(payload.author_id))
                    .catch((err) => console.warn('applyActivityEvent post.created failed', err.message));
            }
            res.status(201).json(mapPostForResponse(post));
        } catch (e) {
            if (e.message === 'board_not_found') return res.status(404).json({ error: 'board_not_found' });
            return res.status(400).json({ error: 'invalid_request', message: e.message });
        }
    });

    router.patch('/boards/:id/posts/:pid', (req, res) => {
        const payload = req.body || {};
        const updated = mockUpdatePost(req.params.pid, payload);
        if (!updated) return res.status(404).json({ error: 'not_found' });
        if (payload.last_edited_by) {
            applyActivityEvent(payload.last_edited_by, 'post.updated.major', { postId: updated.id })
                .then(() => invalidateProfileCaches(payload.last_edited_by))
                .catch((err) => console.warn('applyActivityEvent post.updated.major failed', err.message));
        }
        res.json(mapPostForResponse(updated));
    });

    router.delete('/boards/:id/posts/:pid', (req, res) => {
        const ok = mockDeletePost(req.params.pid);
        if (ok) {
            const authorId = req.body?.author_id;
            if (authorId) {
                applyActivityEvent(authorId, 'post.deleted', { postId: req.params.pid })
                    .then(() => invalidateProfileCaches(authorId))
                    .catch((err) => console.warn('applyActivityEvent post.deleted failed', err.message));
            }
        }
        res.json({ ok });
    });

    router.get('/search', (req, res) => {
        const q = (req.query.q || '').trim();
        const lim = Math.max(1, Math.min(100, parseInt(req.query.limit ?? '20', 10) || 20));
        const off = Math.max(0, parseInt(req.query.offset ?? '0', 10) || 0);
        if (!q) return res.json({ query: q, items: [], count: 0, total: 0, offset: off, limit: lim });
        const result = mockSearch(q, lim, off);
        res.json({ ok: true, ...result });
    });

    router.get('/trending', (req, res) => {
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit ?? '10', 10) || 10));
        const period = (req.query.period || '7d').toString();
        const days = parseInt(period, 10) || 7;
        const payload = mockGetTrending({ limit, periodDays: days });
        res.json({ ...payload, cache: false, ttlMs: TRENDING_TTL_MS });
    });

    router.get('/home', (req, res) => {
        const latest = parseInt(req.query.latest ?? '20', 10) || 20;
        const trending = parseInt(req.query.trending ?? '10', 10) || 10;
        const aggregate = mockGetHomeAggregate({ latest, trending });
        const boards = aggregate.boards.map(mapBoardForResponse);
        const latestPosts = aggregate.latest.map(mapPostForResponse);
        const trendingItems = aggregate.trending.map((item) => ({ ...item, board_id: item.board }));
        res.json({
            announcements: aggregate.announcements,
            events: aggregate.events,
            latest: latestPosts,
            trending: trendingItems,
            boards
        });
    });

    router.get('/metrics', (req, res) => {
        const summary = mockGetMetricsSummary();
        res.json({ ok: true, counts: summary, durationMs: 0 });
    });

    router.post('/mock/generate', (req, res) => {
        if (!allowMockOps()) return res.status(403).json({ error: 'forbidden' });
        const result = mockGeneratePosts(req.body || {});
        if (!result.ok) return res.status(400).json({ error: result.error || 'mock_failed' });
        res.json({ ok: true, generated: result.generated, items: result.items });
    });

    router.post('/mock/reset', (req, res) => {
        if (!allowMockOps()) return res.status(403).json({ error: 'forbidden' });
        const result = mockResetPosts();
        res.json({ ok: true, removed: result.removed });
    });

    router.get('/mock/status', (req, res) => {
        if (!allowMockOps()) return res.status(403).json({ error: 'forbidden' });
        const result = mockStatus();
        res.json(result);
    });
}

// UTF-8 ??얜Ŧ堉????녹맠 ???깆젧
router.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// --- Simple in-memory cache for /trending (period+limit) ---
const trendingCache = new Map(); // key -> { ts, data }
const TRENDING_TTL_MS = 30_000;

// READONLY ?꾩룄?х뙴?嶺뚮ㅄ維獄? ENV READONLY=1 ?????write 嶺뚢뼰維??
router.use((req, res, next) => {
    if (process.env.READONLY === '1') {
        const m = req.method.toUpperCase();
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(m)) {
            return res.status(403).json({ error: 'read_only_mode' });
        }
    }
    next();
});

// Basic input validation (board/post ids, title length, content size)
router.use((req, res, next) => {
    try {
        if (!req.path.startsWith('/boards') && !req.path.startsWith('/posts')) return next();
        const idPattern = /^[a-zA-Z0-9_-]{1,40}$/;
        const method = req.method.toUpperCase();
        // Validate IDs present in params
        if (req.params?.id && !idPattern.test(req.params.id)) return res.status(400).json({ error: 'invalid_board_id' });
        if (req.params?.pid && !idPattern.test(req.params.pid)) return res.status(400).json({ error: 'invalid_post_id' });
        if (['POST', 'PATCH'].includes(method)) {
            if (req.body && typeof req.body === 'object') {
                // For board creation: body.id must satisfy pattern (enforces earlier than DB error)
                if (method === 'POST' && req.path === '/boards' && req.body.id !== undefined) {
                    if (!idPattern.test(req.body.id)) return res.status(400).json({ error: 'invalid_board_id' });
                }
                // For post creation / update: optional id field if supplied must match
                if (req.body.id && req.path.includes('/posts') && !idPattern.test(req.body.id)) return res.status(400).json({ error: 'invalid_post_id' });
                if (req.body.title !== undefined) {
                    const t = req.body.title;
                    if (typeof t !== 'string' || t.trim().length === 0) return res.status(400).json({ error: 'title_required' });
                    if (t.length > 300) return res.status(400).json({ error: 'title_too_long' });
                }
                if (req.body.content) {
                    if (typeof req.body.content !== 'string') return res.status(400).json({ error: 'content_type' });
                    if (req.body.content.length > 10000) return res.status(400).json({ error: 'content_too_long' });
                }
            }
        }
        next();
    } catch (e) { return res.status(400).json({ error: 'bad_request' }); }
});

// Deprecated old helper removed: replaced by metrics-client-buffer.js

// Health (verbose ?????
router.get('/health', async (req, res, next) => {
    if (!req.query.verbose) return res.json({ ok: true, ts: Date.now() });
    try {
        const started = Date.now();
        // ?띠룄???DB ping + ?곸궠????
        const [boardsCount] = await query('SELECT COUNT(*) as c FROM boards');
        const [postsCount] = await query('SELECT COUNT(*) as c FROM posts');
        const dbLatency = Date.now() - started;
        res.json({ ok: true, ts: Date.now(), dbLatencyMs: dbLatency, counts: { boards: boardsCount.c, posts: postsCount.c } });
    } catch (e) { next(e); }
});

// Simple search endpoint (title/content LIKE fallback). Not fulltext; basic ranking by created_at desc.
router.get('/search', async (req, res, next) => {
    try {
        let { q = '', limit = '20', offset = '0' } = req.query || {};
        q = (q || '').trim();
        const lim = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
        const off = Math.max(0, parseInt(offset, 10) || 0);
        if (!q) return res.json({ ok: true, query: q, items: [], count: 0, total: 0, offset: off, limit: lim });
        if (q.length > 200) q = q.slice(0, 200);
        const esc = q.replace(/[\\%_]/g, m => '\\' + m);
        const like = '%' + esc + '%';
        const rows = await query(
            'SELECT p.id, p.board_id as board, p.title, p.author, p.category, p.created_at, p.updated_at, b.title as board_title FROM posts p LEFT JOIN boards b ON b.id = p.board_id WHERE p.deleted=0 AND (p.title LIKE ? ESCAPE \'\\\\\' OR p.content LIKE ? ESCAPE \'\\\\\') ORDER BY p.created_at DESC LIMIT ? OFFSET ?',
            [like, like, lim, off]
        );
        const [{ c: total }] = await query(
            'SELECT COUNT(*) as c FROM posts p WHERE p.deleted=0 AND (p.title LIKE ? ESCAPE \'\\\\\' OR p.content LIKE ? ESCAPE \'\\\\\')',
            [like, like]
        );
        const items = rows.map((row) => ({
            ...row,
            board_title: row.board_title ?? null,
            board_icon: BOARD_ICON_MAP[row.board] ?? null
        }));
        res.json({ ok: true, query: q, items, count: items.length, total, offset: off, limit: lim });
    } catch (e) { next(e); }
});

// liveness (?熬곣뫁夷?筌뤾쑬裕???怨룻닡???깅쾳 ???堉?? 嶺뚣끉裕????얜???
router.get('/live', (req, res) => { res.json({ ok: true }); });
// readiness (DB ???リ옇???flush ?띠럾?????? ?筌먦끉逾?
router.get('/ready', async (req, res) => {
    try {
        await query('SELECT 1');
        return res.json({ ok: true });
    } catch (e) {
        return res.status(503).json({ ok: false, error: 'db_unavailable' });
    }
});

// Boards
router.get('/boards', async (req, res, next) => {
    try {
        const rows = await query('SELECT id,title,ordering,deleted,created_at,updated_at FROM boards WHERE deleted=0 ORDER BY ordering ASC, id ASC');
        res.json(rows);
    } catch (e) { next(e); }
});
// Distinct categories listing (from posts)
router.get('/categories', async (req, res, next) => {
    try {
        const rows = await query("SELECT DISTINCT category FROM posts WHERE deleted=0 AND category IS NOT NULL AND category<>'' ORDER BY category ASC");
        const categories = rows.map(r => r.category);
        res.json({ categories, count: categories.length });
    } catch (e) { next(e); }
});
// Announcements (active + window filter)
router.get('/announcements', async (req, res, next) => {
    try {
        const now = new Date();
        const [rows] = await query(
            'SELECT * FROM announcements WHERE active=1 AND (starts_at IS NULL OR starts_at<=?) AND (ends_at IS NULL OR ends_at>=?) ORDER BY priority DESC, created_at DESC LIMIT 100',
            [now, now]
        );
        res.json({ announcements: rows });
    } catch (e) { next(e); }
});

// Events listing (optionally filter by status, upcoming default)
router.get('/events', async (req, res, next) => {
    try {
        const status = req.query.status || 'published';
        const now = new Date();
        const params = [status, now];
        const [rows] = await query(
            'SELECT * FROM events WHERE status=? AND (ends_at IS NULL OR ends_at>=?) ORDER BY starts_at ASC LIMIT 200',
            params
        );
        res.json({ events: rows });
    } catch (e) { next(e); }
});

// --- Admin: Announcements CRUD (AUTH_ENABLED + admin only) ---
async function insertAnnouncementHistory(announcementId, action, snapshot, actor) {
    try { await query('INSERT INTO announcement_history(announcement_id,action,snapshot,actor_user_id) VALUES(?,?,?,?)', [announcementId, action, JSON.stringify(snapshot), actor || null]); } catch (e) { console.warn('[ann_history.insert.fail]', e.message); }
}
async function insertEventHistory(eventId, action, snapshot, actor) {
    try { await query('INSERT INTO event_history(event_id,action,snapshot,actor_user_id) VALUES(?,?,?,?)', [eventId, action, JSON.stringify(snapshot), actor || null]); } catch (e) { console.warn('[event_history.insert.fail]', e.message); }
}

router.post('/announcements', requireModOrAdmin, async (req, res, next) => {
    try {
        const { slug, title, body, starts_at, ends_at, priority = 100, active = 1 } = req.body || {};
        if (!title) return res.status(400).json({ error: 'title_required' });
        await query('INSERT INTO announcements(slug,title,body,starts_at,ends_at,priority,active) VALUES(?,?,?,?,?,?,?)', [slug || null, title, body || '', starts_at || null, ends_at || null, priority, active ? 1 : 0]);
        const row = await query('SELECT * FROM announcements WHERE slug IS NULL OR slug=? ORDER BY id DESC LIMIT 1', [slug || null]);
        if (row[0]) await insertAnnouncementHistory(row[0].id, 'create', row[0], req.user?.id);
        res.status(201).json(row[0]);
    } catch (e) { next(e); }
});
router.patch('/announcements/:id', requireModOrAdmin, async (req, res, next) => {
    try {
        const { title, body, starts_at, ends_at, priority, active } = req.body || {};
        await query('UPDATE announcements SET title=COALESCE(?,title), body=COALESCE(?,body), starts_at=COALESCE(?,starts_at), ends_at=COALESCE(?,ends_at), priority=COALESCE(?,priority), active=COALESCE(?,active) WHERE id=? AND deleted=0', [title || null, body || null, starts_at || null, ends_at || null, priority ?? null, active === undefined ? null : (active ? 1 : 0), req.params.id]);
        const row = await query('SELECT * FROM announcements WHERE id=?', [req.params.id]);
        if (row[0]) await insertAnnouncementHistory(row[0].id, 'update', row[0], req.user?.id);
        res.json(row[0] || {});
    } catch (e) { next(e); }
});
router.delete('/announcements/:id', requireAdmin, async (req, res, next) => {
    try {
        const rows = await query('SELECT * FROM announcements WHERE id=?', [req.params.id]);
        if (rows[0]) await insertAnnouncementHistory(rows[0].id, 'delete', rows[0], req.user?.id);
        await query('UPDATE announcements SET deleted=1, active=0 WHERE id=?', [req.params.id]);
        res.json({ ok: true, softDeleted: true });
    } catch (e) { next(e); }
});

// --- Admin: Events CRUD ---
router.post('/events', requireModOrAdmin, async (req, res, next) => {
    try {
        const { title, body, starts_at, ends_at, location, status = 'planned', meta_json } = req.body || {};
        if (!title) return res.status(400).json({ error: 'title_required' });
        await query('INSERT INTO events(title,body,starts_at,ends_at,location,status,meta_json) VALUES(?,?,?,?,?,?,?)', [title, body || '', starts_at || null, ends_at || null, location || '', status, meta_json || null]);
        const row = await query('SELECT * FROM events ORDER BY id DESC LIMIT 1');
        if (row[0]) await insertEventHistory(row[0].id, 'create', row[0], req.user?.id);
        res.status(201).json(row[0]);
    } catch (e) { next(e); }
});
router.patch('/events/:id', requireModOrAdmin, async (req, res, next) => {
    try {
        const { title, body, starts_at, ends_at, location, status, meta_json } = req.body || {};
        await query('UPDATE events SET title=COALESCE(?,title), body=COALESCE(?,body), starts_at=COALESCE(?,starts_at), ends_at=COALESCE(?,ends_at), location=COALESCE(?,location), status=COALESCE(?,status), meta_json=COALESCE(?,meta_json) WHERE id=? AND deleted=0', [title || null, body || null, starts_at || null, ends_at || null, location || null, status || null, meta_json || null, req.params.id]);
        const row = await query('SELECT * FROM events WHERE id=?', [req.params.id]);
        if (row[0]) await insertEventHistory(row[0].id, 'update', row[0], req.user?.id);
        res.json(row[0] || {});
    } catch (e) { next(e); }
});
router.delete('/events/:id', requireAdmin, async (req, res, next) => {
    try {
        const rows = await query('SELECT * FROM events WHERE id=?', [req.params.id]);
        if (rows[0]) await insertEventHistory(rows[0].id, 'delete', rows[0], req.user?.id);
        await query('UPDATE events SET deleted=1 WHERE id=?', [req.params.id]);
        res.json({ ok: true, softDeleted: true });
    } catch (e) { next(e); }
});

// --- Role management: promote user to moderator (admin only) ---
router.post('/users/:id/role', requireAdmin, async (req, res, next) => {
    try {
        const { role } = req.body || {};
        if (!['user', 'moderator', 'admin'].includes(role)) return res.status(400).json({ error: 'invalid_role' });
        await query('UPDATE users SET role=? WHERE id=?', [role, req.params.id]);
        const [row] = await query('SELECT id, display_name, role FROM users WHERE id=?', [req.params.id]);
        res.json({ ok: true, user: row });
    } catch (e) { next(e); }
});
router.post('/boards', async (req, res, next) => {
    try {
        const { id, title, ordering } = req.body;
        if (!id || !title) return res.status(400).json({ error: 'id/title required' });
        await query('INSERT INTO boards(id,title,ordering) VALUES(?,?,?)', [id, title, ordering ?? 1000]);
        const [row] = await query('SELECT id,title,ordering,deleted,created_at,updated_at FROM boards WHERE id=?', [id]);
        res.status(201).json(row);
    } catch (e) { next(e); }
});
router.patch('/boards/:id', async (req, res, next) => {
    try {
        const { title, ordering } = req.body || {};
        const id = req.params.id;
        // mysql2: undefined in parameter array triggers error; normalize undefined -> null so COALESCE works as intended
        const norm = v => (v === undefined ? null : v);
        await query('UPDATE boards SET title=COALESCE(?,title), ordering=COALESCE(?,ordering) WHERE id=?', [norm(title), norm(ordering), id]);
        const [row] = await query('SELECT id,title,ordering,deleted,created_at,updated_at FROM boards WHERE id=?', [id]);
        res.json(row);
    } catch (e) { next(e); }
});
router.delete('/boards/:id', async (req, res, next) => {
    try { await query('UPDATE boards SET deleted=1 WHERE id=?', [req.params.id]); res.json({ ok: true }); } catch (e) { next(e); }
});

// Posts list for board (pagination + search)
// Query params: offset (default 0), limit (default 30, max 100), q (search text), approx=1 to allow LIKE fallback when FULLTEXT empty)
router.get('/boards/:id/posts', async (req, res, next) => {
    try {
        const boardId = req.params.id;
        let { offset = '0', limit = '30', q, approx, sort, tag } = req.query;
        const off = Math.max(0, parseInt(offset, 10) || 0);
        let lim = parseInt(limit, 10) || 30; if (lim <= 0) lim = 30; if (lim > 100) lim = 100;
        const search = (q || '').trim();
        const allowApprox = approx === '1' || approx === 1;
        const relevanceMin = parseFloat(process.env.SEARCH_FULLTEXT_MIN_SCORE || '0');
        const isPopularSort = sort === 'popular';
        const tagNames = tag ? tag.split(',').filter(Boolean) : [];
        const tagFilter = tagNames.length ? `AND p.id IN (SELECT post_id FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE t.name IN (${tagNames.map(() => '?').join(',')}))` : '';
        const tagParams = tagNames;
        let rows = [];
        let total = 0;
        if (search) {
            // FULLTEXT attempt (BOOLEAN MODE) - best effort
            const voteJoin = isPopularSort ? 'LEFT JOIN (SELECT target_id, SUM(CASE WHEN vote_type=\'up\' THEN 1 WHEN vote_type=\'down\' THEN -1 ELSE 0 END) as score FROM votes WHERE target_type=\'post\' GROUP BY target_id) vs ON vs.target_id = p.id' : '';
            const orderBy = isPopularSort ? 'COALESCE(vs.score, 0) DESC, relevance DESC, p.date DESC, p.created_at DESC' : 'relevance DESC, p.date DESC, p.created_at DESC';
            const fulltextSql = `SELECT p.*, p.board_id as board, IFNULL(v.views,0) as views${isPopularSort ? ', COALESCE(vs.score, 0) as score' : ''}, MATCH(p.title,p.content) AGAINST (? IN BOOLEAN MODE) AS relevance
                FROM posts p LEFT JOIN post_views v ON v.post_id=p.id ${voteJoin}
                WHERE p.board_id=? AND p.deleted=0 AND MATCH(p.title,p.content) AGAINST (? IN BOOLEAN MODE) ${tagFilter}
                ORDER BY ${orderBy}
                LIMIT ? OFFSET ?`;
            try {
                rows = await runSearchQuery(fulltextSql, [search, boardId, search, ...tagParams, lim + 1, off], { scope: 'board', strategy: 'fulltext', boardId, query: search, limit: lim, offset: off, usingFulltext: true });
                if (relevanceMin > 0) {
                    rows = rows.filter(r => (r.relevance || 0) >= relevanceMin);
                }
                // total via separate count (FOUND_ROWS deprecated; keep simple)
                const [cnt] = await runSearchQuery('SELECT COUNT(*) as c FROM posts WHERE board_id=? AND deleted=0 AND MATCH(title,content) AGAINST (? IN BOOLEAN MODE)' + tagFilter, [boardId, search, ...tagParams], { scope: 'board', strategy: 'fulltext-count', boardId, query: search, usingFulltext: true });
                total = cnt?.c || 0;
            } catch (err) {
                // FULLTEXT unsupported or error -> fallback path below
                rows = [];
            }
            if (rows.length === 0 && allowApprox) {
                const terms = search.split(/\s+/).filter(Boolean);
                if (terms.length) {
                    const likeClauses = terms.map(() => '(p.title LIKE ? OR p.content LIKE ?)').join(' AND ');
                    const likeParams = [];
                    terms.forEach(t => { const pat = `%${t}%`; likeParams.push(pat, pat); });
                    const voteJoin = isPopularSort ? 'LEFT JOIN (SELECT target_id, SUM(CASE WHEN vote_type=\'up\' THEN 1 WHEN vote_type=\'down\' THEN -1 ELSE 0 END) as score FROM votes WHERE target_type=\'post\' GROUP BY target_id) vs ON vs.target_id = p.id' : '';
                    const orderBy = isPopularSort ? 'COALESCE(vs.score, 0) DESC, p.date DESC, p.created_at DESC' : 'p.date DESC, p.created_at DESC';
                    const likeSql = `SELECT p.*, p.board_id as board, IFNULL(v.views,0) as views${isPopularSort ? ', COALESCE(vs.score, 0) as score' : ''}
                        FROM posts p LEFT JOIN post_views v ON v.post_id=p.id ${voteJoin}
                        WHERE p.board_id=? AND p.deleted=0 AND ${likeClauses} ${tagFilter}
                        ORDER BY ${orderBy}
                        LIMIT ? OFFSET ?`;
                    rows = await runSearchQuery(likeSql, [boardId, ...likeParams, ...tagParams, lim + 1, off], { scope: 'board', strategy: 'like', boardId, query: search, limit: lim, offset: off, usingFulltext: false });
                    const countSql = `SELECT COUNT(*) as c FROM posts p WHERE p.board_id=? AND p.deleted=0 AND ${likeClauses}`;
                    const [cnt2] = await runSearchQuery(countSql + tagFilter, [boardId, ...likeParams, ...tagParams], { scope: 'board', strategy: 'like-count', boardId, query: search, usingFulltext: false });
                    total = cnt2?.c || 0;
                }
            }
        }
        if (!search) {
            const voteJoin = isPopularSort ? 'LEFT JOIN (SELECT target_id, SUM(CASE WHEN vote_type=\'up\' THEN 1 WHEN vote_type=\'down\' THEN -1 ELSE 0 END) as score FROM votes WHERE target_type=\'post\' GROUP BY target_id) vs ON vs.target_id = p.id' : '';
            const orderBy = isPopularSort ? 'COALESCE(vs.score, 0) DESC, p.date DESC, p.created_at DESC' : 'p.date DESC, p.created_at DESC';
            const baseSql = `SELECT p.*, p.board_id as board, IFNULL(v.views,0) as views${isPopularSort ? ', COALESCE(vs.score, 0) as score' : ''}
                FROM posts p LEFT JOIN post_views v ON v.post_id=p.id ${voteJoin}
                WHERE p.board_id=? AND p.deleted=0 ${tagFilter}
                ORDER BY ${orderBy}
                LIMIT ? OFFSET ?`;
            rows = await query(baseSql, [boardId, ...tagParams, lim + 1, off]);
            const [cnt] = await query('SELECT COUNT(*) as c FROM posts p LEFT JOIN post_views v ON v.post_id=p.id WHERE p.board_id=? AND p.deleted=0' + tagFilter, [boardId, ...tagParams]);
            total = cnt?.c || 0;
        }
        const hasMore = rows.length > lim;
        if (hasMore) rows = rows.slice(0, lim);
        res.json({ items: rows, total, offset: off, limit: lim, hasMore });
    } catch (e) { next(e); }
});
router.post('/boards/:id/posts', async (req, res, next) => {
    try {
        const board = req.params.id;
        const { id, title, content, date, tag, thumb, author, category, author_id } = req.body || {};
        if (!title) return res.status(400).json({ error: 'title required' });
        const pid = id || ('p' + Date.now().toString(36));
        const finalAuthor = author || (req.user?.display_name ? req.user.display_name : 'Guest');
        await query('INSERT INTO posts(id,board_id,title,content,date,tag,thumb,author,category) VALUES(?,?,?,?,?,?,?,?,?)', [pid, board, title, content || '', date || null, tag || '', thumb || '', finalAuthor, category || '']);
        const [row] = await query('SELECT id,board_id as board,title,content,date,tag,thumb,author,category,deleted,created_at,updated_at,status,excerpt,hero_media_id,layout_settings,last_edited_at,last_edited_by FROM posts WHERE id=?', [pid]);
        const actorId = author_id || req.user?.id || null;
        if (actorId) {
            applyActivityEvent(actorId, 'post.created', { boardId: board, postId: pid })
                .then(() => invalidateProfileCaches(actorId))
                .catch((err) => console.warn('applyActivityEvent post.created failed', err.message));
        }
        res.status(201).json(row);
    } catch (e) { next(e); }
});
router.patch('/boards/:id/posts/:pid', async (req, res, next) => {
    try {
        const { title, content, date, tag, thumb, author, category, last_edited_by } = req.body || {};
        const norm = v => (v === undefined ? null : v);
        await query(
            'UPDATE posts SET title=COALESCE(?,title), content=COALESCE(?,content), date=COALESCE(?,date), tag=COALESCE(?,tag), thumb=COALESCE(?,thumb), author=COALESCE(?,author), category=COALESCE(?,category), last_edited_at=CURRENT_TIMESTAMP, last_edited_by=COALESCE(?, last_edited_by) WHERE id=?',
            [norm(title), norm(content), norm(date), norm(tag), norm(thumb), norm(author), norm(category), norm(last_edited_by), req.params.pid]
        );
        const [row] = await query('SELECT id,board_id as board,title,content,date,tag,thumb,author,category,deleted,created_at,updated_at,status,excerpt,hero_media_id,layout_settings,last_edited_at,last_edited_by FROM posts WHERE id=?', [req.params.pid]);
        const actorId = last_edited_by || req.user?.id || null;
        if (actorId) {
            applyActivityEvent(actorId, 'post.updated.major', { postId: req.params.pid })
                .then(() => invalidateProfileCaches(actorId))
                .catch((err) => console.warn('applyActivityEvent post.updated.major failed', err.message));
        }
        res.json(row);
    } catch (e) { next(e); }
});
router.delete('/boards/:id/posts/:pid', async (req, res, next) => {
    try {
        await query('UPDATE posts SET deleted=1 WHERE id=?', [req.params.pid]);
        const actorId = req.body?.author_id || req.user?.id || null;
        if (actorId) {
            applyActivityEvent(actorId, 'post.deleted', { postId: req.params.pid })
                .then(() => invalidateProfileCaches(actorId))
                .catch((err) => console.warn('applyActivityEvent post.deleted failed', err.message));
        }
        res.json({ ok: true });
    } catch (e) { next(e); }
});

// Update post
router.put('/boards/:id/posts/:pid', async (req, res, next) => {
    try {
        const { title, content, category } = req.body;
        if (!title || !content) return res.status(400).json({ error: 'title and content required' });
        await query('UPDATE posts SET title=?, content=?, category=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND deleted=0', [title, content, category || null, req.params.pid]);
        res.json({ ok: true });
    } catch (e) { next(e); }
});

// Single post detail (includes views)
// Draft post API
router.post('/attachments/sign', (req, res) => {
    if (!isAttachmentSigningEnabled()) {
        return res.status(404).json({ error: 'feature_disabled' });
    }

    const user = ensureAuthenticatedUser(req, res);
    if (!user) {
        return;
    }

    const outcome = applyAttachmentSignRateLimit(res, user.id);
    if (!outcome.allowed) {
        return res.status(429).json({ error: 'rate_limited', retryAfter: outcome.retryAfterSec });
    }

    const { filename, mimeType, size } = req.body || {};
    const validation = validateAttachmentRequest({ filename, mimeType, size, user });
    if (!validation.ok) {
        const errorPayload = { error: validation.error };
        if (validation.allowed) errorPayload.allowedTypes = validation.allowed;
        if (validation.maxSize) errorPayload.maxSize = validation.maxSize;
        return res.status(400).json(errorPayload);
    }

    const config = getAttachmentConfig();
    res.setHeader('Cache-Control', 'no-store');
    res.json({
        uploadUrl: validation.signing.uploadUrl,
        method: validation.signing.method,
        headers: validation.signing.headers,
        expiresAt: validation.signing.expiresAt,
        fileKey: validation.fileKey,
        contentType: validation.mimeType,
        bucket: config.bucket,
        region: config.region,
        maxSize: validation.maxSize,
        scanRequired: validation.signing.scanRequired,
        policy: {
            allowedTypes: config.allowedEntries,
            expiresInSec: config.expiresInSec
        }
    });
});

router.post('/attachments/complete', async (req, res) => {
    if (!isAttachmentSigningEnabled()) {
        return res.status(404).json({ error: 'feature_disabled' });
    }

    const user = ensureAuthenticatedUser(req, res);
    if (!user) {
        return;
    }

    const { fileKey, mimeType, size, checksum, originalName, draftId, postId, metadata } = req.body || {};

    if (!fileKey || typeof fileKey !== 'string') {
        return res.status(400).json({ error: 'invalid_file_key' });
    }

    const sizeNumber = typeof size === 'number' ? size : Number.parseInt(size, 10);
    if (!Number.isFinite(sizeNumber) || sizeNumber <= 0) {
        return res.status(400).json({ error: 'invalid_size' });
    }

    const completionValidation = validateAttachmentRequest({
        filename: typeof originalName === 'string' && originalName.trim() ? originalName : 'upload.bin',
        mimeType,
        size: sizeNumber,
        user
    });

    if (!completionValidation.ok) {
        const errorPayload = { error: completionValidation.error };
        if (completionValidation.allowed) errorPayload.allowedTypes = completionValidation.allowed;
        if (completionValidation.maxSize) errorPayload.maxSize = completionValidation.maxSize;
        return res.status(400).json(errorPayload);
    }

    const ownerUserId = user.id ?? null;
    const normalizedMime = completionValidation.mimeType;
    const sanitizedName = completionValidation.sanitizedName;
    const normalizedChecksum = typeof checksum === 'string' && checksum.trim() ? checksum.trim() : null;
    const sourceType = typeof postId === 'string' && postId.trim() ? 'post' : (typeof draftId === 'string' && draftId.trim() ? 'draft' : 'temp');
    const sourceId = sourceType === 'post' ? postId : sourceType === 'draft' ? draftId : null;

    try {
        const attachmentRecord = await createAttachmentRecord({
            fileKey,
            ownerUserId,
            status: 'queued',
            mimeType: normalizedMime,
            sizeBytes: sizeNumber,
            checksum: normalizedChecksum,
            originalName: sanitizedName,
            sourceType,
            sourceId,
            metadata: metadata && typeof metadata === 'object' ? metadata : null
        });

        const enqueueResult = await enqueueAttachmentProcessing(attachmentRecord, {
            uploaderUserId: ownerUserId
        });

        res.status(202).json({
            attachmentId: attachmentRecord.id,
            status: attachmentRecord.status,
            fileKey: attachmentRecord.fileKey,
            mimeType: attachmentRecord.mimeType,
            size: attachmentRecord.sizeBytes,
            checksum: attachmentRecord.checksum,
            originalName: attachmentRecord.originalName,
            sourceType: attachmentRecord.sourceType,
            sourceId: attachmentRecord.sourceId,
            variants: attachmentRecord.variants,
            metadata: attachmentRecord.metadata,
            queue: {
                enqueued: enqueueResult.enqueued,
                reason: enqueueResult.reason || null
            }
        });
    } catch (error) {
        console.error('[attachments.complete.error]', error);
        res.status(500).json({ error: 'attachment_complete_failed' });
    }
});

router.get('/attachments/:id', async (req, res) => {
    if (!isAttachmentSigningEnabled()) {
        return res.status(404).json({ error: 'feature_disabled' });
    }

    const user = ensureAuthenticatedUser(req, res);
    if (!user) {
        return;
    }

    try {
        const record = await getAttachmentById(req.params.id);
        if (!record) {
            return res.status(404).json({ error: 'not_found' });
        }

        const isOwner = !record.ownerUserId || record.ownerUserId === (user.id ?? -1);
        const isPrivileged = user.role === 'admin' || user.role === 'moderator';
        if (!isOwner && !isPrivileged) {
            return res.status(403).json({ error: 'forbidden' });
        }

        res.json({
            attachmentId: record.id,
            status: record.status,
            fileKey: record.fileKey,
            mimeType: record.mimeType,
            size: record.sizeBytes,
            checksum: record.checksum,
            originalName: record.originalName,
            sourceType: record.sourceType,
            sourceId: record.sourceId,
            variants: record.variants,
            metadata: record.metadata,
            errorMessage: record.errorMessage,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt
        });
    } catch (error) {
        console.error('[attachments.get.error]', error);
        res.status(500).json({ error: 'attachment_lookup_failed' });
    }
});

router.get('/posts/drafts', async (req, res, next) => {
    try {
        const user = ensureDraftAuth(req, res);
        if (!user) return;
        const rate = applyDraftRateLimit(res, user.id);
        if (!rate.allowed) return res.status(429).json({ error: 'rate_limited_drafts' });

        const limit = parseDraftLimit(req.query?.limit ?? 10);
        const offset = parseDraftOffset(req.query?.offset ?? 0);

        if (useMockDb) {
            const allDrafts = listMockDrafts(user.id);
            const slice = allDrafts.slice(offset, offset + limit);
            res.json({
                drafts: slice,
                pagination: {
                    limit,
                    offset,
                    returned: slice.length,
                    total: allDrafts.length,
                    has_more: offset + slice.length < allDrafts.length
                }
            });
            return;
        }

        const drafts = await listDraftsForAuthor(user.id, { limit, offset });
        res.json({
            drafts,
            pagination: {
                limit,
                offset,
                returned: drafts.length,
                has_more: drafts.length === limit
            }
        });
    } catch (e) { next(e); }
});

router.get('/posts/drafts/:id', async (req, res, next) => {
    try {
        const user = ensureDraftAuth(req, res);
        if (!user) return;
        const rate = applyDraftRateLimit(res, user.id);
        if (!rate.allowed) return res.status(429).json({ error: 'rate_limited_drafts' });

        let draft;
        if (useMockDb) {
            draft = getMockDraft(user.id, req.params.id);
        } else {
            const fetched = await getDraftById(req.params.id);
            if (fetched && String(fetched.author_id) === String(user.id)) draft = fetched;
        }

        if (!draft) return res.status(404).json({ error: 'draft_not_found' });
        if (draft.updated_at) res.setHeader('Last-Modified', draft.updated_at);
        res.json(draft);
    } catch (e) { next(e); }
});

router.post('/posts/drafts', async (req, res, next) => {
    try {
        const user = ensureDraftAuth(req, res);
        if (!user) return;
        const rate = applyDraftRateLimit(res, user.id);
        if (!rate.allowed) return res.status(429).json({ error: 'rate_limited_drafts' });

        const payload = (req.body && typeof req.body === 'object') ? req.body : {};
        let draft;
        if (useMockDb) draft = createMockDraft(user.id, payload);
        else draft = await createDraftForAuthor(user.id, payload);

        if (draft?.updated_at) res.setHeader('Last-Modified', draft.updated_at);
        res.status(201).location(`/api/posts/drafts/${draft.id}`).json(draft);
    } catch (e) { next(e); }
});

router.put('/posts/drafts/:id', async (req, res, next) => {
    try {
        const user = ensureDraftAuth(req, res);
        if (!user) return;
        const rate = applyDraftRateLimit(res, user.id);
        if (!rate.allowed) return res.status(429).json({ error: 'rate_limited_drafts' });

        const payload = (req.body && typeof req.body === 'object') ? req.body : {};
        const ifUnmodified = req.headers['if-unmodified-since'];
        let result;
        if (useMockDb) result = updateMockDraft(user.id, req.params.id, payload, ifUnmodified);
        else result = await updateDraftForAuthor(req.params.id, user.id, payload, ifUnmodified);

        if (result?.forbidden) return res.status(403).json({ error: 'draft_forbidden' });
        if (result?.notFound) return res.status(404).json({ error: 'draft_not_found' });
        if (result?.conflict) {
            const conflictDraft = result.draft || null;
            if (conflictDraft?.updated_at) res.setHeader('Last-Modified', conflictDraft.updated_at);
            return res.status(409).json({ error: 'draft_conflict', draft: conflictDraft });
        }

        const draft = result?.draft || null;
        if (!draft) return res.status(500).json({ error: 'draft_update_failed' });
        if (draft.updated_at) res.setHeader('Last-Modified', draft.updated_at);
        res.json(draft);
    } catch (e) { next(e); }
});

router.delete('/posts/drafts/:id', async (req, res, next) => {
    try {
        const user = ensureDraftAuth(req, res);
        if (!user) return;
        const rate = applyDraftRateLimit(res, user.id);
        if (!rate.allowed) return res.status(429).json({ error: 'rate_limited_drafts' });

        let result;
        if (useMockDb) result = archiveMockDraft(user.id, req.params.id);
        else result = await archiveDraftForAuthor(req.params.id, user.id);

        if (!result?.archived) return res.status(404).json({ error: 'draft_not_found' });
        res.status(204).send();
    } catch (e) { next(e); }
});

router.get('/posts/:pid', async (req, res, next) => {
    try {
        const [row] = await query(`SELECT p.*, p.board_id as board, IFNULL(v.views,0) as views
            FROM posts p LEFT JOIN post_views v ON v.post_id=p.id WHERE p.id=? AND p.deleted=0 LIMIT 1`, [req.params.pid]);
        if (!row) return res.status(404).json({ error: 'not_found' });
        // ETag & Last-Modified support
        const lastMod = row.updated_at || row.created_at;
        const etag = 'W/"post-' + row.id + '-' + (lastMod ? new Date(lastMod).getTime() : 0) + '-' + (row.views || 0) + '"';
        if (req.headers['if-none-match'] === etag) {
            res.status(304).end(); return;
        }
        if (lastMod) res.setHeader('Last-Modified', new Date(lastMod).toUTCString());
        res.setHeader('ETag', etag);
        res.json(row);
    } catch (e) { next(e); }
});

// Posts map (all boards)
router.get('/posts-map', async (req, res, next) => {
    try {
        const rows = await query('SELECT p.*, p.board_id as board, IFNULL(v.views,0) as views FROM posts p LEFT JOIN post_views v ON v.post_id=p.id WHERE p.deleted=0');
        const map = {};
        rows.forEach(r => { if (!map[r.board]) map[r.board] = []; map[r.board].push(r); });
        Object.values(map).forEach(arr => arr.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)));
        res.json(map);
    } catch (e) { next(e); }
});

// View increment (buffered)
router.post('/posts/:pid/view', async (req, res, next) => {
    try {
        bufferViewIncrement(req.params.pid);
        res.json({ ok: true, buffered: true });
    } catch (e) { next(e); }
});

// Metrics
router.get('/metrics', async (req, res, next) => {
    try {
        const start = Date.now();
        // lightweight counts (嶺?흮????μ쪚???띠럾???
        let b = { c: 0 }, p = { c: 0 };
        try {
            const bResult = await query('SELECT COUNT(*) as c FROM boards WHERE deleted=0');
            const pResult = await query('SELECT COUNT(*) as c FROM posts WHERE deleted=0');
            b = bResult[0] || { c: 0 };
            p = pResult[0] || { c: 0 };
        } catch (e) {
            // Mock mode or DB error - use defaults
            console.log('[metrics] Using default counts (mock mode or DB error)');
        }
        const metrics = req.app.locals.runtimeMetrics || {};
        // include limited client metrics summary (does not expose raw distribution) for quick dashboard
        let clientSummary = null;
        try {
            const buf = req.app.locals.clientMetricBuffer; if (buf) {
                const snap = buf.snapshot();
                if (snap) {
                    clientSummary = {
                        collected: snap.collected,
                        windowMinutes: snap.windowMinutes,
                        LCP: snap.LCP ? { p50: snap.LCP.p50, p90: snap.LCP.p90 } : null,
                        INP: snap.INP ? { p90: snap.INP.p90 } : null,
                        CLS: snap.CLS ? { p90: snap.CLS.p90 } : null,
                        FID: snap.FID ? { p90: snap.FID.p90 } : null,
                        LAF: snap.LAF ? { p90: snap.LAF.p90 } : null
                    };
                }
            }
        } catch { }
        res.json({
            ok: true,
            uptimeSec: ((Date.now() - (metrics.startTime || Date.now())) / 1000) | 0,
            boards: b.c,
            posts: p.c,
            rlWriteBlocked: metrics.rlWriteBlocked || 0,
            rlSearchBlocked: metrics.rlSearchBlocked || 0,
            keepaliveFail: metrics.keepaliveFail || 0,
            lastKeepaliveOk: metrics.lastKeepaliveOk || null,
            lastKeepaliveError: metrics.lastKeepaliveError || null,
            dbSampleLatencyMs: Date.now() - start,
            memory: process.memoryUsage(),
            viewBufferedAdds: metrics.viewBufferedAdds || 0,
            viewFlushBatches: metrics.viewFlushBatches || 0,
            viewFlushRows: metrics.viewFlushRows || 0,
            viewFlushFailures: metrics.viewFlushFailures || 0,
            viewForcedFlushes: metrics.viewForcedFlushes || 0,
            viewBackoffRetries: metrics.viewBackoffRetries || 0,
            viewFlushDropped: metrics.viewFlushDropped || 0,
            chat: {
                posted: metrics.chatMessagesPosted || 0,
                fetched: metrics.chatMessagesFetched || 0,
                roomsListed: metrics.chatRoomsListed || 0,
                communitiesListed: metrics.chatCommunitiesListed || 0,
                clears: metrics.chatClears || 0,
                redisTrim: metrics.chatRedisTrim || 0
            },
            // client metric ingestion/export counters (lightweight surfacing)
            clientMetric: {
                attempts: metrics.clientMetric_attempts || 0,
                accepted: metrics.clientMetric_accepted || 0,
                rateLimited: metrics.clientMetric_rate_limited || 0,
                discardNoMetrics: metrics.clientMetric_discard_no_metrics || 0,
                discardAllNull: metrics.clientMetric_discard_all_null || 0,
                bytes: metrics.clientMetric_bytes || 0,
                exportAttempts: metrics.clientMetric_export_attempts || 0,
                exportSuccess: metrics.clientMetric_export_success || 0,
                exportFail: metrics.clientMetric_export_fail || 0
            },
            clientSummary
        });
    } catch (e) { next(e); }
});

// Debug: force flush view buffer (test only)
router.post('/debug/flush-views', async (req, res, next) => {
    try {
        // ?怨뺣뼺? ?곌랜??? ??怨멸껀 ???삵렱?????NODE_ENV=test?띠럾? ?熬곣뫀鍮띸춯??リ옇???濾곌쑨??.
        // 嶺뚮ㅏ援???⑤챷紐드슖?ENV_ALLOW_DEBUG_FLUSH=1 ???깆젧???롪퍔?????異????깅뮔 (?β돦裕뉛쭚??ル?????븐뼚?붺뭐???紐껋┣)
        if (process.env.NODE_ENV !== 'test' && process.env.ENV_ALLOW_DEBUG_FLUSH !== '1') {
            return res.status(403).json({ error: 'forbidden' });
        }
        const flushed = await __flushAllViewsForTest();
        res.json({ ok: true, flushed, now: Date.now() });
    } catch (e) { next(e); }
});

// Prometheus style metrics (plain text)
router.get('/metrics-prom', async (req, res, next) => {
    try {
        const [b] = await query('SELECT COUNT(*) as c FROM boards WHERE deleted=0');
        const [p] = await query('SELECT COUNT(*) as c FROM posts WHERE deleted=0');
        const m = req.app.locals.runtimeMetrics || {};
        // client metrics snapshot (may be empty) - no guard for observability; optional env guard could be added
        let clientSnap = null;
        try { const buf = req.app.locals.clientMetricBuffer; if (buf) clientSnap = buf.snapshot(); } catch { }
        const lines = [];
        lines.push('# HELP app_uptime_seconds Uptime in seconds');
        lines.push('# TYPE app_uptime_seconds gauge');
        lines.push(`app_uptime_seconds ${((Date.now() - (m.startTime || Date.now())) / 1000) | 0}`);
        lines.push('# HELP app_boards Boards count');
        lines.push('# TYPE app_boards gauge');
        lines.push(`app_boards ${b.c}`);
        lines.push('# HELP app_posts Posts count');
        lines.push('# TYPE app_posts gauge');
        lines.push(`app_posts ${p.c}`);
        lines.push('# HELP app_rl_write_blocked Rate limited write requests');
        lines.push('# TYPE app_rl_write_blocked counter');
        lines.push(`app_rl_write_blocked ${m.rlWriteBlocked || 0}`);
        lines.push('# HELP app_rl_search_blocked Rate limited search requests');
        lines.push('# TYPE app_rl_search_blocked counter');
        lines.push(`app_rl_search_blocked ${m.rlSearchBlocked || 0}`);
        lines.push('# HELP app_keepalive_fail Keepalive failure count');
        lines.push('# TYPE app_keepalive_fail counter');
        lines.push(`app_keepalive_fail ${m.keepaliveFail || 0}`);
        lines.push('# HELP app_view_buffered_adds Buffered view increments');
        lines.push('# TYPE app_view_buffered_adds counter');
        lines.push(`app_view_buffered_adds ${m.viewBufferedAdds || 0}`);
        lines.push('# HELP app_view_flush_batches View flush batch count');
        lines.push('# TYPE app_view_flush_batches counter');
        lines.push(`app_view_flush_batches ${m.viewFlushBatches || 0}`);
        lines.push('# HELP app_view_flush_rows Distinct post rows flushed');
        lines.push('# TYPE app_view_flush_rows counter');
        lines.push(`app_view_flush_rows ${m.viewFlushRows || 0}`);
        lines.push('# HELP app_view_flush_failures View flush batch failure count');
        lines.push('# TYPE app_view_flush_failures counter');
        lines.push(`app_view_flush_failures ${m.viewFlushFailures || 0}`);
        lines.push('# HELP app_view_forced_flushes Forced flush triggers due to total threshold');
        lines.push('# TYPE app_view_forced_flushes counter');
        lines.push(`app_view_forced_flushes ${m.viewForcedFlushes || 0}`);
        lines.push('# HELP app_view_backoff_retries Backoff retry attempts for failed flush');
        lines.push('# TYPE app_view_backoff_retries counter');
        lines.push(`app_view_backoff_retries ${m.viewBackoffRetries || 0}`);
        lines.push('# HELP app_view_flush_dropped Estimated dropped view increments');
        lines.push('# TYPE app_view_flush_dropped counter');
        lines.push(`app_view_flush_dropped ${m.viewFlushDropped || 0}`);
        // Auth counters
        lines.push('# HELP auth_login_success Authentication login success count');
        lines.push('# TYPE auth_login_success counter');
        lines.push(`auth_login_success ${m.authLoginSuccess || 0}`);
        lines.push('# HELP auth_login_fail Authentication login failure count');
        lines.push('# TYPE auth_login_fail counter');
        lines.push(`auth_login_fail ${m.authLoginFail || 0}`);
        lines.push('# HELP auth_refresh_success Authentication refresh success count');
        lines.push('# TYPE auth_refresh_success counter');
        lines.push(`auth_refresh_success ${m.authRefresh || 0}`);
        // Placeholder client web vitals style percentiles (p90) for checklist latency test
        const lcpP90 = clientSnap?.p90?.LCP ?? 0;
        const inpP90 = clientSnap?.p90?.INP ?? 0;
        const fcpP90 = clientSnap?.p90?.FCP ?? 0;
        lines.push('# HELP client_lcp_p90 Largest Contentful Paint p90 (ms)');
        lines.push('# TYPE client_lcp_p90 gauge');
        lines.push(`client_lcp_p90 ${lcpP90}`);
        lines.push('# HELP client_inp_p90 Interaction to Next Paint p90 (ms)');
        lines.push('# TYPE client_inp_p90 gauge');
        lines.push(`client_inp_p90 ${inpP90}`);
        lines.push('# HELP client_fcp_p90 First Contentful Paint p90 (ms)');
        lines.push('# TYPE client_fcp_p90 gauge');
        lines.push(`client_fcp_p90 ${fcpP90}`);
        lines.push('# HELP auth_link_success Account linking success count');
        lines.push('# TYPE auth_link_success counter');
        lines.push(`auth_link_success ${m.authLink || 0}`);
        // Chat counters
        const chatCounters = [
            ['chat_messages_posted', 'Chat messages posted'],
            ['chat_messages_fetched', 'Chat message list fetches (db fallback path included)'],
            ['chat_rooms_listed', 'Chat rooms listed'],
            ['chat_communities_listed', 'Chat communities listed'],
            ['chat_clears', 'Chat history clear operations'],
            ['chat_redis_trim', 'Chat redis list trim operations']
        ];
        chatCounters.forEach(([name, help]) => {
            lines.push(`# HELP ${name} ${help}`);
            lines.push(`# TYPE ${name} counter`);
            const key = name.replace(/chat_/, 'chat').replace(/messages_/, 'Messages').replace(/rooms_listed/, 'RoomsListed');
            // We'll just directly map runtime metric keys already defined
        });
        lines.push(`chat_messages_posted ${m.chatMessagesPosted || 0}`);
        lines.push(`chat_messages_fetched ${m.chatMessagesFetched || 0}`);
        lines.push(`chat_rooms_listed ${m.chatRoomsListed || 0}`);
        lines.push(`chat_communities_listed ${m.chatCommunitiesListed || 0}`);
        lines.push(`chat_clears ${m.chatClears || 0}`);
        lines.push(`chat_redis_trim ${m.chatRedisTrim || 0}`);
        // Client metric ingestion/export counters
        const emitCounter = (name, help) => { lines.push(`# HELP ${name} ${help}`); lines.push(`# TYPE ${name} counter`); lines.push(`${name} ${m[name] || 0}`); };
        emitCounter('client_metric_export_attempts', 'Client metric export attempt count');
        emitCounter('client_metric_export_success', 'Client metric export success count');
        emitCounter('client_metric_export_fail', 'Client metric export failure count');
        emitCounter('client_metric_attempts', 'Client metric ingestion attempts');
        emitCounter('client_metric_accepted', 'Client metric accepted count');
        emitCounter('client_metric_rate_limited', 'Client metric rate limited count');
        emitCounter('client_metric_discard_no_metrics', 'Client metric discarded (no metrics field)');
        emitCounter('client_metric_discard_all_null', 'Client metric discarded (all values null)');
        emitCounter('client_metric_bytes', 'Client metric payload bytes cumulative');
        // HTTP duration histogram (simple) from app.locals.httpDuration
        try {
            const httpDur = req.app.locals.httpDuration;
            if (httpDur) {
                const { buckets, counts, total, sum } = httpDur;
                let cumulative = 0;
                for (let i = 0; i < buckets.length; i++) {
                    cumulative += counts[i];
                    lines.push(`# HELP http_request_duration_ms_bucket HTTP request duration bucket`);
                    lines.push(`# TYPE http_request_duration_ms_bucket gauge`);
                    lines.push(`http_request_duration_ms_bucket{le="${buckets[i]}"} ${cumulative}`);
                }
                cumulative += counts[counts.length - 1];
                lines.push(`http_request_duration_ms_bucket{le="+Inf"} ${cumulative}`);
                lines.push(`# HELP http_request_duration_ms_count Total http request count`);
                lines.push(`# TYPE http_request_duration_ms_count counter`);
                lines.push(`http_request_duration_ms_count ${total}`);
                if (total > 0) {
                    lines.push(`# HELP http_request_duration_ms_avg Average http request duration`);
                    lines.push(`# TYPE http_request_duration_ms_avg gauge`);
                    lines.push(`http_request_duration_ms_avg ${sum / total}`);
                }
            }
        } catch { }
        if (clientSnap) {
            function emitAgg(name, agg) {
                if (!agg) return; // skip if null
                lines.push(`# HELP client_${name}_p50 ${name} p50`); lines.push(`# TYPE client_${name}_p50 gauge`); lines.push(`client_${name}_p50 ${agg.p50}`);
                lines.push(`# HELP client_${name}_p90 ${name} p90`); lines.push(`# TYPE client_${name}_p90 gauge`); lines.push(`client_${name}_p90 ${agg.p90}`);
                lines.push(`# HELP client_${name}_p99 ${name} p99`); lines.push(`# TYPE client_${name}_p99 gauge`); lines.push(`client_${name}_p99 ${agg.p99}`);
                lines.push(`# HELP client_${name}_avg ${name} average`); lines.push(`# TYPE client_${name}_avg gauge`); lines.push(`client_${name}_avg ${agg.avg}`);
                lines.push(`# HELP client_${name}_count ${name} sample count`); lines.push(`# TYPE client_${name}_count gauge`); lines.push(`client_${name}_count ${agg.count}`);
            }
            ['LCP', 'CLS', 'FID', 'INP', 'FCP', 'TTFB', 'LAF', 'LAF_MAX'].forEach(k => emitAgg(k.toLowerCase(), clientSnap[k]));
        }
        res.setHeader('Content-Type', 'text/plain; version=0.0.4');
        res.send(lines.join('\n'));
    } catch (e) { next(e); }
});

// Trending posts (Redis-optimized: uses Sorted Set for instant ranking)
// Query: period=7d (days only), limit=10 (max 100)
router.get('/trending', async (req, res, next) => {
    try {
        const period = (req.query.period || '7d').toString();
        const m = period.match(/^(\d{1,3})d$/i);
        const days = Math.max(1, Math.min(365, m ? parseInt(m[1], 10) : 7));
        let lim = parseInt(req.query.limit, 10) || 10; if (lim <= 0) lim = 10; if (lim > 100) lim = 100;

        const cacheKey = period + '::' + lim;
        const cached = trendingCache.get(cacheKey);
        const nowMs = Date.now();
        if (cached && (nowMs - cached.ts) < TRENDING_TTL_MS) {
            return res.json({ ...cached.data, cache: true, ttlMs: TRENDING_TTL_MS - (nowMs - cached.ts), source: 'memory_cache' });
        }

        let items = [];

        if (isRedisEnabled()) {
            try {
                // Get top posts from Redis Sorted Set (instant, no DB sorting needed)
                const TRENDING_KEY = 'trending:posts';
                const topPostIds = await zRevRange(TRENDING_KEY, 0, lim - 1);

                if (topPostIds.length > 0) {
                    // Get post details for the top IDs
                    const placeholders = topPostIds.map(() => '?').join(',');
                    const since = new Date(Date.now() - days * 86400000);
                    const rows = await query(
                        `SELECT p.id, p.board_id as board, p.title, p.category, p.thumb, p.author,
                                p.created_at, p.updated_at, IFNULL(v.views,0) as views
                         FROM posts p
                         LEFT JOIN post_views v ON v.post_id = p.id
                         WHERE p.id IN (${placeholders}) AND p.deleted=0 
                               AND (p.created_at >= ? OR (p.date IS NOT NULL AND p.date >= ?))
                         ORDER BY FIELD(p.id, ${placeholders})`,
                        [...topPostIds, since, since, ...topPostIds]
                    );

                    // Map results maintaining Redis order
                    const now = Date.now();
                    items = rows.map((r, i) => ({
                        id: r.id,
                        board: r.board,
                        title: r.title,
                        category: r.category,
                        image: r.thumb || null,
                        author: r.author || null,
                        views: r.views || 0,
                        created_at: r.created_at,
                        updated_at: r.updated_at,
                        rank: i + 1,
                        isRising: r.created_at ? (now - new Date(r.created_at).getTime()) < (2 * 86400000) : false
                    }));
                }

                const payload = { items, periodDays: days, limit: lim, source: 'redis_optimized' };
                trendingCache.set(cacheKey, { ts: nowMs, data: payload });
                return res.json({ ...payload, cache: false, ttlMs: TRENDING_TTL_MS });
            } catch (e) {
                console.warn('[trending] Redis fallback to DB', e.message);
                // Fall through to DB query below
            }
        }

        // Fallback: traditional DB query (when Redis unavailable or failed)
        const since = new Date(Date.now() - days * 86400000);
        const rows = await query(
            `SELECT p.id, p.board_id as board, p.title, p.category, p.thumb, p.author,
                    p.created_at, p.updated_at, IFNULL(v.views,0) as views
             FROM posts p
             LEFT JOIN post_views v ON v.post_id = p.id
             WHERE p.deleted=0 AND (p.created_at >= ? OR (p.date IS NOT NULL AND p.date >= ?))
             ORDER BY views DESC, p.created_at DESC
             LIMIT ?`,
            [since, since, lim]
        );
        const now = Date.now();
        items = rows.map((r, i) => ({
            id: r.id,
            board: r.board,
            title: r.title,
            category: r.category,
            image: r.thumb || null,
            author: r.author || null,
            views: r.views || 0,
            created_at: r.created_at,
            updated_at: r.updated_at,
            rank: i + 1,
            isRising: r.created_at ? (now - new Date(r.created_at).getTime()) < (2 * 86400000) : false
        }));

        const payload = { items, periodDays: days, limit: lim, source: 'db_fallback' };
        trendingCache.set(cacheKey, { ts: nowMs, data: payload });
        res.json({ ...payload, cache: false, ttlMs: TRENDING_TTL_MS });
    } catch (e) { next(e); }
});

// Home aggregate: announcements, events(with meta), latest posts, trending
// Query: latest=20, trending=10 (optional)
router.get('/home', async (req, res, next) => {
    try {
        let latestLim = parseInt(req.query.latest, 10) || 20; if (latestLim <= 0) latestLim = 20; if (latestLim > 100) latestLim = 100;
        let trendingLim = parseInt(req.query.trending, 10) || 10; if (trendingLim <= 0) trendingLim = 10; if (trendingLim > 100) trendingLim = 100;
        // announcements (active window)
        const now = new Date();
        const annRows = await query(
            'SELECT * FROM announcements WHERE active=1 AND (starts_at IS NULL OR starts_at<=?) AND (ends_at IS NULL OR ends_at>=?) ORDER BY priority DESC, created_at DESC LIMIT 100',
            [now, now]
        );
        // events (published & ongoing/upcoming)
        const eventRows = await query(
            'SELECT * FROM events WHERE status=? AND (ends_at IS NULL OR ends_at>=?) ORDER BY starts_at ASC LIMIT 200',
            ['published', now]
        );
        const events = eventRows.map(e => ({
            ...e,
            meta: (() => { try { return e.meta_json ? JSON.parse(e.meta_json) : null; } catch { return null; } })()
        }));
        // latest posts across boards
        const latest = await query(
            `SELECT p.*, p.board_id as board, IFNULL(v.views,0) as views
             FROM posts p LEFT JOIN post_views v ON v.post_id=p.id
             WHERE p.deleted=0
             ORDER BY p.date DESC, p.created_at DESC
             LIMIT ?`,
            [latestLim]
        );
        // trending reuse: call the same logic by time window (7d)
        const since = new Date(Date.now() - 7 * 86400000);
        const tr = await query(
            `SELECT p.id, p.board_id as board, p.title, p.category, p.thumb, p.author,
                    p.created_at, p.updated_at, IFNULL(v.views,0) as views
             FROM posts p
             LEFT JOIN post_views v ON v.post_id = p.id
             WHERE p.deleted=0 AND (p.created_at >= ? OR (p.date IS NOT NULL AND p.date >= ?))
             ORDER BY views DESC, p.created_at DESC
             LIMIT ?`,
            [since, since, trendingLim]
        );
        const nowMs = Date.now();
        const trending = tr.map((r, i) => ({
            id: r.id,
            board: r.board,
            title: r.title,
            category: r.category,
            image: r.thumb || null,
            author: r.author || null,
            views: r.views || 0,
            created_at: r.created_at,
            updated_at: r.updated_at,
            rank: i + 1,
            isRising: r.created_at ? (nowMs - new Date(r.created_at).getTime()) < (2 * 86400000) : false
        }));
        // boards (for UI labels)
        const boards = await query('SELECT id,title,ordering,deleted,created_at,updated_at FROM boards WHERE deleted=0 ORDER BY ordering ASC, id ASC');
        res.json({ announcements: annRows, events, latest, trending, boards });
    } catch (e) { next(e); }
});

// --- Mock data utilities (guarded) ---
function allowMockOps() {
    return useMockDb || process.env.NODE_ENV === 'test' || process.env.ENV_ALLOW_MOCK === '1';
}

// Generate mock posts (tag='mock')
// POST /mock/generate { count?:number, board?:string }
router.post('/mock/generate', async (req, res, next) => {
    try {
        if (!allowMockOps()) return res.status(403).json({ error: 'forbidden' });
        let { count = 20, board, daysBack = 7, viewsMin = 0, viewsMax = 3000, thumbsRatio = 0.75, titlePrefix = '', categoryPool, authorPool, boardWeights, contentLengthMin = 120, contentLengthMax = 600, seed } = req.body || {};
        count = Math.max(1, Math.min(1000, parseInt(count, 10) || 20));
        daysBack = Math.max(0, Math.min(365, parseInt(daysBack, 10) || 7));
        viewsMin = Math.max(0, parseInt(viewsMin, 10) || 0);
        viewsMax = Math.max(viewsMin, parseInt(viewsMax, 10) || 3000);
        thumbsRatio = Math.max(0, Math.min(1, Number(thumbsRatio)) || 0.75);
        contentLengthMin = Math.max(20, Math.min(5000, parseInt(contentLengthMin, 10) || 120));
        contentLengthMax = Math.max(contentLengthMin, Math.min(20000, parseInt(contentLengthMax, 10) || 600));
        if (seed) { try { Math.seedrandom?.(String(seed)); } catch { /* optional */ } }
        const boards = await query('SELECT id,title FROM boards WHERE deleted=0 ORDER BY ordering ASC, id ASC');
        if (!boards.length) return res.status(400).json({ error: 'no_boards' });
        const targetBoards = board ? boards.filter(b => b.id === board) : boards;
        if (!targetBoards.length) return res.status(404).json({ error: 'board_not_found' });
        // weighting
        let weighted = targetBoards;
        if (boardWeights && typeof boardWeights === 'object') {
            const acc = [];
            targetBoards.forEach(b => {
                const w = Math.max(0, Number(boardWeights[b.id] ?? 1));
                for (let i = 0; i < Math.ceil(w); i++) acc.push(b);
            });
            if (acc.length) weighted = acc;
        }
        const ids = [];
        for (let i = 0; i < count; i++) {
            const b = pick(weighted);
            const id = randomId();
            const tp = Array.isArray(titlePrefix) ? pick(titlePrefix) : (titlePrefix || '');
            const baseTitle = pick(SAMPLE_TITLES);
            const title = (tp ? (tp + ' ') : '') + baseTitle + ' #' + randInt(1, 9999);
            const snippet = pick(SAMPLE_SNIPPETS);
            const bodyLen = randInt(contentLengthMin, contentLengthMax);
            const filler = Math.random().toString(36).repeat(20).slice(0, bodyLen);
            const content = snippet + '\n\n' + '?곌랜梨뜻룇 ??臾먰깵: ' + filler;
            const dt = new Date(Date.now() - randInt(0, daysBack) * 86400000);
            const dateOnly = dt.toISOString().slice(0, 10);
            const author = Array.isArray(authorPool) && authorPool.length ? pick(authorPool) : pick(SAMPLE_AUTHORS);
            const category = Array.isArray(categoryPool) && categoryPool.length ? pick(categoryPool) : pick(SAMPLE_CATEGORIES);
            const thumb = Math.random() < thumbsRatio ? pick(SAMPLE_THUMBS.filter(Boolean)) : '';
            await query(
                'INSERT INTO posts(id,board_id,title,content,date,tag,thumb,author,category) VALUES(?,?,?,?,?,?,?,?,?)',
                [id, b.id, title, content, dateOnly, 'mock', thumb, author, category]
            );
            // Optionally seed some views
            const v = randInt(viewsMin, viewsMax);
            if (v > 0) await query('INSERT INTO post_views(post_id,views) VALUES(?,?) ON DUPLICATE KEY UPDATE views=VALUES(views)', [id, v]);
            ids.push(id);
        }
        const rows = await query('SELECT id, board_id as board, title, thumb, author, category, created_at, IFNULL(v.views,0) as views FROM posts p LEFT JOIN post_views v ON v.post_id=p.id WHERE p.id IN (' + ids.map(() => '?').join(',') + ')', ids);
        res.json({ ok: true, generated: ids.length, items: rows });
    } catch (e) { next(e); }
});

// Reset (delete) mock posts only (tag='mock')
router.post('/mock/reset', async (req, res, next) => {
    try {
        if (!allowMockOps()) return res.status(403).json({ error: 'forbidden' });
        const ids = await query("SELECT id FROM posts WHERE tag='mock'");
        const count = ids.length;
        await query("DELETE FROM posts WHERE tag='mock'"); // post_views cascades
        res.json({ ok: true, removed: count });
    } catch (e) { next(e); }
});

// Status of mock data
router.get('/mock/status', async (req, res, next) => {
    try {
        if (!allowMockOps()) return res.status(403).json({ error: 'forbidden' });
        const [c] = await query("SELECT COUNT(*) as c FROM posts WHERE tag='mock'");
        res.json({ ok: true, count: c.c });
    } catch (e) { next(e); }
});

// Client performance metrics ingestion (supports extra keys: INP,FCP,TTFB)
// Basic in-memory rate limit for client-metric ingestion (per IP per minute)
const clientMetricRate = new Map(); // key -> { count, resetTs }
function allowClientMetric(key, limit = parseInt(process.env.CLIENT_METRIC_RPM || '120', 10)) {
    const now = Date.now();
    let e = clientMetricRate.get(key);
    if (!e || e.resetTs < now) {
        e = { count: 0, resetTs: now + 60000 }; clientMetricRate.set(key, e);
    }
    if (e.count >= limit) return false; e.count++; return true;
}

// ingestion counters stored on runtimeMetrics inside app.locals.runtimeMetrics
function incIngest(app, field) {
    const m = app.locals.runtimeMetrics || (app.locals.runtimeMetrics = {});
    const name = 'clientMetric_' + field;
    m[name] = (m[name] || 0) + 1;
}

router.post('/client-metric', express.json(), (req, res) => {
    try {
        const { metrics, ts, path, ua } = req.body || {};
        incIngest(req.app, 'attempts');
        if (!metrics || typeof metrics !== 'object') { incIngest(req.app, 'discard_no_metrics'); return res.status(400).json({ error: 'metrics required' }); }
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'ip';
        const uaStr = (ua || req.headers['user-agent'] || '').slice(0, 80);
        const mode = (process.env.CLIENT_METRIC_KEY_MODE || 'ip').toLowerCase();
        const key = mode === 'ip_ua' ? ip + '|' + uaStr : ip;
        if (!allowClientMetric(key)) { incIngest(req.app, 'rate_limited'); return res.status(429).json({ error: 'rate_limited' }); }
        const MAX = 60000; // clamp for timing metrics
        const clamp = v => (typeof v === 'number' && v >= 0 && v <= MAX ? v : null);
        const clampCls = v => (typeof v === 'number' && v >= 0 && v <= 10 ? v : null);
        const buf = getClientMetricBuffer(req.app);
        const safeMetrics = {
            LCP: clamp(metrics.LCP), CLS: clampCls(metrics.CLS), FID: clamp(metrics.FID), INP: clamp(metrics.INP), FCP: clamp(metrics.FCP), TTFB: clamp(metrics.TTFB),
            LAF: clamp(metrics.LAF), LAF_MAX: clamp(metrics.LAF_MAX)
        };
        // discard payload if all null (avoid noise)
        if (Object.values(safeMetrics).every(v => v == null)) { incIngest(req.app, 'discard_all_null'); return res.status(400).json({ error: 'empty' }); }
        const bytes = JSON.stringify(metrics).length;
        incIngest(req.app, 'accepted');
        const m = req.app.locals.runtimeMetrics; m.clientMetric_bytes = (m.clientMetric_bytes || 0) + bytes;
        buf.push({ ts: ts || Date.now(), metrics: safeMetrics, path: (path || '').slice(0, 120), ua: (ua || '').slice(0, 160) });
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: 'internal' }); }
});

// Aggregated client metrics (guarded)
router.get('/client-metric', (req, res) => {
    if (process.env.NODE_ENV !== 'test' && process.env.ENV_ALLOW_CLIENT_METRIC !== '1') {
        return res.status(403).json({ error: 'forbidden' });
    }
    const buf = getClientMetricBuffer(req.app);
    res.json({ ok: true, ...buf.snapshot() });
});

// --- Real-time Chat API (Redis-optimized) ---

// Get recent chat messages for a room (last 500 messages from Redis + DB fallback)
router.get('/chat/:roomId/messages', async (req, res, next) => {
    try {
        const { roomId } = req.params;
        let { limit = 50 } = req.query;
        limit = Math.max(1, Math.min(500, parseInt(limit, 10) || 50));

        let messages = [];

        if (isRedisEnabled()) {
            try {
                // Get recent messages from Redis List (fast)
                const CHAT_KEY = `chat:${roomId}:messages`;
                const redisMessages = await lRange(CHAT_KEY, 0, limit - 1);
                messages = redisMessages.map(msg => {
                    try { return JSON.parse(msg); } catch { return null; }
                }).filter(Boolean);

                if (messages.length > 0) {
                    return res.json({
                        ok: true,
                        roomId,
                        messages: messages.reverse(), // oldest first for chat display
                        count: messages.length,
                        source: 'redis'
                    });
                }
            } catch (e) {
                console.warn('[chat] Redis fallback to DB:', e.message);
            }
        }

        // Fallback: DB query
        const rows = await query(
            `SELECT id, room_id, user_id, username, content, created_at 
             FROM chat_messages 
             WHERE room_id = ? AND deleted = 0 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [roomId, limit]
        );

        messages = rows.reverse().map(r => ({
            id: r.id,
            roomId: r.room_id,
            userId: r.user_id,
            username: r.username || 'anonymous',
            author: r.username || 'anonymous',
            content: r.content,
            timestamp: r.created_at
        }));

        // metric: fetch (db fallback path)
        const m = req.app.locals.runtimeMetrics; if (m) m.chatMessagesFetched = (m.chatMessagesFetched || 0) + 1;
        res.json({
            ok: true,
            roomId,
            messages,
            count: messages.length,
            source: 'db'
        });
    } catch (e) { next(e); }
});

// Send a chat message (stores in both Redis and DB)
router.post('/chat/:roomId/messages', async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const { content, username, author } = req.body;

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return res.status(400).json({ error: 'content_required' });
        }

        if (content.length > 1000) {
            return res.status(400).json({ error: 'content_too_long' });
        }

        const userId = req.user?.id || null;
        const finalUsername = author || username || req.user?.display_name || 'anonymous';
        const timestamp = new Date();

        // Store in DB for persistence
        const messageId = 'msg_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        await query(
            'INSERT INTO chat_messages(id, room_id, user_id, username, content, created_at) VALUES(?,?,?,?,?,?)',
            [messageId, roomId, userId, finalUsername, content.trim(), timestamp]
        );

        const message = {
            id: messageId,
            roomId,
            userId,
            username: finalUsername,
            author: finalUsername,
            content: content.trim(),
            timestamp: timestamp.toISOString()
        };

        // Store in Redis List for fast recent access
        if (isRedisEnabled()) {
            try {
                const CHAT_KEY = `chat:${roomId}:messages`;
                await lPush(CHAT_KEY, JSON.stringify(message));
                // Keep only recent 500 messages in Redis
                await lTrim(CHAT_KEY, 0, 499);
                const m2 = req.app.locals.runtimeMetrics; if (m2) m2.chatRedisTrim = (m2.chatRedisTrim || 0) + 1;

                // Publish to subscribers for real-time updates
                const CHANNEL = `chat:${roomId}:live`;
                await publish(CHANNEL, JSON.stringify({ type: 'message', data: message }));
            } catch (e) {
                console.warn('[chat] Redis operations failed:', e.message);
            }
        }

        const m = req.app.locals.runtimeMetrics; if (m) m.chatMessagesPosted = (m.chatMessagesPosted || 0) + 1;
        res.status(201).json({ ok: true, message });
    } catch (e) { next(e); }
});

// Get list of active chat rooms
router.get('/chat/rooms', async (req, res, next) => {
    try {
        const rows = await query(`
            SELECT DISTINCT room_id, 
                   COUNT(*) as message_count,
                   MAX(created_at) as last_message_at,
                   (SELECT username FROM chat_messages cm2 
                    WHERE cm2.room_id = cm.room_id 
                    ORDER BY cm2.created_at DESC LIMIT 1) as last_username
            FROM chat_messages cm 
            WHERE deleted = 0 
            GROUP BY room_id 
            ORDER BY last_message_at DESC 
            LIMIT 50
        `);

        const rooms = rows.map(r => ({
            roomId: r.room_id,
            messageCount: r.message_count,
            lastMessageAt: r.last_message_at,
            lastUsername: r.last_username
        }));

        const m = req.app.locals.runtimeMetrics; if (m) m.chatRoomsListed = (m.chatRoomsListed || 0) + 1;
        res.json({ ok: true, rooms });
    } catch (e) { next(e); }
});

// Get list of community chat rooms
router.get('/chat/communities', async (req, res, next) => {
    try {
        const communities = ['free', 'news', 'game', 'image', 'default', 'test'];
        const results = [];

        for (const community of communities) {
            const rows = await query(`
                SELECT COUNT(*) as message_count,
                       MAX(created_at) as last_message_at,
                       (SELECT username FROM chat_messages cm2 
                        WHERE cm2.room_id = ? 
                        ORDER BY cm2.created_at DESC LIMIT 1) as last_username
                FROM chat_messages 
                WHERE room_id = ? AND deleted = 0
            `, [community, community]);

            if (rows.length > 0 && rows[0].message_count > 0) {
                results.push({
                    community,
                    messageCount: rows[0].message_count,
                    lastMessageAt: rows[0].last_message_at,
                    lastUsername: rows[0].last_username
                });
            } else {
                results.push({
                    community,
                    messageCount: 0,
                    lastMessageAt: null,
                    lastUsername: null
                });
            }
        }

        const m = req.app.locals.runtimeMetrics; if (m) m.chatCommunitiesListed = (m.chatCommunitiesListed || 0) + 1;
        res.json({
            ok: true,
            communities: results.map(r => r.community),
            details: results
        });
    } catch (e) { next(e); }
});

// Clear chat history for a specific community/room
router.delete('/chat/:roomId/clear', async (req, res, next) => {
    try {
        const { roomId } = req.params;

        // Mark messages as deleted in DB
        const result = await query(
            'UPDATE chat_messages SET deleted = 1 WHERE room_id = ? AND deleted = 0',
            [roomId]
        );

        let deletedCount = result.affectedRows || 0;

        // Clear Redis cache
        if (isRedisEnabled()) {
            try {
                const CHAT_KEY = `chat:${roomId}:messages`;
                // Redis DEL 嶺뚮ㅏ援앲?????뚮뿭寃???熬곣뫗???濡ル펲嶺?redis.js???怨뺣뼺?
                // ??怨뺣펺?? LTRIM??怨쀬Ŧ ???洹먮봾裕?筌뤾퍔夷?嶺뚮씭??キ?뤿Ь?
                await lTrim(CHAT_KEY, 1, 0); // ?뺢퀡???낅ご???濡?굘 ???깆젧??琉우뿰 ???洹먮봾裕????諛댁뎽
            } catch (e) {
                console.warn('[chat] Redis clear failed:', e.message);
            }
        }

        const m = req.app.locals.runtimeMetrics; if (m) { m.chatClears = (m.chatClears || 0) + 1; }
        res.json({
            ok: true,
            roomId,
            deletedCount,
            message: `${roomId} 嶺???????곕츩??ル벣遊뷸뤆?쎛 ?貫?껆뵳??븐뼔????곕????덈펲.`
        });
    } catch (e) { next(e); }
});

// Comments API
router.get('/posts/:pid/comments', async (req, res, next) => {
    try {
        const comments = await query(`
            SELECT c.*, u.username as author
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            WHERE c.post_id=? AND c.deleted=0
            ORDER BY c.created_at ASC
        `, [req.params.pid]);
        res.json(comments);
    } catch (e) { next(e); }
});

router.post('/posts/:pid/comments', async (req, res, next) => {
    try {
        const { content, parent_id } = req.body;
        if (!content) return res.status(400).json({ error: 'content required' });

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const result = await query(`
            INSERT INTO comments (post_id, user_id, content, parent_id, created_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [req.params.pid, userId, content, parent_id || null]);

        // Send notification to post author
        const [post] = await query('SELECT author_id FROM posts WHERE id=?', [req.params.pid]);
        if (post && post.author_id && post.author_id !== userId) {
            req.app.locals.sendNotification?.(post.author_id, {
                type: 'comment',
                postId: req.params.pid,
                commentId: result.insertId,
                message: '새로운 댓글이 달렸습니다.'
            });
        }

        res.json({ id: result.insertId, ok: true });
    } catch (e) { next(e); }
});

router.put('/comments/:id', async (req, res, next) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ error: 'content required' });

        await query(`
            UPDATE comments SET content=?, updated_at=CURRENT_TIMESTAMP
            WHERE id=? AND deleted=0
        `, [content, req.params.id]);

        res.json({ ok: true });
    } catch (e) { next(e); }
});

router.delete('/comments/:id', async (req, res, next) => {
    try {
        await query('UPDATE comments SET deleted=1 WHERE id=?', [req.params.id]);
        res.json({ ok: true });
    } catch (e) { next(e); }
});

// Voting API
router.post('/posts/:id/vote', async (req, res, next) => {
    try {
        const postId = req.params.id;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const { voteType } = req.body;
        if (!['up', 'down'].includes(voteType)) {
            return res.status(400).json({ error: 'Invalid vote type. Must be "up" or "down"' });
        }

        // Check if vote already exists
        const existingVote = await query('SELECT id, vote_type FROM votes WHERE user_id = ? AND target_type = "post" AND target_id = ?', [userId, postId]);

        if (existingVote.length > 0) {
            if (existingVote[0].vote_type === voteType) {
                return res.status(400).json({ error: 'Already voted' });
            } else {
                // Change vote
                await query('UPDATE votes SET vote_type = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?', [voteType, existingVote[0].id]);
            }
        } else {
            // Insert new vote
            await query('INSERT INTO votes (user_id, target_type, target_id, vote_type, created_at) VALUES (?, "post", ?, ?, CURRENT_TIMESTAMP)', [userId, postId, voteType]);
        }

        res.json({ ok: true });
    } catch (e) { next(e); }
});

router.delete('/posts/:id/vote', async (req, res, next) => {
    try {
        const postId = req.params.id;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        await query('DELETE FROM votes WHERE user_id = ? AND target_type = "post" AND target_id = ?', [userId, postId]);
        res.json({ ok: true });
    } catch (e) { next(e); }
});

router.post('/comments/:id/vote', async (req, res, next) => {
    try {
        const commentId = req.params.id;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        const { voteType } = req.body;
        if (!['up', 'down'].includes(voteType)) {
            return res.status(400).json({ error: 'Invalid vote type. Must be "up" or "down"' });
        }

        // Check if vote already exists
        const existingVote = await query('SELECT id, vote_type FROM votes WHERE user_id = ? AND target_type = "comment" AND target_id = ?', [userId, commentId]);

        if (existingVote.length > 0) {
            if (existingVote[0].vote_type === voteType) {
                return res.status(400).json({ error: 'Already voted' });
            } else {
                // Change vote
                await query('UPDATE votes SET vote_type = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?', [voteType, existingVote[0].id]);
            }
        } else {
            // Insert new vote
            await query('INSERT INTO votes (user_id, target_type, target_id, vote_type, created_at) VALUES (?, "comment", ?, ?, CURRENT_TIMESTAMP)', [userId, commentId, voteType]);
        }

        res.json({ ok: true });
    } catch (e) { next(e); }
});

router.delete('/comments/:id/vote', async (req, res, next) => {
    try {
        const commentId = req.params.id;
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Authentication required' });

        await query('DELETE FROM votes WHERE user_id = ? AND target_type = "comment" AND target_id = ?', [userId, commentId]);
        res.json({ ok: true });
    } catch (e) { next(e); }
});

router.get('/posts/:id/votes', async (req, res, next) => {
    try {
        const postId = req.params.id;
        const votes = await query('SELECT vote_type, COUNT(*) as count FROM votes WHERE target_type = "post" AND target_id = ? GROUP BY vote_type', [postId]);
        const result = { up: 0, down: 0 };
        votes.forEach(v => {
            result[v.vote_type] = v.count;
        });
        res.json(result);
    } catch (e) { next(e); }
});

router.get('/comments/:id/votes', async (req, res, next) => {
    try {
        const commentId = req.params.id;
        const votes = await query('SELECT vote_type, COUNT(*) as count FROM votes WHERE target_type = "comment" AND target_id = ? GROUP BY vote_type', [commentId]);
        const result = { up: 0, down: 0 };
        votes.forEach(v => {
            result[v.vote_type] = v.count;
        });
        res.json(result);
    } catch (e) { next(e); }
});

// Profile API
router.get('/profile/:userId', async (req, res, next) => {
    try {
        const userId = req.params.userId.toString();
        const cached = getCacheEntry(profileCache, userId);
        if (cached) return res.json(cached);

        const overview = await getProfileOverview(userId);
        if (!overview) return res.status(404).json({ error: 'not_found' });

        setCacheEntry(profileCache, userId, overview);
        res.json(overview);
    } catch (e) { next(e); }
});

router.get('/profile/:userId/progress', async (req, res, next) => {
    try {
        const userId = req.params.userId.toString();
        const cached = getCacheEntry(profileProgressCache, userId);
        if (cached) return res.json(cached);

        const payload = await getProfileProgress(userId);
        if (!payload) return res.status(404).json({ error: 'not_found' });

        setCacheEntry(profileProgressCache, userId, payload);
        res.json(payload);
    } catch (e) { next(e); }
});

router.post('/profile/:userId/notifications/ack', (req, res) => {
    const userId = req.params.userId.toString();
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : null;
    acknowledgeProfileNotifications(userId, ids);
    invalidateProfileCaches(userId);
    res.json({ ok: true });
});

// IGDB Game Database Integration
router.get('/games/search', async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: 'query required' });

        // IGDB API 호출 (실제로는 API 키 필요)
        // 여기서는 모의 데이터 반환
        const mockGames = [
            {
                id: 1,
                name: 'The Legend of Zelda: Breath of the Wild',
                release_date: '2017-03-03',
                platforms: ['Nintendo Switch'],
                genres: ['Action', 'Adventure'],
                cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1uqy.jpg'
            },
            {
                id: 2,
                name: 'Super Mario Odyssey',
                release_date: '2017-10-27',
                platforms: ['Nintendo Switch'],
                genres: ['Platform', 'Adventure'],
                cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.jpg'
            }
        ].filter(game => game.name.toLowerCase().includes(q.toLowerCase()));

        res.json(mockGames);
    } catch (e) { next(e); }
});

// Tags API
router.get('/tags', async (req, res, next) => {
    try {
        const rows = await query('SELECT * FROM tags ORDER BY name ASC');
        res.json(rows);
    } catch (e) { next(e); }
});

router.post('/tags', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: 'name required' });
        const [existing] = await query('SELECT id FROM tags WHERE name = ?', [name]);
        if (existing) return res.status(400).json({ error: 'tag already exists' });
        const [result] = await query('INSERT INTO tags (name, description) VALUES (?, ?)', [name, description || '']);
        const [tag] = await query('SELECT * FROM tags WHERE id = ?', [result.insertId]);
        res.status(201).json(tag);
    } catch (e) { next(e); }
});

router.get('/tags/:id', async (req, res, next) => {
    try {
        const [tag] = await query('SELECT * FROM tags WHERE id = ?', [req.params.id]);
        if (!tag) return res.status(404).json({ error: 'tag not found' });
        res.json(tag);
    } catch (e) { next(e); }
});

router.put('/tags/:id', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        await query('UPDATE tags SET name = ?, description = ? WHERE id = ?', [name, description, req.params.id]);
        const [tag] = await query('SELECT * FROM tags WHERE id = ?', [req.params.id]);
        res.json(tag);
    } catch (e) { next(e); }
});

router.delete('/tags/:id', async (req, res, next) => {
    try {
        await query('DELETE FROM tags WHERE id = ?', [req.params.id]);
        res.json({ ok: true });
    } catch (e) { next(e); }
});

// Post Tags API
router.get('/posts/:id/tags', async (req, res, next) => {
    try {
        const rows = await query('SELECT t.* FROM tags t JOIN post_tags pt ON pt.tag_id = t.id WHERE pt.post_id = ?', [req.params.id]);
        res.json(rows);
    } catch (e) { next(e); }
});

router.post('/posts/:id/tags', async (req, res, next) => {
    try {
        const { tagId } = req.body;
        if (!tagId) return res.status(400).json({ error: 'tagId required' });
        await query('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE post_id = post_id', [req.params.id, tagId]);
        res.json({ ok: true });
    } catch (e) { next(e); }
});

router.delete('/posts/:id/tags/:tagId', async (req, res, next) => {
    try {
        await query('DELETE FROM post_tags WHERE post_id = ? AND tag_id = ?', [req.params.id, req.params.tagId]);
        res.json({ ok: true });
    } catch (e) { next(e); }
});

// Broadcasts API
router.get('/broadcasts', async (req, res, next) => {
    try {
        const broadcasts = await query(`
            SELECT b.*, p.title as post_title, p.author
            FROM broadcasts b
            JOIN posts p ON b.post_id = p.id
            WHERE p.deleted = 0
            ORDER BY b.schedule DESC, b.created_at DESC
        `);
        res.json(broadcasts);
    } catch (e) { next(e); }
});

router.post('/broadcasts', async (req, res, next) => {
    try {
        const { post_id, stream_url, is_live, schedule, platform, streamer } = req.body;
        if (!post_id) return res.status(400).json({ error: 'post_id required' });

        const result = await query(`
            INSERT INTO broadcasts (post_id, stream_url, is_live, schedule, platform, streamer)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [post_id, stream_url || '', is_live ? 1 : 0, schedule || null, platform || '', streamer || '']);

        const [broadcast] = await query('SELECT * FROM broadcasts WHERE id = ?', [result.insertId]);
        res.status(201).json(broadcast);
    } catch (e) { next(e); }
});

router.get('/broadcasts/:id', async (req, res, next) => {
    try {
        const [broadcast] = await query(`
            SELECT b.*, p.title as post_title, p.author, p.content
            FROM broadcasts b
            JOIN posts p ON b.post_id = p.id
            WHERE b.id = ? AND p.deleted = 0
        `, [req.params.id]);
        if (!broadcast) return res.status(404).json({ error: 'broadcast not found' });
        res.json(broadcast);
    } catch (e) { next(e); }
});

router.put('/broadcasts/:id', async (req, res, next) => {
    try {
        const { stream_url, is_live, schedule, platform, streamer } = req.body;
        await query(`
            UPDATE broadcasts SET stream_url = ?, is_live = ?, schedule = ?, platform = ?, streamer = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [stream_url || '', is_live ? 1 : 0, schedule || null, platform || '', streamer || '', req.params.id]);

        const [broadcast] = await query('SELECT * FROM broadcasts WHERE id = ?', [req.params.id]);
        res.json(broadcast);
    } catch (e) { next(e); }
});

router.delete('/broadcasts/:id', async (req, res, next) => {
    try {
        await query('DELETE FROM broadcasts WHERE id = ?', [req.params.id]);
        res.json({ ok: true });
    } catch (e) { next(e); }
});

// Spoiler API
router.get('/posts/:id/spoiler', async (req, res, next) => {
    try {
        const [post] = await query('SELECT content FROM posts WHERE id = ? AND deleted = 0', [req.params.id]);
        if (!post) return res.status(404).json({ error: 'post not found' });

        // Simple spoiler: hide content until clicked
        const spoilerContent = `||${post.content}||`; // Markdown style spoiler
        res.json({ spoiler: spoilerContent });
    } catch (e) { next(e); }
});

// 테마 관련 API
router.get('/api/themes', (req, res) => {
    const themes = [
        {
            id: 'cosplay-character',
            name: '코스프레 캐릭터 테마',
            primaryColor: '#FF6B9D',
            secondaryColor: '#4ECDC4',
            fontFamily: 'Arial, sans-serif',
            layout: 'grid'
        },
        {
            id: 'fantasy',
            name: '판타지 테마',
            primaryColor: '#9B59B6',
            secondaryColor: '#F1C40F',
            fontFamily: 'Georgia, serif',
            layout: 'grid'
        },
        {
            id: 'modern',
            name: '현대 테마',
            primaryColor: '#3498DB',
            secondaryColor: '#E74C3C',
            fontFamily: 'Helvetica, sans-serif',
            layout: 'list'
        },
        {
            id: 'anime',
            name: '애니메이션 테마',
            primaryColor: '#E91E63',
            secondaryColor: '#00BCD4',
            fontFamily: 'Comic Sans MS, cursive',
            layout: 'grid'
        },
        {
            id: 'retro',
            name: '레트로 테마',
            primaryColor: '#FF9800',
            secondaryColor: '#795548',
            fontFamily: 'Courier New, monospace',
            layout: 'list'
        }
    ];
    res.json(themes);
});

router.post('/api/themes/save', (req, res) => {
    const { primaryColor, secondaryColor, fontFamily, layout } = req.body;
    // TODO: 실제 DB에 저장
    console.log('Theme saved:', { primaryColor, secondaryColor, fontFamily, layout });
    res.json({ success: true, message: '테마가 저장되었습니다.' });
});

export default router;



















