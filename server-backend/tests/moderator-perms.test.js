// Test moderator can create/update announcements/events but not delete
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
        }, res => { let buf = ''; res.on('data', d => buf += d); res.on('end', () => resolve({ status: res.statusCode, body: buf })); });
        r.on('error', reject); if (data) r.write(data); r.end();
    });
}
(async () => {
    try {
        // Admin login (first user)
        let r = await req('GET', '/api/auth/providers');
        const prov = JSON.parse(r.body).providers[0].provider;
        r = await req('GET', `/api/auth/callback/${prov}?code=abc`);
        const admin = JSON.parse(r.body);
        if (!admin.access) throw new Error('admin login fail');

        // Create second user (moderator target)
        const prov2 = JSON.parse((await req('GET', '/api/auth/providers')).body).providers[0].provider; // same provider -> new identity (mock id different?)
        const second = await req('GET', `/api/auth/callback/${prov2}?code=def`);
        const u2 = JSON.parse(second.body);

        // Promote second user to moderator
        await req('POST', `/api/users/${u2.userId}/role`, { token: admin.access, body: { role: 'moderator' } });

        // Moderator login again to ensure role reflected (token still user role but /me shows role)
        const modAccess = u2.access;

        // Moderator create announcement
        r = await req('POST', '/api/announcements', { token: modAccess, body: { title: 'Mod Ann', body: 'Body' } });
        console.log('mod create ann', r.status, r.body);
        if (r.status !== 201) throw new Error('Moderator create ann failed');
        const ann = JSON.parse(r.body);

        // Moderator try delete (should 403)
        r = await req('DELETE', `/api/announcements/${ann.id}`, { token: modAccess });
        if (r.status === 200) throw new Error('Moderator should not delete announcement');

        // Moderator update (allowed)
        r = await req('PATCH', `/api/announcements/${ann.id}`, { token: modAccess, body: { title: 'Updated' } });
        if (r.status !== 200) throw new Error('Moderator update failed');

        console.log('Moderator permission test PASS');
    } catch (e) {
        console.error('Moderator permission test FAIL', e); process.exitCode = 1;
    }
})();
