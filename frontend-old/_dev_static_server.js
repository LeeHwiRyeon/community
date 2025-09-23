// Simple static dev server for frontend (no external deps)
// Usage: node _dev_static_server.js [port]
// Serves files from this directory. Default entry: simple-test.html

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const port = parseInt(process.argv[2] || '5500', 10);
const base = path.resolve(__dirname);
const entry = '/simple-test.html';

function mime(ext) {
    return ({
        html: 'text/html; charset=utf-8',
        js: 'text/javascript; charset=utf-8',
        mjs: 'text/javascript; charset=utf-8',
        css: 'text/css; charset=utf-8',
        json: 'application/json; charset=utf-8',
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml'
    })[ext] || 'text/plain; charset=utf-8';
}

function send(res, code, body, type) {
    res.writeHead(code, {
        'Content-Type': type || 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache'
    });
    res.end(body);
}

const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/' || urlPath === '') urlPath = entry;
    const fp = path.join(base, urlPath);
    if (!fp.startsWith(base)) return send(res, 403, 'Forbidden');
    fs.stat(fp, (err, st) => {
        if (err) return send(res, 404, 'Not found');
        if (st.isDirectory()) {
            const idx = path.join(fp, 'index.html');
            return fs.readFile(idx, (e, data) => {
                if (e) return send(res, 404, 'Not found');
                send(res, 200, data, mime('html'));
            });
        }
        fs.readFile(fp, (e, data) => {
            if (e) return send(res, 500, 'Read error');
            const ext = path.extname(fp).slice(1).toLowerCase();
            send(res, 200, data, mime(ext));
        });
    });
});

server.listen(port, () => {
    const url = `http://localhost:${port}${entry}`;
    console.log(`[frontend] Dev static server running at ${url}`);
    console.log('[frontend] Press Ctrl+C to stop.');
    // Auto-open browser on Windows
    if (process.platform === 'win32') {
        try {
            spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', detached: true }).unref();
        } catch (e) {
            console.log('[frontend] Auto-open failed:', e.message);
        }
    }
});
