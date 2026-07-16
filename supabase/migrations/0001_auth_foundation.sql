-- ════════════════════════════════════════════════════════════════════════════════════════
-- CODEX ATLAS — Auth foundation: profiles + boards + email allowlist + Row-Level Security
-- Migration 0001 · 2026-07-17 · mirrors the CODEXCORTEX pattern (supabase/migrations/0001).
--
-- Apply in the Supabase SQL Editor (paste + Run). IDEMPOTENT — safe to re-run, never drops data.
--
-- SECURITY MODEL (never compromise): every row is owned by exactly one auth user. RLS is the
-- ONLY gate — the app stores NO service_role key and never bypasses it. A signed-in user can
-- read/write ONLY their own rows. The `allowed_emails` table is the ALPHA ON/OFF SWITCH:
-- signup is refused (server-side) for any email not listed. Public sharing is OFF.
-- ════════════════════════════════════════════════════════════════════════════════════════

create extension if not exists citext;                 -- case-insensitive email matching

-- ── The alpha allowlist (John's on/off switch) ──────────────────────────────────────────
-- Add a friend: insert their email. Cut access: delete the row. Managed ONLY from the
-- Supabase dashboard (Table Editor) — RLS below denies all client access to this table.
create table if not exists public.allowed_emails (
  email    citext      primary key,
  note     text,
  added_at timestamptz not null default now()
);
alter table public.allowed_emails enable row level security;   -- no policies → dashboard/service_role only

-- ── Profiles (one per auth user; matches the Folio: name + badge + theme + seal) ─────────
create table if not exists public.profiles (
  id           uuid        primary key references auth.users (id) on delete cascade,
  display_name text        not null default 'Seeker',
  badge        int         not null default 0,        -- Folio badge index (0..7)
  theme        text        not null default 'codex',  -- codex | quantum | human | mystic
  seal_no      int,                                   -- sequential "Alpha Seal Nº"
  avatar_url   text,                                  -- reserved for real photo upload (later)
  created_at   timestamptz not null default now()
);

-- ── Boards (data jsonb round-trips the whole local board shape) ──────────────────────────
create table if not exists public.boards (
  owner_id   uuid        not null references auth.users (id) on delete cascade,
  board_id   text        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (owner_id, board_id)
);
create index if not exists boards_owner_updated_idx on public.boards (owner_id, updated_at desc);

-- ── Row-Level Security ──────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.boards   enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select_own on public.profiles for select using (auth.uid() = id);
create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists boards_select on public.boards;
drop policy if exists boards_insert on public.boards;
drop policy if exists boards_update on public.boards;
drop policy if exists boards_delete on public.boards;
create policy boards_select on public.boards for select using (auth.uid() = owner_id);
create policy boards_insert on public.boards for insert with check (auth.uid() = owner_id);
create policy boards_update on public.boards for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy boards_delete on public.boards for delete using (auth.uid() = owner_id);

-- Table privileges: anon gets NOTHING; authenticated gets CRUD (still bounded by policies).
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.boards   to authenticated;

-- ── Sequential Alpha Seal numbers ───────────────────────────────────────────────────────
create sequence if not exists public.alpha_seal_seq;

-- ── Signup gate + auto-provision the profile ────────────────────────────────────────────
-- SECURITY DEFINER so it can read allowed_emails + insert the profile. The allowlist check
-- RAISES for a non-listed email, which aborts the auth.users insert → the ON/OFF SWITCH.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.allowed_emails where email = new.email) then
    raise exception 'codex-atlas: % is not on the alpha allowlist', new.email;
  end if;
  insert into public.profiles (id, display_name, seal_no)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    nextval('public.alpha_seal_seq')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── FIRST: allow yourself in (edit the email, then this is safe to re-run) ───────────────
-- insert into public.allowed_emails (email, note) values
--   ('atlas@codexcortex.com', 'founder')
-- on conflict (email) do nothing;

-- ── FUTURE: public board sharing — DO NOT enable until the share feature ships ───────────
-- create policy boards_public_read on public.boards for select using ((data->>'visibility') = 'public');
-- grant select on public.boards to anon;
