// Test refresh token via cookie endpoint
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
        }, res => { let buf = ''; res.on('data', d => buf += d); res.on('end', () => resolve({ status: res.statusCode, body: buf, headers: res.headers })); });
        r.on('error', reject); if (data) r.write(data); r.end();
    });
}
(async () => {
    try {
        if (process.env.REFRESH_COOKIE !== '1') { console.log('REFRESH_COOKIE not enabled'); return; }
        let r = await req('GET', '/api/auth/providers');
        const prov = JSON.parse(r.body).providers[0].provider;
        r = await req('GET', `/api/auth/callback/${prov}?code=abc`);
        const auth = JSON.parse(r.body);
        const setCookie = r.headers['set-cookie'] || r.headers['set-cookie'];
        if (!setCookie) throw new Error('No Set-Cookie from callback');
        const cookieHeader = Array.isArray(setCookie) ? setCookie[0] : setCookie;
        const refreshCookie = cookieHeader.split(';')[0];
        // call refresh-cookie
        r = await req('POST', '/api/auth/refresh-cookie', { headers: { Cookie: refreshCookie } });
        console.log('refresh-cookie status', r.status, r.body);
        if (r.status !== 200) throw new Error('refresh-cookie failed');
        console.log('Refresh cookie test PASS');
    } catch (e) {
        console.error('Refresh cookie test FAIL', e); process.exitCode = 1;
    }
})();
