// Simple random API integration test (no external libs)
// Usage: NODE_ENV=test node tests/api-random.js
import 'dotenv/config';
// Ensure test env flag early so embedded server exposes debug endpoints
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'test';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let BASE = process.env.TEST_BASE || null; // set later if embedded

function randId(prefix = 'x') { return prefix + Math.random().toString(36).slice(2, 10); }
function randWord() { return Math.random().toString(36).slice(2, 7); }
function randTitle() { return '제목-' + randWord() + '-' + Date.now().toString(36); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function json(method, path, body, attempt = 1) {
    try {
        const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
        let data = null; try { data = await r.json(); } catch { }
        if (!r.ok) { throw new Error(method + ' ' + path + ' ' + r.status + ' ' + JSON.stringify(data)); }
        return data;
    } catch (e) {
        if (attempt < 2) {
            await sleep(150);
            return json(method, path, body, attempt + 1);
        }
        throw e;
    }
}

async function waitForHealth(maxAttempts = 20) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const r = await fetch(BASE + '/health');
            if (r.ok) return true;
        } catch { /* ignore */ }
        await sleep(150);
    }
    return false;
}

let embedded = false;
let embeddedServer = null;
async function maybeEmbedServer() {
    if (!BASE) BASE = 'http://localhost:' + (process.env.PORT || 50000) + '/api';
    const healthy = await waitForHealth(5);
    if (healthy) return;
    console.log('[auto-embed] no healthy server detected -> bootstrap in-process');
    const { bootstrap } = await import(pathToFileURL(path.resolve(__dirname, '../src/server.js')).href);
    const { server } = await bootstrap({ port: 0 }); // ephemeral port
    const port = server.address().port;
    BASE = 'http://localhost:' + port + '/api';
    embedded = true; embeddedServer = server;
    const ok = await waitForHealth(60);
    if (!ok) throw new Error('embedded server failed to become healthy');
    console.log('[auto-embed] server healthy (embedded, port=' + port + ')');
}

