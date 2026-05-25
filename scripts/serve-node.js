#!/usr/bin/env node
// serve-node.js — static server with HTTP Range support for PMTiles
// Drop-in for serve.py when the Xcode Python sandbox blocks preview_start.
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = path.resolve(__dirname, '..');
const PORT = parseInt(process.argv[2] || '8742', 10);

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.pmtiles': 'application/octet-stream', '.md': 'text/plain',
  '.geojson': 'application/geo+json', '.txt': 'text/plain',
};

http.createServer((req, res) => {
  let pathname = url.parse(req.url).pathname;
  if (pathname === '/' || pathname === '') pathname = '/index.html';
  const filepath = path.join(ROOT, decodeURIComponent(pathname));

  // Security: stay inside ROOT
  if (!filepath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(filepath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404); res.end('Not Found'); return;
    }

    const ext = path.extname(filepath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    const rangeHeader = req.headers.range;

    if (rangeHeader) {
      const [, startStr, endStr] = rangeHeader.match(/bytes=(\d*)-(\d*)/) || [];
      const start = startStr ? parseInt(startStr, 10) : 0;
      const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mime,
        'Access-Control-Allow-Origin': '*',
      });
      fs.createReadStream(filepath, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': stat.size,
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        // 2026-05-26 — strengthened from no-cache to no-store +
        // must-revalidate so Safari can NEVER serve stale dev code.
        // Cost is bandwidth (every refresh re-fetches every asset);
        // benefit is debug certainty. Revisit before release.
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
      fs.createReadStream(filepath).pipe(res);
    }
  });
}).listen(PORT, () => {
  console.log(`serve-node.js listening on http://localhost:${PORT}  (root=${ROOT})`);
});
