// ============================================================
// CODEX ATLAS — ✦ SIGN-IN ("Enter the Codex") · magic-link modal
// ============================================================
// Filed 2026-07-17 (Phase B). Design surface 02. Passwordless: the tester
// types their email, we send a one-time link (window._auth.signInWithEmail),
// they click it and return signed in. Two states of one glass card: REQUEST
// and KEY-SENT. No password field — nothing secret client-side.
//
// Reached from the ✦ menu → "Sign in". Self-installs window._signin.
// Loads after auth.js + the ✦ user-menu. Glass inherits the active theme.
// ============================================================

(function () {
  'use strict';

  var _el = null;

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function validEmail(s) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || '').trim()); }

  function build() {
    var el = document.createElement('div');
    el.className = 'signin';
    el.id = 'signin';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Sign in to Codex Atlas');
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="signin-scrim" data-signin-dismiss="1"></div>' +
      '<div class="signin-card" role="document">' +
        '<button type="button" class="signin-close" data-signin-dismiss="1" aria-label="Close">×</button>' +
        '<div class="signin-glyph">✦</div>' +
        '<div class="signin-body" data-signin-state="request">' +
          '<h2 class="signin-title">Enter the Codex</h2>' +
          '<p class="signin-copy">No passwords. We send a one-time key to your&nbsp;email.</p>' +
          '<form class="signin-form" novalidate>' +
            '<input type="email" class="signin-field" name="email" autocomplete="email" spellcheck="false" ' +
              'placeholder="seeker@example.com" aria-label="Email address" />' +
            '<button type="submit" class="signin-btn">Send key →</button>' +
            '<div class="signin-error" aria-live="polite"></div>' +
          '</form>' +
          '<div class="signin-foot">Alpha access · by invitation</div>' +
        '</div>' +
        '<div class="signin-body" data-signin-state="sent" hidden>' +
          '<h2 class="signin-title">The key is sent.</h2>' +
          '<div class="signin-sent-glyph">✉</div>' +
          '<div class="signin-sent-email"></div>' +
          '<p class="signin-copy">Check your inbox — the link opens this door. It can take a minute.</p>' +
          '<button type="button" class="signin-again">Use another email</button>' +
        '</div>' +
      '</div>';

    el.querySelectorAll('[data-signin-dismiss]').forEach(function (n) {
      n.addEventListener('click', close);
    });
    var form = el.querySelector('.signin-form');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      submit();
    });
    el.querySelector('.signin-again').addEventListener('click', function () { showState('request'); });
    document.body.appendChild(el);
    return el;
  }

  function showState(which) {
    if (!_el) return;
    _el.querySelectorAll('[data-signin-state]').forEach(function (b) {
      b.hidden = (b.getAttribute('data-signin-state') !== which);
    });
    if (which === 'request') {
      var f = _el.querySelector('.signin-field');
      var err = _el.querySelector('.signin-error');
      if (err) err.textContent = '';
      if (f) { f.value = ''; setTimeout(function () { f.focus(); }, 40); }
    }
  }

  function submit() {
    var field = _el.querySelector('.signin-field');
    var err = _el.querySelector('.signin-error');
    var btn = _el.querySelector('.signin-btn');
    var email = (field && field.value || '').trim();
    err.textContent = '';
    if (!validEmail(email)) { err.textContent = 'Enter a valid email address.'; field.focus(); return; }
    if (!window._auth || !window._auth.signInWithEmail) {
      err.textContent = 'Sign-in is not available yet.'; return;
    }
    btn.disabled = true; btn.textContent = 'Sending…';
    window._auth.signInWithEmail(email).then(function (r) {
      btn.disabled = false; btn.textContent = 'Send key →';
      if (r && r.ok) {
        _el.querySelector('.signin-sent-email').textContent = email;
        showState('sent');
      } else {
        err.textContent = friendlyError(r && r.error);
      }
    });
  }

  // Turn Supabase/allowlist errors into plain, non-leaky language.
  function friendlyError(msg) {
    msg = String(msg || '');
    if (/allowlist|not on the alpha/i.test(msg)) return 'That email isn’t on the alpha list yet.';
    if (/redirect|not allowed|url/i.test(msg)) return 'Sign-in isn’t fully configured yet — hang tight.';
    if (/rate|too many/i.test(msg)) return 'Too many tries — wait a minute and retry.';
    return 'Could not send the key. Try again in a moment.';
  }

  function open() {
    if (window._auth && window._auth.isSignedIn && window._auth.isSignedIn()) return; // already in
    if (!_el) _el = build();
    showState('request');
    _el.setAttribute('aria-hidden', 'false');
    void _el.offsetWidth;
    _el.classList.add('is-open');
    document.addEventListener('keydown', _onKey);
  }
  function close() {
    if (!_el) return;
    _el.classList.remove('is-open');
    _el.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', _onKey);
  }
  function _onKey(ev) { if (ev.key === 'Escape') close(); }

  // Auto-close when auth succeeds (magic-link return or same-tab sign-in).
  document.addEventListener('codex:auth-changed', function (ev) {
    if (ev.detail && ev.detail.signedIn) close();
  });

  window._signin = { open: open, close: close };
})();
