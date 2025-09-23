// Strict backend integration test suite
// Emphasis: deterministic assertions, edge cases, read-only mode, batching flush, search paths
// Output: JSON summary to test-summary.json (merged style: strict)
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const PORT = process.env.PORT || 50000;

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
async function fetchJson(url, opts) {
    const r = await fetch(url, opts);
    const ct = r.headers.get('content-type') || '';
    let body = null;
    if (ct.includes('application/json')) body = await r.json(); else body = await r.text();
    return { status: r.status, body, headers: r.headers };
}

async function ensureServer() {
    // probe existing
    try { const r = await fetch(`http://localhost:${PORT}/api/health`); if (r.ok) { return { external: true }; } } catch { }
    // spawn new
    const proc = spawn(process.execPath, ['src/index.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test' }, stdio: 'pipe' });
    let ready = false; let buf = '';
    proc.stdout.on('data', d => { buf += d.toString(); if (buf.includes('API listening')) ready = true; });
    proc.stderr.on('data', d => { buf += d.toString(); });
    // enhanced readiness: also probe health
    for (let i = 0; i < 80; i++) { // up to ~10s
        if (ready) break;
        try { const r = await fetch(`http://localhost:${PORT}/api/health`); if (r.ok) { ready = true; break; } } catch { }
        await wait(125);
    }
    if (!ready) throw new Error('Server did not become ready. Logs:\n' + buf);
    return { external: false, proc };
}

async function gracefulKill(proc) {
    if (!proc) return;
    try { proc.kill('SIGINT'); } catch { }
    for (let i = 0; i < 20; i++) { if (proc.exitCode != null) break; await wait(100); }
}

function randomId(prefix = 't') { return prefix + Math.random().toString(36).slice(2, 9); }

async function testBoardsCrud() {
    const base = `http://localhost:${PORT}/api/boards`;
    const id = randomId('bd');
    // create
    let r = await fetchJson(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, title: 'Strict Board', ordering: 42 }) });
    assert.equal(r.status, 201, 'board create status');
    assert.ok(r.body.id === id && r.body.title === 'Strict Board', 'board create body');
    // patch (add defensive retry once if 404 or 500 due to transient init)
    r = await fetchJson(`${base}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Strict Board 2' }) });
    if (r.status !== 200) {
        await wait(150);
        const r2 = await fetchJson(`${base}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Strict Board 2' }) });
        if (r2.status !== 200) {
            console.error('Patch failure debug createResp=', JSON.stringify(r.body), 'patchResp=', JSON.stringify(r2.body));
        }
        r = r2;
    }
    assert.equal(r.status, 200, 'board patch status');
    assert.equal(r.body.title, 'Strict Board 2', 'board patch title');
    // list
    r = await fetchJson(base);
    assert.equal(r.status, 200, 'board list status');
    assert.ok(Array.isArray(r.body) && r.body.some(b => b.id === id), 'board list contains new');
    // delete
    r = await fetchJson(`${base}/${id}`, { method: 'DELETE' });
    assert.equal(r.status, 200, 'board delete status');
    // list after delete
    r = await fetchJson(base);
    assert.ok(!r.body.some(b => b.id === id), 'deleted board filtered out');
}

