// Manual test for account linking using mock provider fallback
// Steps:
// 1. First login with provider A -> get access token
// 2. Call /api/auth/login/providerB?link=1 with Authorization header -> get authorize/redirect (mock) or use callback directly
// 3. Call /api/auth/callback/providerB?code=xyz with Authorization header + link=1 -> expect linked:true and same userId
import http from 'http';

const PORT = process.env.PORT || 50000;
function req(method, path, { body, token, headers } = {}) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;
        const r = http.request({
            hostname: 'localhost', port: PORT, path, method, headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: 'Bearer ' + token } : {}),
                ...(headers || {})
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
        let r = await req('GET', '/api/auth/providers');
        const providers = JSON.parse(r.body).providers.map(p => p.provider);
        if (providers.length < 2) {
            console.log('Need at least 2 providers enabled for linking test. Found:', providers); return;
        }
        const [p1, p2] = providers;
        console.log('Using providers', p1, p2);
        // first login
        r = await req('GET', `/api/auth/callback/${p1}?code=abc`);
        const first = JSON.parse(r.body);
        if (!first.access) throw new Error('No access token first login');
        // linking flow second provider
        r = await req('GET', `/api/auth/callback/${p2}?code=xyz&link=1`, { token: first.access });
        const second = JSON.parse(r.body);
        console.log('Link result', second);
        if (!second.linked) throw new Error('Expected linked true');
        if (second.userId !== first.userId) throw new Error('UserId mismatch after linking');
        console.log('Account linking test PASS');
    } catch (e) {
        console.error('Linking test failed', e); process.exitCode = 1;
    }
})();
