// Quick READONLY mode verification
// Usage: READONLY=1 node scripts/readonly-check.js
import { bootstrap } from '../src/server.js';

async function main() {
    const { server } = await bootstrap({ port: 0 });
    const port = server.address().port;
    const base = `http://localhost:${port}/api`;
    const health = await fetch(base + '/live').then(r => r.json());
    let postStatus;
    try {
        const r = await fetch(base + '/boards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'ro_x', title: 'ReadOnly Test' }) });
        postStatus = r.status;
    } catch (e) { postStatus = 'error'; }
    console.log(JSON.stringify({ live: health, postStatus, expected: 403 }));
    server.close();
}
main();
