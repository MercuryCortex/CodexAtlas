# Go Online — setup guide (for John) · 2026-07-16

> Plain-language, click-by-click. Goal: put the DEV app online for a small ring of
> **trusted friends**, gated by an email switch you control, with the personal Folio +
> saved boards working for real (cross-device). Stack (ratified): **Supabase** (auth +
> database + avatar storage) behind **Cloudflare Pages** (static host). Follows your own
> `_FOUNDER-PROTOCOL/` (Anonymity Law + SECURITY-CHECKLIST + GO-LIVE).
>
> **What only YOU can do:** create the accounts + email aliases (I'm not allowed to create
> accounts or handle passwords). **What I do:** everything else — the database, the security
> rules, wiring the app, the leak gate, the deploy.

---

## The order of operations
1. **Set the island identity** (below) — pseudonym + email aliases. *Anonymity Law: this
   project must not link to you or your other products.* ← **needs your decisions**
2. **You create 2 accounts** (Supabase + Cloudflare) with that identity — steps below.
3. **I build the backend** — database tables, the owner-only security rules (so no friend can
   see another's boards), the email allowlist (your on/off switch), and swap the Folio/boards
   from local storage to the real backend.
4. **Leak gate** — I run your `SECURITY-CHECKLIST` + `audit.sh`. Must be ✅ before deploy.
5. **Deploy to Cloudflare Pages**, then you add your friends' emails to the allowlist.

---

## Step 1 — The island identity (your call)
Per the Anonymity Law, Codex Atlas needs its **own** pseudonym + **per-service email aliases on
your Tuta privacy domain** — never your real name/Gmail, never shared with VEKTOR or other
projects. The git author is already the `Codex Atlas` pseudonym (good).

**Two decisions I need from you:**
- **A public pseudonym** for the service accounts (a handle, not your name). If you don't have a
  preference I'll propose one for approval.
- **Your Tuta setup** — do you already have a Tuta privacy domain/aliases for this project, or
  should the steps below assume you'll create fresh aliases in Tuta?

Once you tell me, I'll fill in and save `PROJECT-IDENTITY.md` (gitignored) so it's recorded. The
per-service aliases will look like:

| Service | Alias (example) |
|---|---|
| Database / auth (Supabase) | `codexatlas-db@<your-privacy-domain>` |
| Web host (Cloudflare) | `codexatlas-host@<your-privacy-domain>` |

*(Make these aliases in Tuta first — one for each service — so no service can link to another.)*

---

## Step 2 — Create the two accounts (you)
Both are **free** at alpha scale and **neither requires a phone/SMS** (your rule).

### 2a. Supabase (the backend — auth + database + avatar storage)
1. Go to **supabase.com** → **Start your project** / **Sign up**.
2. Sign up with the **`codexatlas-db@…` alias** (email, or GitHub if that GitHub is pseudonymous —
   email is cleaner). Use a strong password from your password manager. **Do not tell me the
   password.**
3. Create a new **project**: name it `codex-atlas`, pick a region near you, set a strong database
   password (save it in your password manager).
4. When it's ready, open **Project Settings → API**. You'll see two keys:
   - **`anon` / publishable key** — this one is safe to put in the app (it's public and gated by
     the security rules I'll write). Paste **this one** to me when ready.
   - **`service_role` key** — **NEVER share this, never in the app.** It bypasses all security.
     Leave it in Supabase.
5. Tell me the **project URL** + the **`anon` key**. That's all I need.

### 2b. Cloudflare (the host)
1. Go to **cloudflare.com** → **Sign up** with the **`codexatlas-host@…` alias**. No phone needed.
2. That's it for now — I'll walk you through connecting the deploy when the build is ready
   (Cloudflare Pages, direct upload or a private repo). If we add a custom domain later, it gets
   **WHOIS privacy ON** (your rule); for the alpha a free `*.pages.dev` URL is fine and leaks less.

---

## Step 3 — What I build (no action from you)
- **Database**: a `profiles` table (name, avatar, badge, theme) and a `boards` table (your board
  shape, already matches). **Row-Level Security** so each person can read/write **only their own**
  rows — server-enforced, exactly your rule that the client never decides access.
- **The email switch**: an `allowed_emails` table. To let a friend in, you add their email (one
  row); to cut access, you remove it. Sign-ups from non-listed emails are refused server-side.
- **Auth**: passwordless **magic-link** (a one-time link to their email) — so there's never a
  password for me to touch, and no reset flows.
- **Avatars**: your illuminated-initial + badge stays the default; real photo upload can come later
  (per-user storage folder, owner-only).
- **The swap**: the Folio + Boards already work against a clean local seam; I switch that seam to
  Supabase behind the same functions. Signed-out = still works locally; signed-in = real + synced.

---

## Step 4 — Leak gate (I run, before deploy)
From the project root, I run your gate — it must come back clean:
```
bash "/Users/redacted-user/Desktop/PRODUCT DEVELOPMENT/_FOUNDER-PROTOCOL/audit.sh"
```
Plus the `SECURITY-CHECKLIST`: real-identity scan returns nothing · only the `anon` key ships (never
`service_role`) · git authors are the pseudonym only · host account pseudonymous · access is
server-enforced (RLS) · private by default. If anything isn't ✅, we fix before shipping.

---

## Step 5 — Deploy + invite
I deploy the static app (with a `dist/` allowlist so we serve the app, **not** the source vault) to
Cloudflare Pages, confirm compression on the big `data.js` + range-requests for the map, smoke-test
a magic-link sign-in against a test alias, then you add your friends' emails. They get a link,
click it, and they're in — with their own Folio and boards.

---

### The two things blocking me right now
1. **Your pseudonym** (or say "propose one").
2. **Your Tuta situation** (existing privacy domain, or create fresh aliases?).

Give me those and I'll record the identity + hand you the exact Supabase/Cloudflare clicks with your
real alias filled in.
