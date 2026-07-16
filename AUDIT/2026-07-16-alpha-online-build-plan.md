# Alpha Online — Build Plan (Supabase + Cloudflare Pages)

> **Status:** SPEC / not yet executed. Ratified stack (John, 2026-07-16): **Supabase auth+db+storage** behind a
> **Cloudflare Pages** static host. Goal: put the current DEV app online for a small ring of *trusted* alpha
> testers, gated by an email allowlist John can flip on/off, with a per-user profile (display name + avatar)
> and server-saved Boards — the "this account is yours" functionality signal. **This is an alpha, not a launch.**

## 0. Guardrails (non-negotiable — John's global rules)
- **Anonymity Law.** New island: its own pseudonym, a per-service **Tuta alias on the privacy domain**, its own
  git author (already `Codex Atlas` pseudonym — keep it). John's real name/Gmail/`redacted-user` appear NOWHERE in
  repo, configs, deploy logs, dashboards, WHOIS, or provider profiles. Record the chosen identity in a
  `PROJECT-IDENTITY.md` for this project before any account is made.
- **No account creation by me.** Supabase + Cloudflare accounts are created by **John** (prohibited action for me).
  I supply the click-by-click steps.
- **No secrets in the repo.** Supabase `anon` key is the only key that reaches the client (public, RLS-gated —
  legal to ship). The `service_role` key NEVER leaves Supabase / a server context. `.env*` stays gitignored.
- **Server-enforced access.** Every per-user row is protected by Row-Level Security so no path returns another
  user's private data. The email allowlist is enforced server-side, not just hidden in the UI.
- **Pre-go-public gate.** Run `_FOUNDER-PROTOCOL/SECURITY-CHECKLIST.md` leak+privacy gate BEFORE the first
  public deploy. WHOIS privacy on any custom domain. Prefer no-phone/no-SMS signup paths.

## 1. What already exists (de-risks the build)
The SaaS seams are stubbed and waiting:
- `src/js/user-menu.js:34` — Sign in / Sign up menu items (currently `alert()` "coming soon").
- `src/js/app.js:806` — `ACCT_KEY` account model (`readAccount`/`writeAccount`) built to "behave identically to a
  real auth flow so the wiring is testable; the server-side identity check plugs in later."
- `src/js/views/boards.js:762` — `saveCurrentBoard()` already persists boards to localStorage.

**Strategy:** introduce one thin `auth.js` / `sync.js` seam that swaps the localStorage-backed account + boards
for Supabase-backed ones, behind the SAME function signatures. Keep localStorage as the offline/anonymous
fallback. No rewrite of app.js.

## 2. Architecture
```
Browser (static app on *.pages.dev or custom domain)
  ├─ supabase-js (vendored locally, not CDN)
  │    ├─ auth: email magic-link (OTP) — no passwords anywhere
  │    ├─ db (Postgres + RLS): profiles, boards
  │    └─ storage: avatars bucket (per-user path, RLS)
  └─ existing static payload (data.js, scripture-texts.js, PMTiles basemap, ...)
```

### 2.1 Auth — email magic-link
- Supabase Auth, **magic-link / email OTP only** (no password field → nothing for me to ever handle).
- **Allowlist enforcement (the on/off switch):** a `allowed_emails` table + a Postgres trigger / auth hook that
  rejects sign-ups whose email isn't allowlisted (or a `handle_new_user` trigger that only provisions a profile
  for allowlisted emails, and RLS that denies everything to non-provisioned users). John adds/removes a friend
  by editing one table row — the "switch." Decide final mechanism at build time (auth hook vs trigger+RLS);
  trigger+RLS is the simplest that's still server-enforced.

### 2.2 Database (Postgres, RLS on every table)
- `profiles` — `id (uuid, = auth.uid())`, `display_name`, `avatar_url`, `created_at`, `updated_at`.
  RLS: a user can read/update only their own row (public-read optional later for a social layer).
- `boards` — `id`, `owner (uuid = auth.uid())`, `title`, `state (jsonb — the existing board shape)`,
  `created_at`, `updated_at`. RLS: owner-only read/write. This is the exact shape `boards.js` already saves;
  we lift it from localStorage to a row.
- `allowed_emails` — `email (pk)`, `added_at`, `note`. Service/John-only; drives the gate.

### 2.3 Storage — avatars
- One `avatars` bucket, per-user folder `avatars/{uid}/...`, RLS so a user writes only their own folder.
- Client resizes/caps upload size before send (treat uploads as hostile: validate type, cap dimensions/bytes).

## 3. Frontend work (respects app-architecture.md contract)
- **Vendor deps locally first** (pre-host hardening, independent of everything): move `d3` + `marked` off CDN
  (`index.html:177-178`) into `_assets/vendor/`, and add vendored `supabase-js` there too. No external requests.
- **`auth.js` seam** — wraps Supabase auth; exposes `signInWithEmail()`, `signOut()`, `getUser()`; updates the
  existing account state so `user-menu.js` reflects signed-in identity (avatar + name in the drawer).
- **Profile page** — a new first-class view/pane (design agent is mocking this): display name field, avatar
  upload, and the user's saved Boards list. Built with the existing tokens/primitives (no inline styles, no new
  fonts/colors/z-index — app-architecture.md §2/§7).
- **Boards sync** — `saveCurrentBoard()` writes to Supabase when signed in, localStorage when not; on sign-in,
  offer to migrate local boards up.
- **Sign-in UI** — replace the `alert()` in `user-menu.js:144` with a real magic-link modal (email field →
  "check your inbox").

## 4. Hosting — Cloudflare Pages
- Static deploy (no build step — the app is already static). Point Pages at the repo or a direct upload.
- **Compression:** ensure gzip/brotli on `data.js` (44 MB raw → far smaller); confirm `Range` support for the
  185 MB PMTiles basemap (Pages supports it; verify). Consider NOT shipping the basemap on day 1 if the Atlas
  map view is hidden for alpha — saves the heaviest asset.
- **Cache headers:** no-store on `data.js` / code during DEV churn; long cache on media/vendor.
- Custom domain optional for alpha (`*.pages.dev` is fine and leaks less than registering a domain now); if a
  domain is used → WHOIS privacy, pseudonymous registrar account.

## 5. Sequence (execute AFTER the two Fable reviews land)
1. Read both Fable reports; lock the alpha view-set + any product reframes.
2. Pre-host hardening: vendor CDN deps; hide non-alpha views behind `FEATURES`; make honest stubs real-or-hidden.
3. John creates Supabase + Cloudflare accounts (pseudonymous, Tuta alias). I supply click-by-click steps.
4. I build: DB schema + RLS + allowlist gate; `auth.js` seam; profile view; boards sync; sign-in modal.
5. Local verify (magic-link against a test allowlisted alias; RLS negative tests — confirm a second user can't
   read the first's boards).
6. Run the leak+privacy gate. Deploy to Cloudflare Pages. Add the first friends' emails to the allowlist.
7. Ship a tiny "you're in the alpha" first-run note. Collect feedback.

## Open decisions for John (later, not blocking the reviews)
- Custom domain now vs `*.pages.dev` for alpha (anonymity + cost tradeoff).
- Public-read profiles (a light social layer) vs strictly private — affects RLS. Default: private.
- Whether the Atlas map (185 MB basemap) is in the alpha or hidden to keep the payload light.
