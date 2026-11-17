-- ============================================================
-- Webcore Blog — skema Supabase. Jalankan SELURUH file ini di
-- Supabase Dashboard → SQL Editor → New query → Run.
-- ============================================================
create extension if not exists pgcrypto;

-- ---------- admin ----------
create table if not exists public.admins(user_id uuid primary key references auth.users(id) on delete cascade);
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from public.admins where user_id=auth.uid()); $$;

-- ---------- tabel ----------
create table if not exists public.settings(id int primary key default 1 check(id=1), data jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
insert into public.settings(id) values(1) on conflict do nothing;

create table if not exists public.stats(id int primary key default 1 check(id=1), hits bigint not null default 0);
insert into public.stats(id) values(1) on conflict do nothing;
create or replace function public.bump_hits() returns bigint language sql security definer set search_path=public as
$$ update public.stats set hits=hits+1 where id=1 returning hits; $$;
grant execute on function public.bump_hits() to anon, authenticated;

create table if not exists public.entries(
 id uuid primary key default gen_random_uuid(),
 kind text not null default 'post' check(kind in('post','page')),
 title text not null, slug text not null, content text default '',
 status text not null default 'draft' check(status in('draft','published')),
 cat text default '', excerpt text default '', emoji text default '✨', c1 text default '#8a5cff', c2 text default '#ff5fd2', cover text default '',
 nav boolean default false, pinned boolean default false, tags text[] default '{}',
 publish_at timestamptz default now(), seo_title text default '', seo_desc text default '',
 created_at timestamptz default now(), updated_at timestamptz default now(),
 unique(kind,slug));

create table if not exists public.media(id uuid primary key default gen_random_uuid(), name text, path text, url text, mime text, size bigint, created_at timestamptz default now());
create table if not exists public.subscribers(id uuid primary key default gen_random_uuid(), email text unique not null, created_at timestamptz default now());
create table if not exists public.guestbook(id uuid primary key default gen_random_uuid(), name text not null, message text not null, approved boolean default false, created_at timestamptz default now());

create or replace function public.touch() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists t_touch on public.entries;
create trigger t_touch before update on public.entries for each row execute function public.touch();

-- ---------- keamanan: Row Level Security ----------
alter table public.admins enable row level security;
alter table public.settings enable row level security;
alter table public.stats enable row level security;
alter table public.entries enable row level security;
alter table public.media enable row level security;
alter table public.subscribers enable row level security;
alter table public.guestbook enable row level security;

drop policy if exists "admins self" on public.admins;
create policy "admins self" on public.admins for select to authenticated using (user_id=auth.uid());

drop policy if exists "settings read" on public.settings;  create policy "settings read" on public.settings for select using (true);
drop policy if exists "settings admin" on public.settings; create policy "settings admin" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "stats read" on public.stats;        create policy "stats read" on public.stats for select using (true);
drop policy if exists "stats admin" on public.stats;       create policy "stats admin" on public.stats for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "entries read" on public.entries;
create policy "entries read" on public.entries for select using ((status='published' and publish_at<=now()) or public.is_admin());
drop policy if exists "entries admin" on public.entries;
create policy "entries admin" on public.entries for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "media read" on public.media;   create policy "media read" on public.media for select using (true);
drop policy if exists "media admin" on public.media;  create policy "media admin" on public.media for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "subs insert" on public.subscribers;
create policy "subs insert" on public.subscribers for insert to anon, authenticated with check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email)<255);
drop policy if exists "subs admin" on public.subscribers;
create policy "subs admin" on public.subscribers for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "gb insert" on public.guestbook;
create policy "gb insert" on public.guestbook for insert to anon, authenticated with check (approved=false and length(name) between 1 and 60 and length(message) between 1 and 500);
drop policy if exists "gb read" on public.guestbook;
create policy "gb read" on public.guestbook for select using (approved or public.is_admin());
drop policy if exists "gb admin" on public.guestbook;
create policy "gb admin" on public.guestbook for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- storage (bucket publik "media", tulis hanya admin) ----------
insert into storage.buckets(id,name,public) values('media','media',true) on conflict(id) do update set public=true;
drop policy if exists "media admin write" on storage.objects;
create policy "media admin write" on storage.objects for all to authenticated
 using (bucket_id='media' and public.is_admin()) with check (bucket_id='media' and public.is_admin());

-- ---------- realtime ----------
do $$ begin
 begin alter publication supabase_realtime add table public.entries; exception when others then null; end;
 begin alter publication supabase_realtime add table public.settings; exception when others then null; end;
 begin alter publication supabase_realtime add table public.guestbook; exception when others then null; end;
 begin alter publication supabase_realtime add table public.media; exception when others then null; end;
end $$;

-- ---------- LANGKAH TERAKHIR ----------
-- 1) Buat user di Authentication → Users (email + password).
-- 2) Hilangkan tanda komentar & ganti email, lalu jalankan:
-- insert into public.admins(user_id) select id from auth.users where email='emailkamu@contoh.com';
-- 3) Authentication → Sign In / Providers → matikan "Allow new users to sign up".
