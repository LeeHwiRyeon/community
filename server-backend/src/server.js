import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes.js';
import logger from './logger.js';
import { initSchema, ensureDatabase, query, getPool } from './db.js';
import { runtimeMetrics, recordKeepaliveFailure, recordKeepaliveSuccess } from './metrics-state.js';
import fs from 'fs';
import authRouter from './auth/routes.js';
import { getEnabledProviders, SUPPORTED_PROVIDERS } from './auth/providers.js';
import { buildAuthMiddleware } from './auth/jwt.js';
import helmet from 'helmet';
import { initRedis, zIncrBy, isRedisEnabled } from './redis.js';
import WebSocket, { WebSocketServer } from 'ws';
import promClient from 'prom-client';
import responseTime from 'response-time';

// Ensure .env is loaded even when CWD is project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

export function createApp() {
    const app = express();
    let loggedOnce = false;
    logger.info('app.create start');

    // Prometheus metrics setup
    const register = new promClient.Registry();
    promClient.collectDefaultMetrics({ register });

    // Custom metrics
    const httpRequestDuration = new promClient.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.1, 0.5, 1, 2, 5, 10]
    });
    register.registerMetric(httpRequestDuration);

    const httpRequestsTotal = new promClient.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code']
    });
    register.registerMetric(httpRequestsTotal);

    // Response time middleware
    app.use(responseTime((req, res, time) => {
        const route = req.route ? req.route.path : req.path;
        httpRequestDuration
            .labels(req.method, route, res.statusCode.toString())
            .observe(time / 1000); // Convert to seconds
        httpRequestsTotal
            .labels(req.method, route, res.statusCode.toString())
            .inc();
    }));

    // CORS ?ㅼ젙 - ?꾨줎?몄뿏???꾨찓???덉슜
    const corsOptions = {
        origin: [
            'http://localhost:5173', // Vite 기본 포트
            'http://localhost:5000', // Community 기본 포트
            'http://localhost:5002', // 예비 포트
            'http://localhost:3000', // CRA 기본 포트
            'http://localhost:4173', // Vite preview 포트
            'http://127.0.0.1:5173',
            'http://127.0.0.1:5000',
            'http://127.0.0.1:5002',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:4173'
        ],
        credentials: true, // 荑좏궎 ?덉슜
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    };

    app.use(cors(corsOptions));

    // UTF-8 ?몄퐫???ㅼ젙
    app.use(express.json({
        limit: '1mb',
        type: 'application/json',
        charset: 'utf-8'
    }));
    app.use(express.urlencoded({
        extended: true,
        charset: 'utf-8'
    }));

    // ?묐떟 ?ㅻ뜑??UTF-8 ?몄퐫???ㅼ젙
    app.use((req, res, next) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        next();
    });
    // Helmet (optional disable via DISABLE_HELMET=1)
    if (process.env.DISABLE_HELMET !== '1') {
        // Custom CSP if not disabled by DISABLE_CSP
        const useCsp = process.env.DISABLE_CSP !== '1';
        const allowInline = process.env.ALLOW_INLINE !== '0';
        const cspDirectives = {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", 'data:'],
            styleSrc: allowInline ? ["'self'", "'unsafe-inline'"] : ["'self'"],
            scriptSrc: allowInline ? ["'self'", "'unsafe-inline'"] : ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"]
        };
        app.use(helmet({
            contentSecurityPolicy: useCsp ? { directives: cspDirectives } : false,
            referrerPolicy: { policy: 'same-origin' },
            frameguard: { action: 'deny' },
            noSniff: true, // X-Content-Type-Options: nosniff
            crossOriginEmbedderPolicy: false // avoid issues with media/examples
        }));
    }
    // --- In-memory rate limit state (per IP) ---
    const rlWritePerMin = parseInt(process.env.RATE_LIMIT_WRITE_PER_MIN || '120', 10); // writes per minute
    const rlSearchPerMin = parseInt(process.env.RATE_LIMIT_SEARCH_PER_MIN || '180', 10); // search requests per minute
    const rlWindowMs = 60_000;
    const rlMap = new Map(); // key -> { w:{count,start}, s:{count,start} }
    runtimeMetrics.rlWriteBlocked = runtimeMetrics.rlWriteBlocked || 0;
    runtimeMetrics.rlSearchBlocked = runtimeMetrics.rlSearchBlocked || 0;
    function rateLimitCategory(ip, cat, limit) {
        let slot = rlMap.get(ip);
        const now = Date.now();
        if (!slot) { slot = { w: { count: 0, start: now }, s: { count: 0, start: now } }; rlMap.set(ip, slot); }
        const bucket = slot[cat];
        if (now - bucket.start >= rlWindowMs) { bucket.count = 0; bucket.start = now; }
        bucket.count++;
        return bucket.count <= limit;
    }
    app.use((req, res, next) => {
        try {
            if (req.path.startsWith('/api/')) {
                const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'ip?';
                const m = req.method.toUpperCase();
                if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(m)) {
                    if (!rateLimitCategory(ip, 'w', rlWritePerMin)) { runtimeMetrics.rlWriteBlocked++; return res.status(429).json({ error: 'rate_limited_write' }); }
                } else if (req.path.includes('/posts') && req.method === 'GET' && (req.query?.q || '').trim()) { // search detection
                    if (!rateLimitCategory(ip, 's', rlSearchPerMin)) { runtimeMetrics.rlSearchBlocked++; return res.status(429).json({ error: 'rate_limited_search' }); }
                }
            }
        } catch { /* ignore failures */ }
        next();
    });
    // Basic security headers (can be expanded later)
    app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Referrer-Policy', 'same-origin');
        // Minimal CSP (disabled if DISABLE_CSP=1)
        if (process.env.DISABLE_CSP !== '1') {
            const allowInline = process.env.ALLOW_INLINE !== '0';
            const stylePart = allowInline ? "style-src 'self' 'unsafe-inline'" : "style-src 'self'";
            const scriptPart = allowInline ? "script-src 'self' 'unsafe-inline'" : "script-src 'self'";
            const cspValue = `default-src 'self'; img-src 'self' data:; ${stylePart}; ${scriptPart}; object-src 'none'; frame-ancestors 'none'; base-uri 'self'`;
            res.setHeader('Content-Security-Policy', cspValue);
        }
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        // Expose security headers to browser JS (CORS) so checklist fetch() can read them
        const exposeList = ['Content-Security-Policy', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy'];
        const existingExpose = res.getHeader('Access-Control-Expose-Headers');
        let merged = exposeList.join(', ');
        if (existingExpose) {
            const prev = existingExpose.toString().split(/\s*,\s*/).filter(Boolean);
            for (const h of exposeList) if (!prev.includes(h)) prev.push(h);
            merged = prev.join(', ');
        }
        res.setHeader('Access-Control-Expose-Headers', merged);
        next();
    });
    // (Removed) Legacy static front-end serving ?쒓굅.
    // ?댁쑀: ?꾨줈?앺듃瑜??쒖닔 API 諛깆뿏?쒕줈 ?꾪솚. ?꾩슂 ??ENABLE_STATIC=1 + STATIC_ROOT 濡??щ룄??媛??
    if (process.env.ENABLE_STATIC === '1') {
        try {
            const staticRoot = process.env.STATIC_ROOT || path.join(__dirname, '../../public');
            if (fs.existsSync(staticRoot)) {
                console.log('[static] enabled at', staticRoot);
                app.use(express.static(staticRoot, {
                    setHeaders(res, fp) { if (fp.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache'); }
                }));
            } else {
                console.warn('[static] STATIC_ROOT not found:', staticRoot);
            }
        } catch (e) { console.warn('[static] setup failed', e.message); }
    }
    // Help endpoint (NOT logged intentionally): quick capability map
    app.get('/api/help', (req, res) => {
        res.json({
            ok: true,
            version: 1,
            endpoints: {
                health: '/api/health',
                metrics: '/api/metrics',
                metricsProm: '/api/metrics-prom',
                trending: '/api/trending',
                home: '/api/home',
                boards: '/api/boards',
                posts: '/api/boards/:id/posts',
                postDetail: '/api/posts/:pid',
                mock: ['/api/mock/generate', '/api/mock/reset', '/api/mock/status'],
                auth: '/api/auth/*'
            },
            logging: {
                jsonMode: process.env.LOG_JSON === '1',
                fields: ['m', 'p', 's', 'ms', 'ip', 'ua', 'reqBytes', 'respBytes', 'aborted']
            },
            security: {
                helmet: process.env.DISABLE_HELMET === '1' ? 'disabled' : 'enabled',
                csp: process.env.DISABLE_CSP === '1' ? 'disabled' : 'enabled'
            }
        });
    });

    // HTTP duration histogram (simple buckets)
    const envBuckets = process.env.HTTP_BUCKETS;
    let buckets = [50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000]; // ms default
    if (envBuckets) {
        try {
            const parsed = envBuckets.split(',').map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v) && v > 0).sort((a, b) => a - b);
            if (parsed.length) buckets = parsed;
        } catch { }
    }
    const httpMetrics = { buckets, counts: Array(buckets.length + 1).fill(0), total: 0, sum: 0 };
    app.locals.httpDuration = httpMetrics;
    app.use((req, res, next) => {
        const start = performance.now ? performance.now() : Date.now();
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'ip?';
        const ua = (req.headers['user-agent'] || '').slice(0, 160);
        let reqBytes = 0;
        try { if (req.headers['content-length']) reqBytes = parseInt(req.headers['content-length'], 10) || 0; } catch { }
        let respBytes = 0;
        const origWrite = res.write;
        const origEnd = res.end;
        res.write = function (chunk, encoding, cb) {
            try { if (chunk) { const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding); respBytes += b.length; } } catch { }
            return origWrite.call(this, chunk, encoding, cb);
        };
        res.end = function (chunk, encoding, cb) {
            try { if (chunk) { const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding); respBytes += b.length; } } catch { }
            return origEnd.call(this, chunk, encoding, cb);
        };
        let logged = false;
        function finalize(aborted = false) {
            if (logged) return; logged = true;
            const end = performance.now ? performance.now() : Date.now();
            const dur = end - start;
            httpMetrics.total++; httpMetrics.sum += dur;
            let placed = false;
            for (let i = 0; i < buckets.length; i++) { if (dur <= buckets[i]) { httpMetrics.counts[i]++; placed = true; break; } }
            if (!placed) httpMetrics.counts[httpMetrics.counts.length - 1]++;
            if (req.path.startsWith('/api') && req.path !== '/api/help') {
                logger.info(aborted ? 'req.abort' : 'req.done', {
                    m: req.method,
                    p: req.path,
                    s: res.statusCode,
                    ms: Math.round(dur),
                    ip,
                    ua,
                    reqBytes,
                    respBytes,
                    aborted
                });
            }
        }
        res.on('finish', () => finalize(false));
        res.on('close', () => { if (!res.writableEnded) finalize(true); });
        if (req.path.startsWith('/api') && req.path !== '/api/help') {
            try { logger.info('req.start', { m: req.method, p: req.path, ip, ua, reqBytes }); } catch { }
        }
        next();
    });
    // Attach auth (JWT) context early for /api routes (always enabled; providers can still be empty)
    app.use(buildAuthMiddleware(query));
    // --- Enhanced WAF (Web Application Firewall) pattern filter ---
    const suspiciousPatterns = [
        // SQL Injection patterns
        /union\s+select/i,
        /select\s+.*\s+from/i,
        /insert\s+into/i,
        /update\s+.*\s+set/i,
        /delete\s+from/i,
        /drop\s+table/i,
        /drop\s+database/i,
        /alter\s+table/i,
        /create\s+table/i,
        /exec\s+.*\(/i,
        /execute\s+.*\(/i,
        /script\s+.*language/i,
        /;\s*--/i,  // SQL comment injection
        /\/\*.*\*\//i,  // SQL block comments
        /\b(union|select|insert|update|delete|drop|alter|create|exec|execute)\b.*\b(from|into|table|database)\b/i,

        // XSS patterns
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload\s*=/i,
        /onerror\s*=/i,
        /onclick\s*=/i,
        /onmouseover\s*=/i,
        /onmouseout\s*=/i,
        /onkeydown\s*=/i,
        /onkeyup\s*=/i,
        /onkeypress\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /<form/i,
        /<input/i,
        /<meta/i,
        /expression\s*\(/i,
        /vbscript\s*:/i,
        /data\s*:\s*text\/html/i,

        // Path traversal
        /\.\.\//i,
        /\.\\/i,
        /%2e%2e%2f/i,  // URL encoded ../
        /%2e%5c/i,      // URL encoded .\

        // Command injection
        /\|\s*cat/i,
        /\|\s*ls/i,
        /\|\s*rm/i,
        /\|\s*wget/i,
        /\|\s*curl/i,
        /;\s*cat/i,
        /;\s*ls/i,
        /;\s*rm/i,
        /;\s*wget/i,
        /;\s*curl/i,
        /`\s*.*\s*`/i,  // Backtick execution

        // File inclusion
        /include\s*\(/i,
        /require\s*\(/i,
        /file_get_contents/i,
        /fopen\s*\(/i,

        // PHP specific (in case of mixed environments)
        /<\?php/i,
        /eval\s*\(/i,
        /assert\s*\(/i,
        /preg_replace.*\/e/i,

        // General suspicious patterns
        /\b(admin|root|system|config|backup|dump)\b.*\b(pass|pwd|password|secret|key|token)\b/i,
        /base64_decode/i,
        /system\s*\(/i,
        /shell_exec/i,
        /passthru/i,
        /proc_open/i,
        /popen/i
    ];
    app.use((req, res, next) => {
        try {
            if (req.method === 'GET' || req.path.startsWith('/api')) {
                const blob = [req.url, JSON.stringify(req.body || {})].join(' ').slice(0, 2000);

                // Check for suspicious patterns
                for (const pattern of suspiciousPatterns) {
                    if (pattern.test(blob)) {
                        const m = req.app.locals.runtimeMetrics || (req.app.locals.runtimeMetrics = {});
                        m.secBlocked = (m.secBlocked || 0) + 1;
                        logger.warn('sec.block', {
                            ip: req.socket.remoteAddress,
                            p: req.path,
                            pattern: pattern.toString(),
                            ua: req.headers['user-agent']?.slice(0, 100)
                        });
                        return res.status(400).json({
                            error: 'request_blocked',
                            message: 'Suspicious request pattern detected'
                        });
                    }
                }
            }
        } catch (e) {
            logger.warn('sec.filter.error', { msg: e.message });
        }
        next();
    });
    app.use('/api', router);
    logger.info('routes.mounted');

    // Health check endpoint
    app.get('/api/health', async (req, res) => {
        try {
            // Database health check
            const dbHealthy = await query('SELECT 1').then(() => true).catch(() => false);

            // Redis health check
            const redisHealthy = isRedisEnabled() ?
                await new Promise(resolve => {
                    initRedis().then(() => resolve(true)).catch(() => resolve(false));
                }) : true;

            const health = {
                status: dbHealthy && redisHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.env.npm_package_version || '1.0.0',
                checks: {
                    database: dbHealthy ? 'ok' : 'error',
                    redis: redisHealthy ? 'ok' : 'error'
                }
            };

            res.status(health.status === 'healthy' ? 200 : 503).json(health);
        } catch (error) {
            logger.error('health.check.error', { error: error.message });
            res.status(503).json({
                status: 'error',
                timestamp: new Date().toISOString(),
                error: error.message
            });
        }
    });

    // Prometheus metrics endpoint
    app.get('/api/metrics', async (req, res) => {
        try {
            res.set('Content-Type', register.contentType);
            const metrics = await register.metrics();
            res.end(metrics);
        } catch (error) {
            logger.error('metrics.endpoint.error', { error: error.message });
            res.status(500).end();
        }
    });

    // Startup provider env validation (log once)
    try {
        if (!global.__AUTH_PROVIDER_LOGGED_ONCE__) {
            global.__AUTH_PROVIDER_LOGGED_ONCE__ = true;
            const enabled = getEnabledProviders(process.env);
            const table = SUPPORTED_PROVIDERS.map(p => {
                const cid = process.env[`OAUTH_${p.toUpperCase()}_CLIENT_ID`];
                const csec = process.env[`OAUTH_${p.toUpperCase()}_CLIENT_SECRET`];
                return {
                    provider: p,
                    enabled: enabled.includes(p),
                    hasClientId: !!cid,
                    hasSecret: !!csec
                };
            });
            console.log('[auth] Provider configuration summary');
            table.forEach(r => console.log(` - ${r.provider}: enabled=${r.enabled} clientId=${r.hasClientId} secret=${r.hasSecret}`));
        }
    } catch { /* ignore logging failures */ }
    app.use('/api/auth', authRouter);

    // API 404 handler - must be after all API routes
    app.use('/api/*', (req, res) => {
        res.status(404).json({ error: 'not_found', message: 'API endpoint not found' });
    });

    app.use((err, req, res, next) => {
        // Enhanced error handling with security considerations
        const isDev = process.env.NODE_ENV !== 'production';
        const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Log error securely - never expose stack traces in production logs
        const logData = {
            errorId,
            message: err?.message || 'Unknown error',
            stack: isDev ? err?.stack : undefined, // Only include stack in development
            url: req?.url,
            method: req?.method,
            ip: req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req?.socket?.remoteAddress,
            ua: req?.headers?.['user-agent']?.slice(0, 100),
            timestamp: new Date().toISOString()
        };

        logger.error('api.error', logData);

        // Determine appropriate status code and response
        let statusCode = 500;
        let errorType = 'internal_error';

        if (err?.statusCode) {
            statusCode = err.statusCode;
        } else if (err?.name === 'ValidationError') {
            statusCode = 400;
            errorType = 'validation_error';
        } else if (err?.name === 'UnauthorizedError' || err?.name === 'JsonWebTokenError') {
            statusCode = 401;
            errorType = 'authentication_error';
        } else if (err?.name === 'ForbiddenError') {
            statusCode = 403;
            errorType = 'authorization_error';
        } else if (err?.code === 'ER_DUP_ENTRY') {
            statusCode = 409;
            errorType = 'duplicate_entry';
        } else if (err?.code === 'ER_NO_SUCH_TABLE') {
            statusCode = 500;
            errorType = 'database_error';
        }

        // Safe error response - never expose internal details
        const payload = {
            error: errorType,
            message: isDev ? err?.message : 'An internal error occurred',
            errorId: isDev ? errorId : undefined // Only show error ID in development
        };

        // Add additional context for client-side debugging in development
        if (isDev && err?.details) {
            payload.details = err.details;
        }

        res.status(statusCode).json(payload);
    });
    app.locals.runtimeMetrics = runtimeMetrics;
    // attach view buffer reference for route handler access if needed later
    app.locals.viewBuffer = viewBuffer;
    return app;
}

export async function bootstrap(options = {}) {
    // 湲곕낯 ?ы듃 50000 怨좎젙 ?쒖옉. ?먯쑀(EADDRINUSE) ??+1??利앷? (理쒕? 20???쒕룄)
    // ?듭뀡?쇰줈 port 紐낆떆 ??洹?媛믪쓣 ?쒕룄 ?쒖옉?먯쑝濡??ъ슜.
    let basePort = parseInt(options.port || process.env.PORT || '50000', 10);
    if (isNaN(basePort) || basePort <= 0) basePort = 50000;
    let PORT = basePort;
    const maxAttempts = 20;
    let attempt = 0;
    while (attempt < maxAttempts) {
        try {
            // Test bind by creating a temporary server BEFORE heavy init? We need DB/Redis init first anyway for consistency.
            // We'll break once listen succeeds below; here just set desired PORT.
            break;
        } catch { /* not used (kept for any future pre-bind) */ }
    }
    ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME'].forEach(k => { if (!process.env[k]) console.warn('[warn] missing env', k); });
    await ensureDatabase();
    await initSchema();

    // Initialize Redis connection
    const redisInfo = await initRedis();
    logger.info('redis.init', redisInfo);

    // Initialize trending ranking data from DB to Redis
    if (isRedisEnabled()) {
        try {
            const trendingRows = await query(`
                SELECT p.id, IFNULL(v.views, 0) as views 
                FROM posts p 
                LEFT JOIN post_views v ON v.post_id = p.id 
                WHERE p.deleted = 0 AND IFNULL(v.views, 0) > 0
                ORDER BY views DESC 
                LIMIT 1000
            `);

            const TRENDING_KEY = 'trending:posts';
            let syncCount = 0;
            for (const row of trendingRows) {
                if (row.views > 0) {
                    await zIncrBy(TRENDING_KEY, row.id, row.views);
                    syncCount++;
                }
            }
            logger.info('trending.sync', { synced: syncCount, total: trendingRows.length });
        } catch (e) {
            logger.warn('trending.sync.failed', { msg: e.message });
        }
    }
    try {
        const rows = await query('SELECT COUNT(*) as c FROM boards');
        // 紐⑥쓽 紐⑤뱶?먯꽌??鍮?諛곗뿴??諛섑솚?섎?濡?湲곕낯媛?泥섎━
        const boardCount = rows && rows.length > 0 ? rows[0].c : 0;
        if (boardCount === 0) {
            console.log('[init] empty boards -> importing initial JSON');
            const mod = await import('../scripts/import-initial.js');
            if (mod && mod.default) await mod.default();
        }
        // Seed sample streaming events if no published events exist yet
        try {
            const eventRows = await query("SELECT COUNT(*) as c FROM events WHERE status='published'");
            // 紐⑥쓽 紐⑤뱶?먯꽌??鍮?諛곗뿴??諛섑솚?섎?濡?湲곕낯媛?泥섎━
            const eventCount = eventRows && eventRows.length > 0 ? eventRows[0].c : 0;
            if (eventCount === 0) {
                const now = new Date();
                const addMin = m => new Date(now.getTime() + m * 60000);
                const samples = [
                    {
                        title: '[?앸갑?? 濡?梨뚮┛? ?밴툒???꾩쟾!',
                        body: '?쒕뵒??梨뚮┛? ?밴툒?? 媛숈씠 ?묒썝?댁＜?몄슂!',
                        starts_at: addMin(-30), ends_at: addMin(90), location: 'Online', status: 'published',
                        meta_json: JSON.stringify({ streamUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', isLive: true, viewers: 2341 })
                    },
                    {
                        title: '[라이브 방송] 게임 토론 및 Q&A 세션',
                        body: '실시간 게임 토론 및 Q&A 세션에 참여하세요!',
                        starts_at: addMin(120), ends_at: addMin(240), location: 'Online', status: 'published',
                        meta_json: JSON.stringify({ isLive: false, viewers: 0 })
                    },
                    {
                        title: '[?ㅼ떆蹂닿린] ?먯떊 ?좉퇋 罹먮┃??戮묎린',
                        body: '?좉퇋 5??罹먮┃??戮묎린 ?섏씠?쇱씠??',
                        starts_at: addMin(-1440), ends_at: addMin(-1380), location: 'Online', status: 'published',
                        meta_json: JSON.stringify({ streamUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', isLive: false, viewers: 0 })
                    }
                ];
                for (const ev of samples) {
                    await query('INSERT INTO events(title,body,starts_at,ends_at,location,status,meta_json) VALUES(?,?,?,?,?,?,?)', [ev.title, ev.body, ev.starts_at, ev.ends_at, ev.location, ev.status, ev.meta_json]);
                }
                console.log('[init] seeded sample streaming events:', samples.length);
            }
        } catch (e) { console.warn('[init] seed events failed', e.message); }
    } catch (e) { console.warn('[init] import check failed', e.message); }

    const app = createApp();
    let server;
    async function startListen(currentPort, remainingAttempts) {
        return new Promise((resolve, reject) => {
            const s = app.listen(currentPort, '127.0.0.1', () => {
                PORT = currentPort;
                process.env.PORT = String(PORT); // export for any child scripts
                logger.event('server.listen', { port: PORT });
                resolve(s);
            });
            s.on('error', async (err) => {
                if (err.code === 'EADDRINUSE' && remainingAttempts > 0) {
                    logger.warn('port.in.use', { port: currentPort, next: currentPort + 1 });
                    setTimeout(() => {
                        startListen(currentPort + 1, remainingAttempts - 1).then(resolve).catch(reject);
                    }, 150);
                } else {
                    reject(err);
                }
            });
        });
    }
    try {
        server = await startListen(PORT, maxAttempts - 1);
    } catch (e) {
        console.error('[fatal] Failed to bind any port starting at', basePort, e.message);
        throw e;
    }
    const boundPort = PORT;
    logger.info('port.final', { port: boundPort, start: basePort });
    const serverRef = server;
    const srvApp = app;

    // WebSocket server for real-time notifications
    const wss = new WebSocketServer({ server });
    const userConnections = new Map(); // userId -> Set of WebSocket connections

    wss.on('connection', (ws, req) => {
        // Extract userId from query params or auth
        const url = new URL(req.url, 'http://localhost');
        const userId = url.searchParams.get('userId');
        if (userId) {
            if (!userConnections.has(userId)) {
                userConnections.set(userId, new Set());
            }
            userConnections.get(userId).add(ws);
            ws.on('close', () => {
                userConnections.get(userId)?.delete(ws);
                if (userConnections.get(userId)?.size === 0) {
                    userConnections.delete(userId);
                }
            });
        }
    });

    // Function to send notification to user
    function sendNotification(userId, notification) {
        const connections = userConnections.get(userId);
        if (connections) {
            connections.forEach(ws => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(notification));
                }
            });
        }
    }

    // Export for use in routes
    srvApp.locals.wss = wss;
    srvApp.locals.sendNotification = sendNotification;
    // Wrap original post-listen logic in immediate async block
    (async () => {
        logger.event('server.listen', { port: PORT });
        setTimeout(async () => {
            try {
                const res = await fetch(`http://localhost:${PORT}/api/health`);
                if (!res.ok) console.warn('[selfPing] non-200', res.status);
            } catch (e) { console.warn('[selfPing] failed', e.message); }
        }, 600);
        let keepFail = 0;
        const keepTimer = setInterval(async () => {
            try { await query('SELECT 1'); keepFail = 0; recordKeepaliveSuccess(); }
            catch (e) {
                keepFail++; recordKeepaliveFailure(e); console.error('[keepalive] query failed', e.message, 'failCount=', keepFail);
                if (keepFail >= 5) { console.error('[keepalive] consecutive failures >=5 -> exiting for restart'); clearInterval(keepTimer); gracefulShutdown(serverRef, 1); }
            }
        }, 10000);
        ['SIGINT', 'SIGTERM'].forEach(sig => process.on(sig, () => { logger.event('signal', { sig }); gracefulShutdown(serverRef, 0); }));
        process.on('unhandledRejection', (reason) => { logger.error('unhandledRejection', { reason: reason?.message || String(reason) }); });
        process.on('uncaughtException', (err) => { logger.error('uncaughtException', { err: err?.message }); });
        process.on('exit', (code) => { logger.event('process.exit', { code }); });
        // Optional client metric export loop
        const exportUrl = process.env.CLIENT_METRIC_EXPORT_URL;
        if (exportUrl) {
            let lastExportCount = 0;
            const intervalMs = parseInt(process.env.CLIENT_METRIC_EXPORT_INTERVAL_MS || '60000', 10);
            const exportTimer = setInterval(async () => {
                try {
                    runtimeMetrics.clientMetric_export_attempts = (runtimeMetrics.clientMetric_export_attempts || 0) + 1;
                    const buf = srvApp.locals.clientMetricBuffer;
                    if (!buf) return;
                    const snap = buf.snapshot();
                    if (!snap || snap.collected === lastExportCount) return; // no new data
                    lastExportCount = snap.collected;
                    const payload = { ts: Date.now(), metrics: snap };
                    const res = await fetch(exportUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    if (!res.ok) { console.warn('[clientMetricExport] non-200', res.status); runtimeMetrics.clientMetric_export_fail = (runtimeMetrics.clientMetric_export_fail || 0) + 1; }
                    else runtimeMetrics.clientMetric_export_success = (runtimeMetrics.clientMetric_export_success || 0) + 1;
                } catch (e) { console.warn('[clientMetricExport] failed', e.message); runtimeMetrics.clientMetric_export_fail = (runtimeMetrics.clientMetric_export_fail || 0) + 1; }
            }, intervalMs);
            serverRef.on('close', () => clearInterval(exportTimer));
        }
        // --- Mock data auto cleanup task ---
        try {
            const maxAgeDays = parseInt(process.env.MOCK_MAX_AGE_DAYS || '30', 10);
            const cleanupIntervalMs = 3600_000; // 1h
            if (maxAgeDays > 0) {
                setInterval(async () => {
                    try {
                        const cutoff = new Date(Date.now() - maxAgeDays * 86400000);
                        const r = await query("DELETE FROM posts WHERE tag='mock' AND created_at < ?", [cutoff]);
                        if (r?.affectedRows) logger.event('mock.cleanup', { removed: r.affectedRows, olderThanDays: maxAgeDays });
                    } catch (e) { logger.warn('mock.cleanup.fail', { msg: e.message }); }
                }, cleanupIntervalMs);
                logger.info('mock.cleanup.enabled', { maxAgeDays });
            }
        } catch { }
    })();
    return { app: srvApp, server: serverRef };
}

// --- View batching (in-memory) ---
// Map: postId -> { pending: number, last: timestamp }
const viewBuffer = new Map();
const VIEW_FLUSH_INTERVAL_MS = parseInt(process.env.VIEW_FLUSH_INTERVAL_MS || '1500', 10);
const VIEW_MAX_PENDING = parseInt(process.env.VIEW_MAX_PENDING || '20', 10); // flush immediately if a single post accumulates this many
const VIEW_BUFFER_MAX_TOTAL = parseInt(process.env.VIEW_BUFFER_MAX_TOTAL || '10000', 10); // total pending threshold
const VIEW_MAX_BACKOFF_MS = parseInt(process.env.VIEW_MAX_BACKOFF_MS || '8000', 10);
runtimeMetrics.viewBufferedAdds = runtimeMetrics.viewBufferedAdds || 0;
runtimeMetrics.viewFlushBatches = runtimeMetrics.viewFlushBatches || 0;
runtimeMetrics.viewFlushRows = runtimeMetrics.viewFlushRows || 0;
runtimeMetrics.viewFlushFailures = runtimeMetrics.viewFlushFailures || 0;
runtimeMetrics.viewForcedFlushes = runtimeMetrics.viewForcedFlushes || 0;
runtimeMetrics.viewFlushDropped = runtimeMetrics.viewFlushDropped || 0;
runtimeMetrics.viewBackoffRetries = runtimeMetrics.viewBackoffRetries || 0;

export function bufferViewIncrement(postId) {
    if (!postId) return;
    let slot = viewBuffer.get(postId);
    if (!slot) { slot = { pending: 0, last: Date.now() }; viewBuffer.set(postId, slot); }
    slot.pending += 1; slot.last = Date.now();
    runtimeMetrics.viewBufferedAdds += 1;
    if (slot.pending >= VIEW_MAX_PENDING) flushSpecific(postId); // immediate flush threshold
    // total guard
    const totalPending = getTotalPending();
    if (totalPending >= VIEW_BUFFER_MAX_TOTAL) {
        console.warn('[viewBuffer] total pending >= threshold -> forced flush', totalPending, 'threshold', VIEW_BUFFER_MAX_TOTAL);
        runtimeMetrics.viewForcedFlushes += 1;
        flushAllViews(true);
    }
}

async function flushSpecific(postId) {
    const slot = viewBuffer.get(postId);
    if (!slot || slot.pending <= 0) return;
    const count = slot.pending; slot.pending = 0; // reset early to prevent double counting
    try {
        await query('INSERT INTO post_views(post_id,views) VALUES(?,?) ON DUPLICATE KEY UPDATE views=views+VALUES(views)', [postId, count]);
        runtimeMetrics.viewFlushRows += 1;
    } catch (e) {
        // revert so we can retry next cycle
        slot.pending += count;
        console.warn('[viewBuffer] flushSpecific failed', postId, e.message);
    }
}

async function flushAllViews(force = false, _retryMeta = { attempt: 0 }) {
    if (viewBuffer.size === 0) return;
    const batch = []; // {id,count}
    const now = Date.now();
    for (const [pid, slot] of viewBuffer) {
        if (slot.pending <= 0) continue;
        if (force || (now - slot.last) >= VIEW_FLUSH_INTERVAL_MS) {
            batch.push([pid, slot.pending]);
            slot.pending = 0;
        }
    }
    if (!batch.length) return;
    runtimeMetrics.viewFlushBatches += 1;
    // single multi-row insert using UNION ALL pattern
    const values = batch.map(() => '(?,?)').join(',');
    const params = batch.flat();
    const sql = 'INSERT INTO post_views(post_id,views) VALUES ' + values + ' ON DUPLICATE KEY UPDATE views=views+VALUES(views)';
    try {
        await query(sql, params);
        runtimeMetrics.viewFlushRows += batch.length;

        // Update Redis trending scores in parallel
        if (isRedisEnabled()) {
            try {
                const TRENDING_KEY = 'trending:posts';
                const redisPromises = batch.map(([pid, count]) =>
                    zIncrBy(TRENDING_KEY, pid, count).catch(e =>
                        logger.warn('redis.trending.update.failed', { postId: pid, count, msg: e.message })
                    )
                );
                await Promise.allSettled(redisPromises);
            } catch (e) {
                logger.warn('redis.trending.batch.failed', { msg: e.message });
            }
        }
    } catch (e) {
        runtimeMetrics.viewFlushFailures += 1;
        const attempt = _retryMeta.attempt || 0;
        console.warn('[viewBuffer] batch flush failed (attempt', attempt, ')', e.message);
        // revert counts for possible retry
        batch.forEach(([pid, cnt]) => {
            const slot = viewBuffer.get(pid) || { pending: 0, last: now };
            slot.pending += cnt; slot.last = now; viewBuffer.set(pid, slot);
        });
        if (attempt < 6) { // retry with exponential backoff
            const backoff = Math.min(VIEW_MAX_BACKOFF_MS, 100 * Math.pow(2, attempt));
            runtimeMetrics.viewBackoffRetries += 1;
            setTimeout(() => { flushAllViews(force, { attempt: attempt + 1 }); }, backoff);
        } else {
            console.error('[viewBuffer] flush giving up after attempts=', attempt);
        }
    }
}

function getTotalPending() {
    let sum = 0; for (const v of viewBuffer.values()) sum += v.pending; return sum;
}

const viewFlushTimer = setInterval(() => { flushAllViews(false); }, VIEW_FLUSH_INTERVAL_MS);

// test helper (exported) - force flush immediately and return batch size attempted
export async function __flushAllViewsForTest() {
    const before = runtimeMetrics.viewFlushRows;
    await flushAllViews(true);
    const afterFirst = runtimeMetrics.viewFlushRows;
    // If nothing flushed but there are still pending counts (possible if batch flush failed and scheduled retry), do a synchronous per-key fallback.
    let fallbackFlushed = 0;
    let remainingPending = 0;
    for (const [pid, slot] of viewBuffer) remainingPending += (slot?.pending || 0);
    if ((afterFirst - before) === 0 && remainingPending > 0) {
        for (const [pid, slot] of viewBuffer) {
            if (!slot || slot.pending <= 0) continue;
            const count = slot.pending; slot.pending = 0; // optimistic reset
            try {
                await query('INSERT INTO post_views(post_id,views) VALUES(?,?) ON DUPLICATE KEY UPDATE views=views+VALUES(views)', [pid, count]);
                runtimeMetrics.viewFlushRows += 1; // one row per post id
                fallbackFlushed += 1;
            } catch (e) {
                // restore so test caller can see remaining
                slot.pending += count;
            }
        }
    }
    const finalRows = runtimeMetrics.viewFlushRows;
    let finalPending = 0; for (const v of viewBuffer.values()) finalPending += v.pending;
    return { batchAddedRows: afterFirst - before, fallbackFlushed, totalRows: finalRows, finalPending };

}

export function __stopBackgroundTimersForTest() {
    clearInterval(viewFlushTimer);
}

async function shutdownViewBuffer() {
    clearInterval(viewFlushTimer);
    await flushAllViews(true);
}

async function gracefulShutdown(server, code) {
    try {
        await shutdownViewBuffer();
        server.close(() => { console.log('[shutdown] http server closed'); });
        try { await getPool().end(); console.log('[shutdown] db pool closed'); } catch (e) { console.warn('[shutdown] pool close error', e.message); }
    } finally {
        setTimeout(() => process.exit(code), 300);
    }
}

function logProcessError(type, err) {
    const line = `[${new Date().toISOString()}] ${type}: ${err?.stack || err?.message || err}\n`;
    try { fs.appendFileSync('server-error.log', line); } catch { /* ignore */ }
    console.error(type, err);
}
process.on('unhandledRejection', err => logProcessError('unhandledRejection', err));
process.on('uncaughtException', err => logProcessError('uncaughtException', err));

// If run directly (node src/server.js) we bootstrap.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('server.js')) {
    bootstrap();
}


