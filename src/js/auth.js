// ============================================================
// CODEX ATLAS — ✦ AUTH SEAM (Supabase, passwordless magic-link)
// ============================================================
// Filed 2026-07-17 (Phase B go-online). The single seam between the app and
// Supabase. Signed OUT → the app runs 100% locally (localStorage), exactly as
// before. Signed IN → the Folio + Boards read/write the user's own rows
// (RLS-guarded). No password anywhere (magic-link OTP); no service_role key.
//
// Exposes window._auth:
//   ready()                       → Promise, resolves once initial session known
//   getClient()                   → the supabase-js client (or null if unconfigured)
//   isSignedIn() / getUser()      → current auth state
//   signInWithEmail(email)        → Promise<{ok,error}> — sends the magic link
//   signOut()                     → Promise
//   onChange(fn)                  → subscribe to {event,user}; returns unsub
//   probe()                       → connectivity self-test (dev/verify only)
//
// Loads AFTER _assets/vendor/supabase/supabase.js + src/js/supabase-config.js.
// ============================================================

(function () {
  'use strict';

  var cfg = window.CODEX_SUPABASE || {};
  var _client = null;
  var _user = null;
  var _resolvedReady;
  var _ready = new Promise(function (res) { _resolvedReady = res; });
  var _subs = [];

  function getClient() {
    if (_client) return _client;
    if (!window.supabase || !window.supabase.createClient || !cfg.url || !cfg.anonKey) return null;
    _client = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,   // picks up the magic-link token on return
        flowType: 'pkce',
        storageKey: 'codex-atlas/sb-auth',
      },
    });
    return _client;
  }

  function setUser(u) {
    var was = _user && _user.id;
    _user = u || null;
    var now = _user && _user.id;
    if (was !== now) {
      _subs.forEach(function (fn) { try { fn({ user: _user }); } catch (_) {} });
      // let the rest of the app react (Folio/boards swap their store)
      document.dispatchEvent(new CustomEvent('codex:auth-changed', { detail: { signedIn: !!_user } }));
    }
  }

  function isSignedIn() { return !!_user; }
  function getUser() { return _user; }
  function ready() { return _ready; }
  function onChange(fn) {
    _subs.push(fn);
    return function () { _subs = _subs.filter(function (f) { return f !== fn; }); };
  }

  // Send the one-time magic link. The link returns the tester to THIS origin;
  // the URL must be in Supabase → Auth → URL Configuration → Redirect URLs.
  function signInWithEmail(email) {
    var c = getClient();
    if (!c) return Promise.resolve({ ok: false, error: 'Auth not configured' });
    var redirect = window.location.origin + window.location.pathname;
    return c.auth.signInWithOtp({
      email: String(email || '').trim(),
      options: { emailRedirectTo: redirect },
    }).then(function (r) {
      if (r.error) return { ok: false, error: r.error.message || String(r.error), status: r.error.status };
      return { ok: true };
    }).catch(function (e) { return { ok: false, error: String(e) }; });
  }

  function signOut() {
    var c = getClient();
    if (!c) { setUser(null); return Promise.resolve(); }
    return c.auth.signOut().then(function () { setUser(null); });
  }

  // Connectivity self-test (dev/verify). Distinguishes a bad key (401 / "Invalid
  // API key") from "reached the DB, tables not migrated yet" (relation missing).
  function probe() {
    var c = getClient();
    if (!c) return Promise.resolve({ configured: false });
    return c.from('profiles').select('id').limit(1).then(function (r) {
      var msg = r.error && (r.error.message || '');
      return {
        configured: true,
        reachedDb: !/Invalid API key|JWT|No API key/i.test(msg),
        tablesPresent: !r.error,
        migrationPending: !!(r.error && /relation .* does not exist|does not exist/i.test(msg)),
        error: msg || null,
      };
    }).catch(function (e) { return { configured: true, reachedDb: false, error: String(e) }; });
  }

  // ── INIT ─────────────────────────────────────────────────────
  (function init() {
    var c = getClient();
    if (!c) { _resolvedReady({ signedIn: false, configured: false }); return; }
    c.auth.getSession().then(function (r) {
      setUser(r && r.data && r.data.session ? r.data.session.user : null);
      _resolvedReady({ signedIn: isSignedIn(), configured: true });
    }).catch(function () { _resolvedReady({ signedIn: false, configured: true }); });
    // React to sign-in (magic-link return), token refresh, sign-out.
    c.auth.onAuthStateChange(function (_event, session) {
      setUser(session ? session.user : null);
    });
  })();

  window._auth = {
    ready: ready, getClient: getClient, isSignedIn: isSignedIn, getUser: getUser,
    signInWithEmail: signInWithEmail, signOut: signOut, onChange: onChange, probe: probe,
  };
})();
