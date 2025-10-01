import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'test-report.html' : req.url);

    // Handle metadata file
    if (req.url === '/html.meta.json.gz') {
        filePath = path.join(__dirname, 'html.meta.json.gz');
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }

        let contentType = 'text/html';
        if (req.url.endsWith('.js')) contentType = 'application/javascript';
        else if (req.url.endsWith('.css')) contentType = 'text/css';
        else if (req.url.endsWith('.gz')) contentType = 'application/json';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(3000, () => {
    console.log('HTML Report server running at http://localhost:3000');
    console.log('Open your browser and navigate to http://localhost:3000');
});