async function testPostsCrudSearch() {
    const boardsBase = `http://localhost:${PORT}/api/boards`;
    const bid = randomId('pb');
    let r = await fetchJson(boardsBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: bid, title: 'Search Board' }) });
    assert.equal(r.status, 201, 'create board for posts');
    const keywords = ['alpha', 'beta', 'gamma'];
    const created = [];
    for (let i = 0; i < 8; i++) {
        const kw = keywords[i % keywords.length];
        const pid = randomId('pp');
        r = await fetchJson(`${boardsBase}/${bid}/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: pid, title: `Title ${kw} ${i}`, content: `Content ${kw} body ${i}` }) });
        assert.equal(r.status, 201, 'create post ' + i);
        created.push({ id: pid, kw });
    }
    // basic list
    r = await fetchJson(`${boardsBase}/${bid}/posts`);
    assert.equal(r.status, 200, 'posts list status');
    assert.ok(r.body.items.length >= 8, 'posts list length');
    // search FULLTEXT / fallback approx
    r = await fetchJson(`${boardsBase}/${bid}/posts?q=alpha&approx=1`);
    assert.equal(r.status, 200, 'search status');
    assert.ok(r.body.items.some(p => p.title.includes('alpha')), 'search alpha results');
    // patch one
    const target = created[0];
    r = await fetchJson(`${boardsBase}/${bid}/posts/${target.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Updated Title X' }) });
    assert.equal(r.status, 200, 'post patch status');
    assert.equal(r.body.title, 'Updated Title X', 'post patch applied');
    // detail + ETag cache check
    r = await fetchJson(`http://localhost:${PORT}/api/posts/${target.id}`);
    assert.equal(r.status, 200, 'detail status');
    const etag = r.headers.get('etag');
    const r2 = await fetch(`http://localhost:${PORT}/api/posts/${target.id}`, { headers: { 'If-None-Match': etag } });
    assert.equal(r2.status, 304, 'ETag 304 expected');
}

async function testViewBatching() {
    // create board + post
    const bid = randomId('vb');
    let r = await fetchJson(`http://localhost:${PORT}/api/boards`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: bid, title: 'VB' }) });
    assert.equal(r.status, 201, 'vb board create');
    r = await fetchJson(`http://localhost:${PORT}/api/boards/${bid}/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Batch Post', content: '...' }) });
    assert.equal(r.status, 201, 'vb post create');
    const pid = r.body.id;
    // increment views multiple times quickly
    const inc = async () => fetchJson(`http://localhost:${PORT}/api/posts/${pid}/view`, { method: 'POST' });
    for (let i = 0; i < 7; i++) await inc();
    // force flush via debug endpoint (enabled under NODE_ENV=test)
    const flush = await fetchJson(`http://localhost:${PORT}/api/debug/flush-views`, { method: 'POST' });
    assert.equal(flush.status, 200, 'flush debug status');
    // detail -> views >= 1
    r = await fetchJson(`http://localhost:${PORT}/api/posts/${pid}`);
    assert.equal(r.status, 200, 'detail after views');
    assert.ok((r.body.views || 0) >= 1, 'views persisted');
}

async function testReadonlyMode() {
    // simulate readonly by hitting existing server (we cannot mutate its env now). If READONLY not set, skip gracefully.
    if (process.env.READONLY !== '1') {
        return { skipped: true };
    }
    // attempt write
    const r = await fetchJson(`http://localhost:${PORT}/api/boards`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: randomId('ro'), title: 'RO' }) });
    assert.equal(r.status, 403, 'readonly post forbidden');
    return { skipped: false };
}

async function testMetrics() {
    const r = await fetchJson(`http://localhost:${PORT}/api/metrics`);
    assert.equal(r.status, 200, 'metrics status');
    assert.ok(r.body.ok === true, 'metrics ok');
    assert.ok(typeof r.body.boards === 'number', 'metrics boards number');
    assert.ok(typeof r.body.viewBufferedAdds === 'number', 'metrics viewBufferedAdds');
}

async function main() {
    const started = Date.now();
    const server = await ensureServer();
    const results = [];
    const step = async (name, fn) => {
        const t0 = Date.now();
        try { await fn(); results.push({ name, ok: true, ms: Date.now() - t0 }); }
        catch (e) { results.push({ name, ok: false, ms: Date.now() - t0, error: e.message }); }
    };
    await step('boards-crud', testBoardsCrud);
    await step('posts-crud-search', testPostsCrudSearch);
    await step('view-batching', testViewBatching);
    await step('metrics', testMetrics);
    const roRes = await testReadonlyMode(); if (roRes?.skipped) results.push({ name: 'readonly-mode', ok: true, skipped: true }); else results.push({ name: 'readonly-mode', ok: true });
    const summary = { started, durationMs: Date.now() - started, results };
    const outPath = path.join(ROOT, 'test-summary.json');
    fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
    if (!server.external) await gracefulKill(server.proc);
    // exit code 0 only if all ok
    const failed = results.filter(r => !r.ok).length; if (failed > 0) { console.error('FAILURES', results.filter(r => !r.ok)); process.exit(1); } else { console.log('STRICT TESTS OK'); }
}

main().catch(e => { console.error(e); process.exit(1); });
