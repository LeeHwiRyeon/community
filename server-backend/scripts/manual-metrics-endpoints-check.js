// Manual metrics endpoints verification
console.log('[manual-metrics-endpoints-check] start');
// Usage: node scripts/manual-metrics-endpoints-check.js
let BASE = process.env.BASE || `http://localhost:${process.env.PORT || 50000}/api`;
let embedded = false; let embeddedServer = null;
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function j(path) { const r = await fetch(BASE + path); const text = await r.text(); return { status: r.status, text, json: (() => { try { return JSON.parse(text); } catch { return null; } })() }; }
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
    const result = {};
    try {
        const m = await j('/metrics');
        if (m.status !== 200) throw new Error('/metrics status ' + m.status);
        result.metricsKeys = m.json ? Object.keys(m.json).slice(0, 25) : [];
        const prom = await j('/metrics-prom');
        if (prom.status !== 200) throw new Error('/metrics-prom status ' + prom.status);
        result.promHasUptime = /app_uptime_seconds/.test(prom.text);
        result.promHasView = /app_view_buffered_adds/.test(prom.text);
        result.ok = !!m.json && result.promHasUptime && result.promHasView;
    } catch (e) { result.exception = e.message; result.ok = false; }
    console.log('[manual-metrics-endpoints-check]', JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
    if (embedded && embeddedServer) { embeddedServer.close(() => { }); }
}
main();
