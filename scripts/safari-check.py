#!/usr/bin/env python3
"""
SAFARI CHECK — the screen-free Safari pass. "Safari is the truth" (cardinal
rule) used to cost John's screen; it doesn't any more.

WHY THIS EXISTS
  The browser preview pane is Chromium. Every engine round therefore owed a
  Safari pass, and the only ways to do one were to borrow John's screen or to
  ask him to read a console. Safari ships `safaridriver` (WebDriver), so an
  agent can drive a real Safari headlessly instead.

ONE-TIME SETUP (done 2026-07-29 — only needed again on a new machine):
  Safari -> Settings (Cmd-,) -> Advanced -> "Show features for web developers"
  then the new Developer menu -> "Allow Remote Automation".
  Without it every session request fails with a clear message.

USAGE
  python3 scripts/safari-check.py                       # localhost:8742
  python3 scripts/safari-check.py 'http://localhost:8742/?lab=1'
  python3 scripts/safari-check.py <url> --lock          # also cast a node

WHAT IT REPORTS
  · console errors/warnings from BOOT (via the ?diag=1 recorder that index.html
    installs as its first script — WebDriver connects after load, so nothing
    else can see boot errors)
  · rAF frame rate, idle and under load
  · the engine's own frameStats (GPU ms)
  · a PNG screenshot next to this script's output dir

The screenshot is the verdict a number can't give: read it.
"""
import base64, json, os, subprocess, sys, time, urllib.error, urllib.request

URL  = next((a for a in sys.argv[1:] if not a.startswith('--')), 'http://localhost:8742/?lab=1')
LOCK = '--lock' in sys.argv
PORT = int(os.environ.get('SAFARI_CHECK_PORT', '4555'))
BASE = f'http://127.0.0.1:{PORT}'
OUT  = os.environ.get('SAFARI_CHECK_OUT', os.getcwd())
# ?diag=1 turns on index.html's boot-error recorder; add it if absent.
if 'diag=1' not in URL:
    URL += ('&' if '?' in URL else '?') + 'diag=1'


def rq(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method,
                                 headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode())


drv = subprocess.Popen(['/usr/bin/safaridriver', '--port', str(PORT)],
                       stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
time.sleep(2)
sess = rq('POST', '/session', {'capabilities': {'alwaysMatch': {'browserName': 'safari'}}})
if 'sessionId' not in sess.get('value', {}):
    print('SESSION FAILED:', sess.get('value', {}).get('message', sess))
    print('→ enable Safari > Developer > Allow Remote Automation (see header).')
    drv.terminate(); sys.exit(1)
sid = sess['value']['sessionId']


def js(script, is_async=False):
    kind = 'async' if is_async else 'sync'
    return rq('POST', f'/session/{sid}/execute/{kind}', {'script': script, 'args': []}).get('value')


def fps(ms=2500):
    return js("""var cb=arguments[arguments.length-1],n=0,t0=performance.now();
        function t(){n++; if(performance.now()-t0<%d) requestAnimationFrame(t);
        else cb(Math.round(n/((performance.now()-t0)/1000)));} requestAnimationFrame(t);""" % ms,
        is_async=True)


try:
    # 1440x900 is a laptop; John's window is far wider, and the 2026-08-01
    # termination turned on a defect that only showed at HIS width. Override
    # with SAFARI_CHECK_W / SAFARI_CHECK_H so a pass can be run from his seat.
    _w = int(os.environ.get('SAFARI_CHECK_W', '1440'))
    _h = int(os.environ.get('SAFARI_CHECK_H', '900'))
    rq('POST', f'/session/{sid}/window/rect', {'width': _w, 'height': _h, 'x': 0, 'y': 0})
    rq('POST', f'/session/{sid}/url', {'url': URL})
    time.sleep(9)
    js("try{window._threshold.close()}catch(e){}; return 1")   # the splash eats synthetic clicks
    time.sleep(1)

    print('url        :', URL)
    print('userAgent  :', js('return navigator.userAgent'))
    print('WebGPU     :', js('return !!navigator.gpu'))
    print('BOOT DIAG  :', json.dumps(js('return window.__diag || "recorder missing (?diag=1)"')))
    print('idle FPS   :', fps(1500))

    if LOCK:
        # Cast a node the deterministic way: hit-test the wheel for a real id,
        # then use the app's own toggleLock. Synthetic pointer events do NOT
        # reliably produce hover here — do not trust them for this.
        got = js("""
          var c=document.querySelector('canvas.forge-canvas'); if(!c) return null;
          var r=c.getBoundingClientRect(), D=window._forgeDebug;
          for(var y=0.20;y<0.85;y+=0.02) for(var x=0.15;x<0.70;x+=0.012){
            var h=D.hitTestAt(r.left+r.width*x, r.top+r.height*y);
            if(h){ var id=h.id||String(h); D.toggleLock(id); return id; }
          } return null;""")
        print('cast node  :', got)
        time.sleep(2.5)
        print('FPS w/cast :', fps())

    print('frameStats :', js('try{return JSON.stringify(window._forgeDebug.frameStats())}catch(e){return "n/a"}'))
    print('DIAG FINAL :', json.dumps(js('return window.__diag')))

    b = rq('GET', f'/session/{sid}/screenshot').get('value')
    if b:
        p = os.path.join(OUT, 'safari-check.png')
        open(p, 'wb').write(base64.b64decode(b))
        print('screenshot :', p)
finally:
    rq('DELETE', f'/session/{sid}')
    drv.terminate()
