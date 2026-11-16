import { promises as fs } from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4321);

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.json': 'application/json; charset=utf-8',
};

const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    let filePath = path.join(ROOT, decodeURIComponent(url.pathname));
    if (url.pathname === '/' || url.pathname === '') filePath = path.join(ROOT, 'build/index.html');

    try {
        const data = await fs.readFile(filePath);
        response.writeHead(200, {
            'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
            'Cache-Control': 'no-store',
        });
        response.end(data);
    } catch {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('not found');
    }
});

server.listen(PORT, () => console.log(`server on http://127.0.0.1:${PORT}`));
