// Manual client performance metric ingestion simulation
console.log('[manual-client-metric-sim] start');
// Usage: node scripts/manual-client-metric-sim.js
let BASE = process.env.BASE || `http://localhost:${process.env.PORT || 50000}/api`;
let embedded = false; let embeddedServer = null;
async function getMetrics() { const r = await fetch(BASE + '/metrics'); return r.json(); }
async function ingest(payload) {
    const r = await fetch(BASE + '/client-metric', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    let data = null; try { data = await r.json(); } catch { }
    return { status: r.status, data };
}
function rand(v = 2000) { return Math.round(Math.random() * v); }
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function waitHealth(attempts = 12) {
    for (let i = 0; i < attempts; i++) {
        try { const r = await fetch(BASE + '/health'); if (r.ok) return true; } catch { }
        await sleep(120);
    }
    return false;
}
async function maybeEmbed() {
    if (await waitHealth(4)) return;
    const { bootstrap } = await import('../src/server.js');
    const { server } = await bootstrap({ port: 0 });
    const port = server.address().port; BASE = `http://localhost:${port}/api`; embedded = true; embeddedServer = server;
    await waitHealth(30);
}
async function main() {
    await maybeEmbed();
    const before = await getMetrics();
    const payload = { ts: Date.now(), path: '/home', ua: 'ManualTest/1.0', metrics: { LCP: rand(), CLS: +(Math.random().toFixed(3)), FID: rand(), INP: rand(), FCP: rand(), TTFB: rand(), LAF: rand(), LAF_MAX: rand() } };
    const ing = await ingest(payload);
    const after = await getMetrics();
    const result = {
        beforeAccepted: before?.clientMetric?.accepted || 0,
        afterAccepted: after?.clientMetric?.accepted || 0,
        status: ing.status,
        ingestResponse: ing.data,
        diffAccepted: (after?.clientMetric?.accepted || 0) - (before?.clientMetric?.accepted || 0),
        ok: ing.status === 200 && (after?.clientMetric?.accepted || 0) >= (before?.clientMetric?.accepted || 0) + 1
    };
    console.log('[manual-client-metric-sim]', JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
    if (embedded && embeddedServer) { embeddedServer.close(() => { }); }
}
main();
