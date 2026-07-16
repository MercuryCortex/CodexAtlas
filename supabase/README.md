# Supabase — Codex Atlas schema & setup

Mirrors the CODEXCORTEX flow. The database that backs cloud accounts for the alpha. The app holds
**no** service_role key; **Row-Level Security is the only access gate** (`migrations/0001_auth_foundation.sql`).
Each signed-in user touches only their own rows. The **`allowed_emails` table is the on/off switch** —
only listed emails can sign up.

## 0. Which org / project
- **New Supabase organization `Codex Atlas`** (its own island — not the CodexCortex or Gnosis org).
- One project inside it named **`codex-atlas`** (eu-west-1). Free tier covers the alpha ($0).

## 1. Apply the schema (one-time)
Supabase dashboard → **SQL Editor** → paste the full contents of `migrations/0001_auth_foundation.sql`
→ **Run**. Idempotent (safe to re-run). Then in **Table Editor** confirm `profiles`, `boards`,
`allowed_emails` exist with RLS **enabled** (shield icon).

## 2. Let people in (the on/off switch)
Table Editor → `allowed_emails` → insert a row per person (start with your own + `atlas@codexcortex.com`,
then each friend). Remove a row = cut their access. Non-listed emails are refused at signup, server-side.

## 3. Auth settings (friends test)
1. **Authentication → Providers → Email**: keep **Email** enabled (we use **magic-link**, passwordless).
2. **Authentication → URL Configuration**:
   - **Site URL** = the deployed URL (alpha: the `*.pages.dev` URL; later `https://codexatlas.org`).
   - **Redirect URLs**: add the deployed URL and `http://localhost:8742` (local dev). The magic-link
     returns the session in the URL; supabase-js (with `detectSessionInUrl`) picks it up — no callback route.
3. (Optional for a smoother test) **Confirm email**: magic-link already verifies; leave defaults.

## 4. Keys the app needs (public — safe to ship)
From **Settings → API**: the **Project URL** + the **`anon` / publishable key**. These go into a small
client config the static app reads (the anon key is public and RLS-gated — intentional, like CODEXCORTEX's
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). **Never** ship or paste the `service_role` key.

## 5. Verify isolation (must never break)
Two test accounts. Signed in as A, save a board. Signed in as B, confirm you **cannot** see A's board.
(This is the leak-gate item for multi-user data.)

## Data model (what 0001 creates)
- `profiles` — one per user: `display_name`, `badge` (Folio badge 0–7), `theme`, `seal_no` (sequential
  "Alpha Seal Nº"), `avatar_url` (reserved for later photo upload). Auto-created on signup.
- `boards` — `(owner_id, board_id)`, `data` jsonb (the whole local board round-trips). Owner-only.
- `allowed_emails` — the alpha allowlist. Dashboard-only (no client access).
