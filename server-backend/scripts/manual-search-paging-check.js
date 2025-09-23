// Manual search & pagination verification
console.log('[manual-search-paging-check] start');
// Usage: node scripts/manual-search-paging-check.js
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
    const boardId = 'sb_' + Date.now().toString(36);
    const result = { boardId };
    try {
        await j('POST', '/boards', { id: boardId, title: '검색페이지테스트', ordering: 920 });
        // create 40 posts (> default page limit 30)
        for (let i = 0; i < 40; i++) {
            await j('POST', `/boards/${boardId}/posts`, { title: `페이지 포스트 ${i}`, content: `컨텐츠 ${i}`, author: 'pager' });
        }
        const first = await j('GET', `/boards/${boardId}/posts?limit=30&offset=0`);
        const second = await j('GET', `/boards/${boardId}/posts?limit=30&offset=30`);
        result.firstPageCount = first.items.length;
        result.firstHasMore = first.hasMore;
        result.secondPageCount = second.items.length;
        if (!(first.hasMore && second.items.length > 0)) throw new Error('pagination_failed');
        // search test
        const keyword = 'KWD' + Math.random().toString(36).slice(2, 6).toUpperCase();
        const searchPost = await j('POST', `/boards/${boardId}/posts`, { title: '특별검색 ' + keyword, content: '본문 ' + keyword });
        const searchRes = await j('GET', `/boards/${boardId}/posts?q=${encodeURIComponent(keyword)}`);
        result.searchExactFound = !!searchRes.items.find(p => p.id === searchPost.id);
        // approx fallback
        const partial = keyword.slice(0, 3);
        const approxRes = await j('GET', `/boards/${boardId}/posts?q=${encodeURIComponent(partial)}&approx=1`);
        result.approxCount = approxRes.items.length;
        result.ok = result.firstHasMore && result.secondPageCount > 0 && result.searchExactFound && result.approxCount > 0;
    } catch (e) {
        result.exception = e.message; result.ok = false;
    }
    console.log('[manual-search-paging-check]', JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 1;
    if (embedded && embeddedServer) { embeddedServer.close(() => { }); }
}
main();
