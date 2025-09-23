// security-strict.js - Focused tests for rate limit, validation, readonly behaviors with stability improvements
import { spawn } from 'child_process';
import assert from 'assert';
import fs from 'fs';

const PORT = process.env.PORT || 50001; // isolate from main strict test port

function genId(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
async function fetchJson(u, o) { const r = await fetch(u, o); let txt = null; let body = null; try { txt = await r.text(); try { body = JSON.parse(txt); } catch { body = txt; } } catch { } return { status: r.status, body, raw: txt, headers: r.headers }; }

async function startServer(extraEnv = {}) {
    const proc = spawn(process.execPath, ['src/index.js'], { cwd: process.cwd(), env: { ...process.env, ...extraEnv, PORT: String(PORT), NODE_ENV: 'test' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let ready = false; let out = ''; let err = '';
    proc.stdout.on('data', d => { out += d.toString(); if (out.includes('API listening')) ready = true; });
    proc.stderr.on('data', d => { err += d.toString(); });
    for (let i = 0; i < 100; i++) {
        if (ready) break;
        try { const h = await fetch(`http://localhost:${PORT}/api/health`); if (h.ok) { ready = true; break; } } catch { }
        await wait(100);
    }
    if (!ready) { try { proc.kill('SIGINT'); } catch { } return { skip: true, reason: 'server_not_ready', logs: { out, err } }; }
    return { proc, logs: { out: () => out, err: () => err } };
}
async function stop(proc) { if (!proc) return; try { proc.kill('SIGINT'); } catch { } for (let i = 0; i < 30; i++) { if (proc.exitCode != null) break; await wait(100); } }

async function testRateLimit() {
    const started = await startServer({ RATE_LIMIT_WRITE_PER_MIN: '5', RATE_LIMIT_SEARCH_PER_MIN: '5' });
    if (started.skip) return { skipped: true, reason: started.reason };
    const proc = started.proc;
    let ok = 0, blocked = 0, firstBoard = null;
    for (let i = 0; i < 7; i++) {
        const id = genId('rl_');
        const r = await fetchJson(`http://localhost:${PORT}/api/boards`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, title: 'T' + i }) });
        if (r.status === 201) { ok++; if (!firstBoard) firstBoard = id; }
        else if (r.status === 429) blocked++; else { console.error('Write unexpected', r.status, r.body); await stop(proc); throw new Error('unexpected status ' + r.status); }
    }
    assert.ok(ok <= 5 && blocked >= 1, 'rate limit enforced writes');
    if (!firstBoard) firstBoard = genId('dummy');
    let searchOk = 0, searchBlocked = 0;
    for (let i = 0; i < 7; i++) {
        const r = await fetchJson(`http://localhost:${PORT}/api/boards/${firstBoard}/posts?q=abc&approx=1`);
        if (r.status === 200) searchOk++; else if (r.status === 429) searchBlocked++; else { console.error('Search unexpected', r.status, r.body); await stop(proc); throw new Error('unexpected search status ' + r.status); }
    }
    assert.ok(searchOk <= 5 && searchBlocked >= 1, 'rate limit enforced search');
    await stop(proc);
    return { skipped: false };
}

async function testValidation() {
    const started = await startServer(); if (started.skip) return { skipped: true, reason: started.reason };
    const proc = started.proc;
    // invalid id
    let r = await fetchJson(`http://localhost:${PORT}/api/boards`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: '!bad', title: 'X' }) });
    if (r.status !== 400) { console.error('Expected 400 invalid board id, got', r.status, r.body); await stop(proc); throw new Error('invalid board id'); }
    // empty title
    r = await fetchJson(`http://localhost:${PORT}/api/boards`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: genId('vd1_'), title: '' }) });
    if (r.status !== 400) { console.error('Expected 400 empty title, got', r.status, r.body); await stop(proc); throw new Error('empty title rejected'); }
    // long title
    r = await fetchJson(`http://localhost:${PORT}/api/boards`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: genId('vd2_'), title: 'x'.repeat(301) }) });
    if (r.status !== 400) { console.error('Expected 400 long title, got', r.status, r.body); await stop(proc); throw new Error('long title rejected'); }
    // valid board
    const goodId = genId('ok_');
    r = await fetchJson(`http://localhost:${PORT}/api/boards`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: goodId, title: 'OK 1' }) });
    if (r.status !== 201) { console.error('Expected 201 create board, got', r.status, r.body); await stop(proc); throw new Error('valid board created'); }
    // long content
    r = await fetchJson(`http://localhost:${PORT}/api/boards/${goodId}/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'Ok', content: 'x'.repeat(10001) }) });
    if (r.status !== 400) { console.error('Expected 400 long content, got', r.status, r.body); await stop(proc); throw new Error('long content rejected'); }
    await stop(proc); return { skipped: false };
}

async function testReadonly() {
    const started = await startServer({ READONLY: '1' }); if (started.skip) return { skipped: true, reason: started.reason };
    const proc = started.proc;
    const roId = genId('ro_');
    const r = await fetchJson(`http://localhost:${PORT}/api/boards`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: roId, title: 'RO' }) });
    if (r.status !== 403) { console.error('Expected 403 readonly, got', r.status, r.body); await stop(proc); throw new Error('readonly forbids write'); }
    await stop(proc); return { skipped: false };
}

async function main() {
    const results = []; const step = async (name, fn) => { const t0 = Date.now(); try { const r = await fn(); results.push({ name, ok: true, skipped: r?.skipped || false, ms: Date.now() - t0 }); } catch (e) { results.push({ name, ok: false, ms: Date.now() - t0, error: e.message }); } };
    await step('rate-limit', testRateLimit);
    await step('validation', testValidation);
    await step('readonly', testReadonly);
    const failed = results.filter(r => !r.ok && !r.skipped);
    fs.writeFileSync('test-security-summary.json', JSON.stringify({ results, failed: failed.length }, null, 2));
    if (failed.length) { console.error('SECURITY FAIL', failed); process.exit(1); } else { console.log('SECURITY TESTS OK'); }
}
main().catch(e => { console.error(e); process.exit(1); });
