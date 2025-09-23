// Manual view batching verification script
// Usage: node scripts/manual-view-batch-check.js
// Assumes backend already running on PORT (default 50000)

let BASE = process.env.BASE || `http://localhost:${process.env.PORT || 50000}/api`;
let embedded = false; let embeddedServer = null;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function rid(p = 'x') { return p + Math.random().toString(36).slice(2, 10); }

async function j(method, path, body) {
    const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    let data = null; try { data = await r.json(); } catch { }
    if (!r.ok) throw new Error(method + ' ' + path + ' ' + r.status + ' ' + JSON.stringify(data));
    return data;
}

async function waitHealth(attempts = 12) {
    for (let i = 0; i < attempts; i++) {
        try { const r = await fetch(BASE + '/health'); if (r.ok) return true; } catch { }
        await sleep(150);
    }
    return false;
}

async function maybeEmbed() {
    if (await waitHealth(4)) return;
    const { bootstrap } = await import('../src/server.js');
    const { server } = await bootstrap({ port: 0 });
    const port = server.address().port; BASE = `http://localhost:${port}/api`; embedded = true; embeddedServer = server;
    await waitHealth(40);
}

async function main() {
    await maybeEmbed();
    const boardId = 'vb_' + Date.now().toString(36);
    const postId = 'vbp_' + Date.now().toString(36);
    const flushInterval = parseInt(process.env.VIEW_FLUSH_INTERVAL_MS || '1500', 10);
    const increments = 7;
    const result = { boardId, postId, increments, flushInterval };
    try {
        await j('POST', '/boards', { id: boardId, title: '뷰배치테스트', ordering: 910 });
        await j('POST', `/boards/${boardId}/posts`, { id: postId, title: '배치뷰 테스트 포스트', content: 'view batch test', author: 'batcher' });
        for (let i = 0; i < increments; i++) await j('POST', `/posts/${postId}/view`);
        // wait slightly longer than interval to allow flush
        await sleep(flushInterval + 400);
        // poll a few times if needed
        let views = 0; let attempts = 0;
        while (attempts < 5) {
            attempts++;
            const page = await j('GET', `/boards/${boardId}/posts?limit=10`);
            const item = (page.items || []).find(p => p.id === postId);
            if (item) { views = item.views || 0; }
            if (views >= increments) { result.views = views; break; }
            await sleep(250);
        }
        if ((result.views || 0) < increments) {
            result.error = 'views_not_fully_flushed';
        }
        // detail with ETag
        const detailResp = await fetch(BASE + `/posts/${postId}`);
        result.detailStatus = detailResp.status;
        result.detailEtag = detailResp.headers.get('ETag');
        result.detail = await detailResp.json();
        if (result.detailEtag) {
            const cond = await fetch(BASE + `/posts/${postId}`, { headers: { 'If-None-Match': result.detailEtag } });
            result.conditionalStatus = cond.status;
        }
        const metrics = await j('GET', '/metrics');
        result.metricsSample = {
            viewBufferedAdds: metrics.viewBufferedAdds,
            viewFlushBatches: metrics.viewFlushBatches,
            viewFlushRows: metrics.viewFlushRows
        };
        result.ok = (result.views || 0) >= increments;
    } catch (e) {
        result.exception = e.message;
        result.ok = false;
    }
    console.log('[manual-view-batch-check]', JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
    if (embedded && embeddedServer) { embeddedServer.close(() => { }); }
}

main();
