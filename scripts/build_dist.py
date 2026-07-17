#!/usr/bin/env python3
# Build the deployable dist/ for Cloudflare Pages (alpha).
# - App + vendored assets, EXCLUDING the source vault, Art Direction, the
#   177 MB basemap, and _legacy.
# - Splits data.js into <25MB chunks (Pages caps files at 25 MB).
# - Rewrites index.html: sets the hide-map alpha flag + the split data tags.
import os, re, json, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')

def rel(*p): return os.path.join(ROOT, *p)

# ── clean ───────────────────────────────────────────────────────────────
if os.path.exists(DIST): shutil.rmtree(DIST)
os.makedirs(DIST)

# ── copy app code + needed assets ───────────────────────────────────────
# src/ (js, styles, data) — copy whole
shutil.copytree(rel('src'), os.path.join(DIST, 'src'))
# _assets: only the runtime bits (NOT basemap)
os.makedirs(os.path.join(DIST, '_assets'))
# bg/ excluded: the two HD background videos are 27 MB each (>25 MB Pages cap)
# and only decorative — the app falls back to the dark canvas without them.
for name in ('vendor', 'audio', 'data', 'placeholders'):
    src = rel('_assets', name)
    if os.path.isdir(src):
        shutil.copytree(src, os.path.join(DIST, '_assets', name))
for f in ('thumbs_cache.json',):
    if os.path.exists(rel('_assets', f)):
        shutil.copy2(rel('_assets', f), os.path.join(DIST, '_assets', f))
# vendor/bin/ is the 55 MB pmtiles CLI (a dev tool) — never used in the browser.
shutil.rmtree(os.path.join(DIST, '_assets', 'vendor', 'bin'), ignore_errors=True)

# ── split data.js into <25MB chunks ─────────────────────────────────────
raw = open(rel('data.js'), 'r', encoding='utf-8').read()
obj = json.loads(re.match(r'\s*window\.VAULT_DATA\s*=\s*(.*);\s*$', raw, re.S).group(1))
nodes = obj.pop('nodes')
base = 'window.VAULT_DATA=' + json.dumps(obj, separators=(',', ':'), ensure_ascii=False) + ';window.VAULT_DATA.nodes=[];'
open(os.path.join(DIST, 'data-base.js'), 'w', encoding='utf-8').write(base)
CHUNK = 12 * 1024 * 1024
chunks, cur, cur_b = [], [], 0
for n in nodes:
    s = json.dumps(n, separators=(',', ':'), ensure_ascii=False)
    if cur and cur_b + len(s) > CHUNK:
        chunks.append(cur); cur, cur_b = [], 0
    cur.append(n); cur_b += len(s) + 1
if cur: chunks.append(cur)
data_tags = ['<script src="data-base.js" onerror="document.getElementById(\'missing-data\').style.display=\'flex\'"></script>']
for i, ch in enumerate(chunks, 1):
    body = 'window.VAULT_DATA.nodes.push(' + ','.join(json.dumps(n, separators=(',', ':'), ensure_ascii=False) for n in ch) + ');'
    open(os.path.join(DIST, f'data-nodes-{i}.js'), 'w', encoding='utf-8').write(body)
    data_tags.append(f'<script src="data-nodes-{i}.js"></script>')

# ── rewrite index.html ──────────────────────────────────────────────────
html = open(rel('index.html'), 'r', encoding='utf-8').read()
# 1) alpha flag: hide the Map view (basemap excluded), right after <body>
html = html.replace('<body class="nav-hidden detail-collapsed">',
                    '<body class="nav-hidden detail-collapsed">\n<script>window.CODEX_ALPHA_HIDE_MAP=true;</script>')
# 2) replace the single data.js script tag with the split tags
html = re.sub(r'<script src="data\.js\?[^"]*"[^>]*></script>', '\n'.join(data_tags), html)
open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8').write(html)

# ── report + guardrail: no file may exceed 25 MB ────────────────────────
LIMIT = 25 * 1024 * 1024
big = []
total = 0
for dp, _, fs in os.walk(DIST):
    for f in fs:
        p = os.path.join(dp, f); sz = os.path.getsize(p); total += sz
        if sz > LIMIT: big.append((os.path.relpath(p, DIST), round(sz/1e6, 1)))
print('dist total:', round(total/1e6, 1), 'MB ·', len(chunks), 'data chunks')
if big:
    print('❌ FILES OVER 25MB (Cloudflare Pages will reject):')
    for p, mb in big: print(f'   {p}: {mb} MB')
    sys.exit(1)
print('✅ no file over 25 MB — Pages-ready')
