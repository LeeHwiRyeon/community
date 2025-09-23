// Minimal smoke test for mock auth flow
// Usage: node src/tests/auth-smoke.js (ensure server running with AUTH_ENABLED=1)

import http from 'http';

function get(path) {
    return new Promise((resolve, reject) => {
        const req = http.request({ hostname: 'localhost', port: process.env.PORT || 3000, path, method: 'GET' }, res => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                resolve({ status: res.statusCode, body: data });
            });
        });
        req.on('error', reject); req.end();
    });
}

(async () => {
    try {
        const providers = await get('/api/auth/providers');
        console.log('Providers:', providers.status, providers.body);
        const list = JSON.parse(providers.body).providers;
        if (!list.length) {
            console.warn('No providers enabled - skipping login test');
            return;
        }
        const provider = list[0].provider;
        // Trigger mock login (auto-callback)
        const login = await get(`/api/auth/login/${provider}`);
        console.log('Login redirect (mock):', login.status);
        const callback = await get(`/api/auth/callback/${provider}?code=test-code`);
        console.log('Callback:', callback.status, callback.body);
        const token = JSON.parse(callback.body).token;
        if (!token) throw new Error('No token returned');
        console.log('Token acquired length=', token.length);
    } catch (e) {
        console.error('Auth smoke test failed', e);
        process.exitCode = 1;
    }
})();
