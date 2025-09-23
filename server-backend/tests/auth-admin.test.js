// Simple manual test runner (no jest) for admin CRUD & tokens
// Run with: node tests/auth-admin.test.js (ensure AUTH_ENABLED=1, clean DB recommended)
import http from 'http';

const PORT = process.env.PORT || 50000;
function req(method, path, { body, token } = {}) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const r = http.request({
            hostname: 'localhost', port: PORT, path, method, headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: 'Bearer ' + token } : {})
            }
        }, res => {
            let buf = ''; res.on('data', d => buf += d); res.on('end', () => resolve({ status: res.statusCode, body: buf }));
        });
        r.on('error', reject);
        if (data) r.write(data); r.end();
    });
}
(async () => {
    try {
        console.log('1) Get providers');
        let r = await req('GET', '/api/auth/providers');
        console.log('providers:', r.status, r.body);
        const prov = JSON.parse(r.body).providers[0]?.provider;
        if (!prov) throw new Error('No provider enabled');

        console.log('2) Callback login (first user becomes admin)');
        r = await req('GET', `/api/auth/callback/${prov}?code=abc`);
        console.log('callback:', r.status, r.body);
        const cb = JSON.parse(r.body);
        const access = cb.access;
        if (!access) throw new Error('No access token');

        console.log('3) /me');
        r = await req('GET', '/api/auth/me', { token: access });
        console.log('me:', r.status, r.body);

        console.log('4) Create announcement');
        r = await req('POST', '/api/announcements', { token: access, body: { title: '공지1', body: '내용', priority: 10 } });
        console.log('create ann:', r.status, r.body);

        console.log('5) Create event');
        r = await req('POST', '/api/events', { token: access, body: { title: '이벤트1', body: '이벤트본문', status: 'published' } });
        console.log('create event:', r.status, r.body);

        console.log('6) List announcements (public)');
        r = await req('GET', '/api/announcements');
        console.log('list ann:', r.status, r.body);

        console.log('7) List events (public)');
        r = await req('GET', '/api/events');
        console.log('list events:', r.status, r.body);

        console.log('DONE');
    } catch (e) {
        console.error('Test failed', e);
        process.exitCode = 1;
    }
})();
