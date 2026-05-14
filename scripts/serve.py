#!/usr/bin/env python3
"""
serve.py — local dev static server with HTTP Range support.

Python's stdlib http.server doesn't support Range requests, which PMTiles
basemap tiles depend on (offline vector basemap reads byte-ranges from a
single .pmtiles file). This wraps SimpleHTTPRequestHandler with proper
206 Partial Content responses so the Atlas Map renders locally.

Usage:
  python3 scripts/serve.py [port]

Defaults to port 8742. In production the SaaS deploy targets (Vercel,
Cloudflare Pages, R2/S3 + CloudFront) all support Range natively — this
file is dev-only.

Author: opus-map-1, 2026-05-15
"""

import os
import re
import sys
import http.server
import socketserver
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8742


class RangeRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        f = self.send_head_with_range()
        if f:
            try:
                self.copyfile(f, self.wfile)
            finally:
                f.close()

    def send_head_with_range(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None
        fs = os.fstat(f.fileno())
        size = fs.st_size
        rng = self.headers.get("Range")
        if not rng:
            self.send_response(200)
            self.send_header("Content-Type", self.guess_type(path))
            self.send_header("Content-Length", str(size))
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
            self.end_headers()
            return f

        m = re.match(r"bytes=(\d*)-(\d*)", rng)
        if not m:
            self.send_error(400, "Invalid Range")
            f.close()
            return None
        start_s, end_s = m.group(1), m.group(2)
        if start_s == "":
            length = int(end_s)
            start = max(0, size - length)
            end = size - 1
        else:
            start = int(start_s)
            end = int(end_s) if end_s else size - 1
        if start >= size:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            f.close()
            return None
        end = min(end, size - 1)
        length = end - start + 1
        f.seek(start)

        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Length", str(length))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
        self.end_headers()

        # Wrap so copyfile only sends the requested range
        return _Slice(f, length)


class _Slice:
    def __init__(self, fp, n):
        self.fp = fp
        self.n = n

    def read(self, size=-1):
        if self.n <= 0:
            return b""
        if size < 0 or size > self.n:
            size = self.n
        chunk = self.fp.read(size)
        self.n -= len(chunk)
        return chunk

    def close(self):
        self.fp.close()


class ReuseAddrTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    os.chdir(ROOT)
    with ReuseAddrTCPServer(("", PORT), RangeRequestHandler) as httpd:
        print(f"serve.py listening on http://localhost:{PORT}  (root={ROOT})")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nshutting down")
