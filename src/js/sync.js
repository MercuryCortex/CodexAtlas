// ============================================================
// CODEX ATLAS — ✦ CLOUD SYNC (local-first ⇄ Supabase)
// ============================================================
// Filed 2026-07-17 (Phase B, final functional piece). Keeps the local stores
// (the Folio profile + the Boards library) mirrored to the signed-in user's
// Supabase rows. LOCAL-FIRST: the app always reads/writes localStorage (fast,
// offline, unchanged); this layer pushes changes up + pulls the account's data
// down when signed in. Signed OUT → this module does nothing.
//
// Stores:
//   profile  ← localStorage 'codex-atlas/folio-v1' {name,badge,sealNo} + theme
//              in 'codex-style'  ⇄  public.profiles row
//   boards   ← localStorage 'atlas.boards.v1' {boards:[...],currentBoardId}
//              ⇄  public.boards rows (data jsonb = the whole local board)
//
// Triggers: codex:auth-changed (pull+push on sign-in), codex:profile-changed
// (push profile), boards:library-changed (push/delete the changed board).
// RLS guarantees a user only ever touches their own rows. No service_role.
// Loads after auth.js + boards.js + folio.js.
// ============================================================

(function () {
  'use strict';

  var FOLIO_KEY = 'codex-atlas/folio-v1';
  var STYLE_KEY = 'codex-style';
  var BOARDS_KEY = 'atlas.boards.v1';

  function client()   { return (window._auth && window._auth.getClient) ? window._auth.getClient() : null; }
  function uid()      { var u = window._auth && window._auth.getUser && window._auth.getUser(); return u && u.id; }
  function signedIn() { return !!(window._auth && window._auth.isSignedIn && window._auth.isSignedIn()); }

  function readLocal(k)    { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } }
  function writeLocal(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function readStyle()     { try { return localStorage.getItem(STYLE_KEY) || 'codex'; } catch (_) { return 'codex'; } }

  // ── PROFILE ─────────────────────────────────────────────────
  function localProfile() { return readLocal(FOLIO_KEY) || {}; }
  function isCustomProfile(p) {
    return !!(p && ((p.name && p.name !== 'Seeker') || (p.badge && p.badge !== 0) || (readStyle() !== 'codex')));
  }
  function pushProfile() {
    var c = client(), id = uid(); if (!c || !id) return Promise.resolve();
    var p = localProfile();
    return c.from('profiles').upsert({
      id: id, display_name: p.name || 'Seeker', badge: p.badge || 0, theme: readStyle(),
    }, { onConflict: 'id' }).then(function (r) {
      if (r && r.error) console.warn('[sync] pushProfile', r.error.message);
    }).catch(function (e) { console.warn('[sync] pushProfile', e); });
  }
  function pullProfile() {
    var c = client(), id = uid(); if (!c || !id) return Promise.resolve();
    return c.from('profiles').select('display_name,badge,theme,seal_no,avatar_url').eq('id', id).maybeSingle()
      .then(function (r) {
        if (r.error || !r.data) return;
        var p = localProfile();
        p.name  = r.data.display_name || p.name || 'Seeker';
        p.badge = (typeof r.data.badge === 'number') ? r.data.badge : (p.badge || 0);
        if (r.data.seal_no) p.sealNo = r.data.seal_no;
        writeLocal(FOLIO_KEY, p);
        if (r.data.theme && window.applyStyle) window.applyStyle(r.data.theme);   // persists codex-style
        refreshFolioIfOpen();
      }).catch(function (e) { console.warn('[sync] pullProfile', e); });
  }

  // ── BOARDS ──────────────────────────────────────────────────
  function localBoards() {
    var s = readLocal(BOARDS_KEY);
    return (s && Array.isArray(s.boards)) ? s : { boards: [], currentBoardId: null };
  }
  function isoOf(ms) { try { return new Date(ms || Date.now()).toISOString(); } catch (_) { return new Date().toISOString(); } }
  function pushBoard(id) {
    var c = client(), o = uid(); if (!c || !o || !id) return;
    var b = localBoards().boards.filter(function (x) { return x.id === id; })[0]; if (!b) return;
    c.from('boards').upsert({
      owner_id: o, board_id: b.id, data: b, updated_at: isoOf(b.updatedAt),
    }, { onConflict: 'owner_id,board_id' }).then(function (r) {
      if (r && r.error) console.warn('[sync] pushBoard', r.error.message);
    }).catch(function (e) { console.warn('[sync] pushBoard', e); });
  }
  function deleteBoard(id) {
    var c = client(), o = uid(); if (!c || !o || !id) return;
    c.from('boards').delete().eq('owner_id', o).eq('board_id', id)
      .then(function () {}).catch(function (e) { console.warn('[sync] deleteBoard', e); });
  }
  function pullBoards() {
    var c = client(), o = uid(); if (!c || !o) return Promise.resolve();
    return c.from('boards').select('board_id,data,updated_at').eq('owner_id', o).then(function (r) {
      if (r.error || !r.data) return;
      var store = localBoards();
      var byId = {}; store.boards.forEach(function (b) { byId[b.id] = b; });
      r.data.forEach(function (row) {
        var cloud = row.data || {}; cloud.id = cloud.id || row.board_id;
        var local = byId[cloud.id];
        // newest-updatedAt wins; cloud fills in anything local doesn't have
        if (!local || (cloud.updatedAt || 0) >= (local.updatedAt || 0)) byId[cloud.id] = cloud;
      });
      store.boards = Object.keys(byId).map(function (k) { return byId[k]; })
        .sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
      writeLocal(BOARDS_KEY, store);
      document.dispatchEvent(new CustomEvent('boards:library-changed', { detail: { kind: 'sync' } }));
    }).catch(function (e) { console.warn('[sync] pullBoards', e); });
  }
  function pushAllLocalBoards() { localBoards().boards.forEach(function (b) { pushBoard(b.id); }); }

  function refreshFolioIfOpen() {
    var f = document.getElementById('folio');
    if (f && f.classList.contains('is-open') && window._folio && window._folio.open) window._folio.open();
  }

  // ── ORCHESTRATION ───────────────────────────────────────────
  function onSignIn() {
    if (!signedIn()) return;
    // Profile: if the user customized locally (while signed out), push those up
    // first; otherwise the cloud is the source of truth — pull it down.
    var profileStep = isCustomProfile(localProfile()) ? pushProfile().then(pullProfile) : pullProfile();
    profileStep.then(pullBoards).then(function () {
      pushAllLocalBoards();   // make sure any local-only boards reach the account
    });
  }

  document.addEventListener('codex:auth-changed', function (ev) {
    if (ev.detail && ev.detail.signedIn) onSignIn();
  });
  document.addEventListener('codex:profile-changed', function () { if (signedIn()) pushProfile(); });
  document.addEventListener('boards:library-changed', function (ev) {
    if (!signedIn()) return;
    var d = ev.detail || {};
    if (d.kind === 'save' || d.kind === 'update') pushBoard(d.id);
    else if (d.kind === 'delete') deleteBoard(d.id);
    // 'sync' / 'load' → no-op (avoids feedback loops)
  });

  // Already signed in at load (persisted session)? Sync once auth resolves.
  if (window._auth && window._auth.ready) {
    window._auth.ready().then(function (r) { if (r && r.signedIn) onSignIn(); });
  }

  window._sync = {
    onSignIn: onSignIn, pushProfile: pushProfile, pullProfile: pullProfile,
    pushBoard: pushBoard, pullBoards: pullBoards,
  };
})();
