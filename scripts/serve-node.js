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
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.pmtiles': 'application/octet-stream', '.md': 'text/plain',
  '.geojson': 'application/geo+json', '.txt': 'text/plain',
  // Media types — Safari refuses <video>/<audio> served with a wrong
  // or octet-stream MIME far more readily than Chromium (2026-06-10,
  // the vanished Forge BG video investigation).
  '.mov': 'video/quicktime', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.m4v': 'video/x-m4v', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4',
  '.wav': 'audio/wav', '.ogg': 'audio/ogg',
};

// Media is exempt from no-store: Safari's media loader aborts video/
// audio whose responses carry no-store (proven 2026-06-10 — the Forge
// zoom-out BG video vanished in Safari under serve.py's blanket
// no-store while Chromium kept playing). Media files are immutable +
// ?v= cache-busted, so browser caching is correct for them.
const MEDIA_EXT = new Set([
  '.mov', '.mp4', '.webm', '.m4v', '.mp3', '.m4a', '.wav', '.ogg',
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.ico',
  '.woff', '.woff2', '.pmtiles',
]);

http.createServer((req, res) => {
  let pathname = url.parse(req.url).pathname;
  if (pathname === '/' || pathname === '') pathname = '/index.html';
  const filepath = path.join(ROOT, decodeURIComponent(pathname));

  // Security: stay inside ROOT. The trailing-separator check matters —
  // a bare prefix test would also admit sibling dirs like "Codex Atlas2".
  if (filepath !== ROOT && !filepath.startsWith(ROOT + path.sep)) {
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
      const headers = {
        'Content-Type': mime,
        'Content-Length': stat.size,
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
      };
      if (!MEDIA_EXT.has(ext)) {
        // 2026-05-26 — strengthened from no-cache to no-store +
        // must-revalidate so Safari can NEVER serve stale dev code.
        // Cost is bandwidth (every refresh re-fetches every asset);
        // benefit is debug certainty. Revisit before release.
        // 2026-06-10 — scoped to CODE/DATA only (media exempt, see
        // MEDIA_EXT above — no-store on media kills Safari playback).
        headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0';
        headers['Pragma'] = 'no-cache';
        headers['Expires'] = '0';
      }
      res.writeHead(200, headers);
      fs.createReadStream(filepath).pipe(res);
    }
  });
// 2026-07-31 security lock: loopback ONLY — a bare .listen(PORT) bound all
// interfaces and served the whole vault to anyone on the same network.
}).listen(PORT, '127.0.0.1', () => {
  console.log(`serve-node.js listening on http://localhost:${PORT}  (loopback only, root=${ROOT})`);
});