async function run() {
    await maybeEmbedServer();
    const report = [];
    function pass(name, extra) { report.push({ name, ok: true, extra }); console.log('✅', name); }
    function fail(name, err) { report.push({ name, ok: false, err: err.message }); console.error('❌', name, err); }

    // 1. Health
    try { const h = await json('GET', '/health'); pass('health', h); } catch (e) { fail('health', e); }

    // 2. Create board
    const boardId = 'b_' + randWord();
    try { const b = await json('POST', '/boards', { id: boardId, title: '랜덤보드 ' + randWord(), ordering: 900 }); pass('create board', b); } catch (e) { fail('create board', e); }

    // 3. List boards includes new
    try { const list = await json('GET', '/boards'); if (!list.find(b => b.id === boardId)) throw new Error('board not in list'); pass('list boards'); } catch (e) { fail('list boards', e); }

    // 4. Create initial posts (parallel limited)
    const postIds = []; const N = 3;
    {
        const tasks = Array.from({ length: N }).map((_, i) => {
            const pid = randId('p_');
            return (async () => {
                try {
                    await json('POST', `/boards/${boardId}/posts`, { id: pid, title: randTitle(), content: '내용 ' + randWord(), date: new Date().toISOString().slice(0, 10), tag: 't' + i, author: 'tester' });
                    postIds.push(pid); pass('create post ' + pid);
                } catch (e) { fail('create post ' + i, e); }
            })();
        });
        await Promise.all(tasks);
    }

    // 5. Get posts list (paginated response shape)
    try {
        const page = await json('GET', `/boards/${boardId}/posts`);
        if (!Array.isArray(page.items)) throw new Error('items missing');
        if (page.items.length < postIds.length) throw new Error('missing posts in first page');
        pass('list posts', { count: page.items.length, total: page.total });
    } catch (e) { fail('list posts', e); }

    // 6. Update first post
    if (postIds[0]) {
        try { const up = await json('PATCH', `/boards/${boardId}/posts/${postIds[0]}`, { title: '수정제목 ' + randWord() }); if (!up.title.startsWith('수정제목')) throw new Error('update failed'); pass('update post'); } catch (e) { fail('update post', e); }
    }

    // 7. Increment view on first post (buffered) - fire multiple, then wait for flush and verify via posts list + single detail
    if (postIds[0]) {
        try {
            for (let i = 0; i < 5; i++) await json('POST', `/posts/${postIds[0]}/view`);
            const interval = parseInt(process.env.VIEW_FLUSH_INTERVAL_MS || '1500', 10);
            const baseWait = Math.max(800, interval + 120);
            await sleep(baseWait);
            let target = null;
            let attempts = 0;
            let lastViews = 0;
            while (attempts < 5) {
                attempts++;
                // 테스트 모드에서는 첫 polling 전에 강제 flush 한 번 시도해 결정적 상태 확보
                if (attempts === 1 && process.env.NODE_ENV === 'test') {
                    try {
                        const flushRes = await json('POST', '/debug/flush-views');
                        globalThis.__lastFlushInfo = flushRes;
                    } catch { /* ignore */ }
                }
                const pageAfter = await json('GET', `/boards/${boardId}/posts?limit=60&offset=0`);
                target = (pageAfter.items || []).find(p => p.id === postIds[0]);
                if (target) {
                    lastViews = target.views || 0;
                    if (lastViews >= 5) break;
                }
                // metrics hint: if flush batches already seen, we can shorten remaining waits
                try {
                    const m = await json('GET', '/metrics');
                    if ((m.viewFlushBatches || 0) > 0 && lastViews >= 5) break;
                } catch { }
                await sleep(220); // small polling gap
            }
            if (!target) throw new Error('post not found after views (poll attempts=' + attempts + ')');
            if ((target.views || 0) < 5) throw new Error('views not flushed (attempts=' + attempts + ' got ' + (target.views || 0) + ')');
            const detailResp = await fetch(BASE + `/posts/${postIds[0]}`);
            const etag = detailResp.headers.get('ETag');
            const detail = await detailResp.json();
            if (!detail || detail.id !== postIds[0]) throw new Error('detail fetch failed');
            if (!etag) throw new Error('missing ETag');
            const cond = await fetch(BASE + `/posts/${postIds[0]}`, { headers: { 'If-None-Match': etag } });
            if (cond.status !== 304) throw new Error('expected 304 got ' + cond.status);
            pass('increment view (buffered)', { attempts, flush: globalThis.__lastFlushInfo });
        } catch (e) { fail('increment view (buffered)', e); }
    }

    // 8. Soft delete last post
    if (postIds[postIds.length - 1]) {
        try {
            await json('DELETE', `/boards/${boardId}/posts/${postIds[postIds.length - 1]}`);
            const postsResp = await json('GET', `/boards/${boardId}/posts?limit=60`);
            const arr = postsResp.items || [];
            if (arr.find(p => p.id === postIds[postIds.length - 1])) throw new Error('still present');
            pass('soft delete post');
        } catch (e) { fail('soft delete post', e); }
    }

    // 9. Posts map includes board and correct surviving posts
    try { const map = await json('GET', '/posts-map'); if (!map[boardId]) throw new Error('board missing in map'); pass('posts map'); } catch (e) { fail('posts map', e); }

    // 10. Soft delete board
    try { await json('DELETE', `/boards/${boardId}`); const list = await json('GET', '/boards'); if (list.find(b => b.id === boardId)) throw new Error('board still listed'); pass('soft delete board'); } catch (e) { fail('soft delete board', e); }

    // 10.5 Pagination deep (reduced & parallel) -> need > limit (30). We'll create 32 additional posts.
    try {
        const EXTRA = 32; const batchSize = 8; const created = [];
        let idx = 0;
        while (idx < EXTRA) {
            const slice = Array.from({ length: Math.min(batchSize, EXTRA - idx) }).map((_, j) => {
                const pid = randId('pp_');
                return json('POST', `/boards/${boardId}/posts`, { id: pid, title: '페이지네이션테스트 ' + (idx + j) + ' ' + randWord(), content: '컨텐츠 ' + (idx + j), date: new Date().toISOString().slice(0, 10) })
                    .then(() => { created.push(pid); })
                    .catch(() => { /* allow some failure */ });
            });
            await Promise.all(slice); idx += slice.length;
        }
        const first = await json('GET', `/boards/${boardId}/posts?limit=30&offset=0`);
        const second = await json('GET', `/boards/${boardId}/posts?limit=30&offset=30`);
        if (!first.hasMore) throw new Error('first page should have hasMore');
        if (!Array.isArray(second.items) || second.items.length === 0) throw new Error('second page empty');
        pass('pagination multi-page', { first: first.items.length, second: second.items.length, total: first.total });
    } catch (e) { fail('pagination multi-page', e); }

    // 10.6 Search - create distinctive keyword & verify
    let searchPid = null; const keyword = 'ZXQ' + randWord().toUpperCase();
    try {
        searchPid = randId('sp_');
        await json('POST', `/boards/${boardId}/posts`, { id: searchPid, title: '검색키워드 ' + keyword, content: '본문에 ' + keyword + ' 포함', date: new Date().toISOString().slice(0, 10) });
        const result = await json('GET', `/boards/${boardId}/posts?q=${encodeURIComponent(keyword)}`);
        if (!result.items.find(p => p.id === searchPid)) throw new Error('keyword not found in search');
        pass('search exact', { q: keyword, count: result.items.length });
    } catch (e) { fail('search exact', e); }

    // 10.7 Approx search fallback (use partial token that may rely on LIKE)
    try {
        if (keyword.length > 3) {
            const partial = keyword.slice(0, 3);
            const approx = await json('GET', `/boards/${boardId}/posts?q=${encodeURIComponent(partial)}&approx=1`);
            if (!approx.items || approx.items.length === 0) throw new Error('approx results empty');
            pass('search approx', { q: partial, count: approx.items.length });
        } else {
            pass('search approx', { skipped: true });
        }
    } catch (e) { fail('search approx', e); }

    // 11. Soft delete board 이후 Metrics + view batching 수치 체크 + Prometheus endpoint
    try {
        const m = await json('GET', '/metrics');
        if (!('uptimeSec' in m)) throw new Error('no uptimeSec');
        if (typeof m.viewBufferedAdds === 'undefined') throw new Error('no viewBufferedAdds metric');
        // Prometheus plain text
        const promRes = await fetch(BASE + '/metrics-prom');
        const promText = await promRes.text();
        if (!/app_uptime_seconds/.test(promText)) throw new Error('prom text missing uptime');
        pass('metrics');
    } catch (e) { fail('metrics', e); }

    // Summary
    const ok = report.filter(r => r.ok).length;
    console.log('\n=== SUMMARY ===');
    report.forEach(r => console.log((r.ok ? 'OK ' : 'FAIL'), r.name, r.err ? ('- ' + r.err) : ''));
    console.log(`Passed ${ok}/${report.length}` + (embedded ? ' (embedded server)' : ''));
    // JSON 결과 저장 (CI/후속 분석용)
    try {
        const fs = await import('fs');
        fs.writeFileSync('test-summary.json', JSON.stringify({ passed: ok, total: report.length, report }, null, 2));
    } catch (e) { /* ignore */ }
    if (report.some(r => !r.ok)) process.exitCode = 1;
    if (embedded && embeddedServer) {
        console.log('[auto-embed] closing embedded server');
        embeddedServer.close(() => setTimeout(() => process.exit(process.exitCode || 0), 80));
    }
}

run().catch(e => { console.error('FATAL', e); process.exit(1); });
