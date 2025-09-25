import { query } from './db.js';
import 'seedrandom'; // deterministic seeding support for mock generator when seed provided
import { requireAdmin, requireModOrAdmin } from './auth/jwt.js';
import { bufferViewIncrement, __flushAllViewsForTest } from './server.js';
import express from 'express';
import { getClientMetricBuffer } from './metrics-client-buffer.js';
import { isRedisEnabled, zRevRange, lPush, lRange, lTrim, publish } from './redis.js';
import { isMockDatabaseEnabled, listBoards as mockListBoards, listCategories as mockListCategories, getPostsPage as mockGetPostsPage, getAllPostsPage as mockGetAllPostsPage, getPostById as mockGetPostById, incrementViews as mockIncrementViews, getTrending as mockGetTrending, getHomeAggregate as mockGetHomeAggregate, createPost as mockCreatePost, updatePost as mockUpdatePost, deletePost as mockDeletePost, mockSearch, mockGeneratePosts, mockResetPosts, mockStatus, getMetricsSummary as mockGetMetricsSummary } from './mock-data-provider.js';
import { SAMPLE_TITLES, SAMPLE_SNIPPETS, SAMPLE_AUTHORS, SAMPLE_CATEGORIES, SAMPLE_THUMBS, mockRandInt as randInt, mockPick as pick, mockRandomId as randomId } from './mock-samples.js';
const router = express.Router();
const useMockDb = isMockDatabaseEnabled();

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

    router.get('/posts/:pid', (req, res) => {
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
            const post = mockCreatePost(req.params.id, req.body || {});
            res.status(201).json(mapPostForResponse(post));
        } catch (e) {
            if (e.message === 'board_not_found') return res.status(404).json({ error: 'board_not_found' });
            return res.status(400).json({ error: 'invalid_request', message: e.message });
        }
    });

    router.patch('/boards/:id/posts/:pid', (req, res) => {
        const updated = mockUpdatePost(req.params.pid, req.body || {});
        if (!updated) return res.status(404).json({ error: 'not_found' });
        res.json(mapPostForResponse(updated));
    });

    router.delete('/boards/:id/posts/:pid', (req, res) => {
        const ok = mockDeletePost(req.params.pid);
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

// UTF-8 ?묐떟 ?ㅻ뜑 ?ㅼ젙
router.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// --- Simple in-memory cache for /trending (period+limit) ---
const trendingCache = new Map(); // key -> { ts, data }
const TRENDING_TTL_MS = 30_000;

// READONLY 諛고룷 紐⑤뱶: ENV READONLY=1 ?대㈃ write 李⑤떒
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

// Health (verbose ?듭뀡)
router.get('/health', async (req, res, next) => {
    if (!req.query.verbose) return res.json({ ok: true, ts: Date.now() });
    try {
        const started = Date.now();
        // 媛꾨떒 DB ping + 移댁슫??
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
        if (!q) return res.json({ query: q, items: [], count: 0 });
        // Basic sanitize for wildcard heavy input
        if (q.length > 200) q = q.slice(0, 200);
        // Escape % _ characters for LIKE
        const esc = q.replace(/[\\%_]/g, m => '\\' + m);
        const like = '%' + esc + '%';
        const rows = await query(
            `SELECT id, board_id as board, title, author, category, created_at, updated_at
             FROM posts
             WHERE deleted=0 AND (title LIKE ? ESCAPE '\\' OR content LIKE ? ESCAPE '\\')
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [like, like, lim, off]
        );
        // total = ?꾩껜 留ㅼ묶 ??(?섏씠吏?ㅼ씠?섍낵 臾닿?)
        const [{ c: total }] = await query(
            `SELECT COUNT(*) as c FROM posts WHERE deleted=0 AND (title LIKE ? ESCAPE '\\' OR content LIKE ? ESCAPE '\\')`,
            [like, like]
        );
        // Added ok:true for client test harness clarity
        res.json({ ok: true, query: q, items: rows, count: rows.length, total, offset: off, limit: lim });
    } catch (e) { next(e); }
});

// liveness (?꾨줈?몄뒪 ?댁븘?덉쓬 ?먮떒?? 理쒖냼 ?묒뾽)
router.get('/live', (req, res) => { res.json({ ok: true }); });
// readiness (DB 諛?湲곕낯 flush 媛???щ? ?뺤씤)
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
        let { offset = '0', limit = '30', q, approx } = req.query;
        const off = Math.max(0, parseInt(offset, 10) || 0);
        let lim = parseInt(limit, 10) || 30; if (lim <= 0) lim = 30; if (lim > 100) lim = 100;
        const search = (q || '').trim();
        const allowApprox = approx === '1' || approx === 1;
        const relevanceMin = parseFloat(process.env.SEARCH_FULLTEXT_MIN_SCORE || '0');
        let rows = [];
        let total = 0;
        if (search) {
            // FULLTEXT attempt (BOOLEAN MODE) - best effort
            const fulltextSql = `SELECT p.*, p.board_id as board, IFNULL(v.views,0) as views, MATCH(p.title,p.content) AGAINST (? IN BOOLEAN MODE) AS relevance
                FROM posts p LEFT JOIN post_views v ON v.post_id=p.id
                WHERE p.board_id=? AND p.deleted=0 AND MATCH(p.title,p.content) AGAINST (? IN BOOLEAN MODE)
                ORDER BY relevance DESC, p.date DESC, p.created_at DESC
                LIMIT ? OFFSET ?`;
            try {
                rows = await query(fulltextSql, [search, boardId, search, lim + 1, off]);
                if (relevanceMin > 0) {
                    rows = rows.filter(r => (r.relevance || 0) >= relevanceMin);
                }
                // total via separate count (FOUND_ROWS deprecated; keep simple)
                const [cnt] = await query('SELECT COUNT(*) as c FROM posts WHERE board_id=? AND deleted=0 AND MATCH(title,content) AGAINST (? IN BOOLEAN MODE)', [boardId, search]);
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
                    const likeSql = `SELECT p.*, p.board_id as board, IFNULL(v.views,0) as views
                        FROM posts p LEFT JOIN post_views v ON v.post_id=p.id
                        WHERE p.board_id=? AND p.deleted=0 AND ${likeClauses}
                        ORDER BY p.date DESC, p.created_at DESC
                        LIMIT ? OFFSET ?`;
                    rows = await query(likeSql, [boardId, ...likeParams, lim + 1, off]);
                    const countSql = `SELECT COUNT(*) as c FROM posts p WHERE p.board_id=? AND p.deleted=0 AND ${likeClauses}`;
                    const [cnt2] = await query(countSql, [boardId, ...likeParams]);
                    total = cnt2?.c || 0;
                }
            }
        }
        if (!search) {
            const baseSql = `SELECT p.*, p.board_id as board, IFNULL(v.views,0) as views
                FROM posts p LEFT JOIN post_views v ON v.post_id=p.id
                WHERE p.board_id=? AND p.deleted=0
                ORDER BY p.date DESC, p.created_at DESC
                LIMIT ? OFFSET ?`;
            rows = await query(baseSql, [boardId, lim + 1, off]);
            const [cnt] = await query('SELECT COUNT(*) as c FROM posts WHERE board_id=? AND deleted=0', [boardId]);
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
        const { id, title, content, date, tag, thumb, author, category } = req.body;
        if (!title) return res.status(400).json({ error: 'title required' });
        const pid = id || ('p' + Date.now().toString(36));
        // 濡쒓렇???ъ슜??display_name ?먮룞 ?곸슜 (author 誘몄?????
        const finalAuthor = author || (req.user?.display_name ? req.user.display_name : '?듬챸');
        await query('INSERT INTO posts(id,board_id,title,content,date,tag,thumb,author,category) VALUES(?,?,?,?,?,?,?,?,?)', [pid, board, title, content || '', date || null, tag || '', thumb || '', finalAuthor, category || '']);
        const [row] = await query('SELECT id,board_id as board,title,content,date,tag,thumb,author,category,deleted,created_at,updated_at,status,excerpt,hero_media_id,layout_settings,last_edited_at,last_edited_by FROM posts WHERE id=?', [pid]);
        res.status(201).json(row);
    } catch (e) { next(e); }
});
router.patch('/boards/:id/posts/:pid', async (req, res, next) => {
    try {
        const { title, content, date, tag, thumb, author, category } = req.body || {};
        const norm = v => (v === undefined ? null : v);
        await query(
            'UPDATE posts SET title=COALESCE(?,title), content=COALESCE(?,content), date=COALESCE(?,date), tag=COALESCE(?,tag), thumb=COALESCE(?,thumb), author=COALESCE(?,author), category=COALESCE(?,category) WHERE id=?',
            [norm(title), norm(content), norm(date), norm(tag), norm(thumb), norm(author), norm(category), req.params.pid]
        );
        const [row] = await query('SELECT id,board_id as board,title,content,date,tag,thumb,author,category,deleted,created_at,updated_at,status,excerpt,hero_media_id,layout_settings,last_edited_at,last_edited_by FROM posts WHERE id=?', [req.params.pid]);
        res.json(row);
    } catch (e) { next(e); }
});
router.delete('/boards/:id/posts/:pid', async (req, res, next) => {
    try { await query('UPDATE posts SET deleted=1 WHERE id=?', [req.params.pid]); res.json({ ok: true }); } catch (e) { next(e); }
});

// Single post detail (includes views)
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
        // lightweight counts (罹먯떛 怨좊젮 媛??
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
        // 異붽? 蹂댄샇: ?댁쁺 ?섍꼍?먯꽌 NODE_ENV=test媛 ?꾨땲硫?湲곕낯 嫄곕?.
        // 紐낆떆?곸쑝濡?ENV_ALLOW_DEBUG_FLUSH=1 ?ㅼ젙??寃쎌슦?먮쭔 ?덉슜 (濡쒖뺄 湲닿툒 ?붾쾭源??⑸룄)
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
            id: r.id, board: r.board, title: r.title, category: r.category,
            image: r.thumb || null, author: r.author || null, views: r.views || 0,
            created_at: r.created_at, updated_at: r.updated_at, rank: i + 1,
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
            const content = snippet + '\n\n' + '蹂몃Ц ?섑뵆: ' + filler;
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
            username: r.username || '?듬챸',
            author: r.username || '?듬챸',
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
        const finalUsername = author || username || req.user?.display_name || '?듬챸';
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
                // Redis DEL 紐낅졊??援ы쁽???꾩슂?섎떎硫?redis.js??異붽?
                // ?쇰떒? LTRIM?쇰줈 鍮?由ъ뒪?몃줈 留뚮뱾湲?
                await lTrim(CHAT_KEY, 1, 0); // 踰붿쐞瑜??섎せ ?ㅼ젙?섏뿬 鍮?由ъ뒪???앹꽦
            } catch (e) {
                console.warn('[chat] Redis clear failed:', e.message);
            }
        }

        const m = req.app.locals.runtimeMetrics; if (m) { m.chatClears = (m.chatClears || 0) + 1; }
        res.json({
            ok: true,
            roomId,
            deletedCount,
            message: `${roomId} 梨꾪똿 ?덉뒪?좊━媛 珥덇린?붾릺?덉뒿?덈떎.`
        });
    } catch (e) { next(e); }
});

export default router;





