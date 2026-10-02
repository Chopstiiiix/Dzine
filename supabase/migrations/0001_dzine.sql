-- Dzine schema.
-- Every object is prefixed with dzine_ so it can share a Supabase project with other apps.

-- ---------------------------------------------------------------- tables

create table if not exists public.dzine_profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  credits    integer not null default 2 check (credits >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.dzine_projects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text not null default 'Untitled design',
  ratio      text not null default 'ig-portrait',
  design     jsonb,
  history    jsonb not null default '[]'::jsonb,
  pending    jsonb,
  thumb      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists dzine_projects_user_idx on public.dzine_projects (user_id, updated_at desc);

create table if not exists public.dzine_messages (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.dzine_projects (id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists dzine_messages_project_idx on public.dzine_messages (project_id, created_at);
create index if not exists dzine_messages_user_idx on public.dzine_messages (user_id);

create table if not exists public.dzine_assets (
  id         text primary key,
  project_id uuid not null references public.dzine_projects (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('upload', 'generated', 'cutout')),
  label      text not null default 'photo',
  name       text not null default '',
  mime       text not null,
  width      integer,
  height     integer,
  path       text not null,
  url        text not null,
  created_at timestamptz not null default now()
);
create index if not exists dzine_assets_project_idx on public.dzine_assets (project_id, created_at);
create index if not exists dzine_assets_user_idx on public.dzine_assets (user_id);

create table if not exists public.dzine_credit_ledger (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  delta      integer not null,
  reason     text not null,
  ref        text unique,
  created_at timestamptz not null default now()
);
create index if not exists dzine_credit_ledger_user_idx on public.dzine_credit_ledger (user_id, created_at desc);

-- ---------------------------------------------------------------- updated_at

create or replace function public.dzine_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists dzine_projects_touch on public.dzine_projects;
create trigger dzine_projects_touch
  before update on public.dzine_projects
  for each row execute function public.dzine_touch_updated_at();

-- ---------------------------------------------------------------- row level security

alter table public.dzine_profiles      enable row level security;
alter table public.dzine_projects      enable row level security;
alter table public.dzine_messages      enable row level security;
alter table public.dzine_assets        enable row level security;
alter table public.dzine_credit_ledger enable row level security;

-- Profiles and the ledger are read-only for users. Credits only change through the functions below.
drop policy if exists "dzine profiles: read own" on public.dzine_profiles;
create policy "dzine profiles: read own" on public.dzine_profiles
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "dzine ledger: read own" on public.dzine_credit_ledger;
create policy "dzine ledger: read own" on public.dzine_credit_ledger
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "dzine projects: own" on public.dzine_projects;
create policy "dzine projects: own" on public.dzine_projects
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "dzine messages: own" on public.dzine_messages;
create policy "dzine messages: own" on public.dzine_messages
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "dzine assets: own" on public.dzine_assets;
create policy "dzine assets: own" on public.dzine_assets
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------- credits

-- Creates the caller's profile on first use (2 free credits) and returns the balance.
create or replace function public.dzine_ensure_profile()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_credits integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.dzine_profiles (user_id) values (v_uid) on conflict do nothing;
  if found then
    insert into public.dzine_credit_ledger (user_id, delta, reason) values (v_uid, 2, 'signup');
  end if;

  select credits into v_credits from public.dzine_profiles where user_id = v_uid;
  return v_credits;
end
$$;

-- Atomically spends one credit for the caller. Raises insufficient_credits when the balance is 0.
create or replace function public.dzine_spend_credit(p_project uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_credits integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  perform public.dzine_ensure_profile();

  update public.dzine_profiles
     set credits = credits - 1
   where user_id = v_uid and credits > 0
  returning credits into v_credits;

  if not found then
    raise exception 'insufficient_credits';
  end if;

  insert into public.dzine_credit_ledger (user_id, delta, reason)
  values (v_uid, -1, 'turn:' || coalesce(p_project::text, ''));

  return v_credits;
end
$$;

-- Adds credits (purchases, refunds). Server only: callable with the service role key.
-- p_ref makes it idempotent, so a webhook and the return-page check can both call it safely.
create or replace function public.dzine_grant_credits(p_user uuid, p_credits integer, p_reason text, p_ref text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_credits integer;
begin
  if p_credits is null or p_credits <= 0 then
    raise exception 'invalid_credits';
  end if;

  begin
    insert into public.dzine_credit_ledger (user_id, delta, reason, ref)
    values (p_user, p_credits, p_reason, p_ref);
  exception when unique_violation then
    select credits into v_credits from public.dzine_profiles where user_id = p_user;
    return coalesce(v_credits, 0);
  end;

  insert into public.dzine_profiles (user_id, credits)
  values (p_user, 2 + p_credits)
  on conflict (user_id) do update set credits = public.dzine_profiles.credits + p_credits
  returning credits into v_credits;

  return v_credits;
end
$$;

revoke execute on function public.dzine_ensure_profile() from public, anon;
revoke execute on function public.dzine_spend_credit(uuid) from public, anon;
revoke execute on function public.dzine_grant_credits(uuid, integer, text, text) from public, anon, authenticated;
revoke execute on function public.dzine_touch_updated_at() from public, anon, authenticated;

grant execute on function public.dzine_ensure_profile() to authenticated;
grant execute on function public.dzine_spend_credit(uuid) to authenticated;
grant execute on function public.dzine_grant_credits(uuid, integer, text, text) to service_role;

-- ---------------------------------------------------------------- storage

-- Public bucket: files are served by URL so the AI models can read them.
-- Paths are <user id>/<project id>/<random id>.<ext>, and only the owner can write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dzine-assets', 'dzine-assets', true, 20971520,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

drop policy if exists "dzine assets: upload own" on storage.objects;
create policy "dzine assets: upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dzine-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "dzine assets: read own" on storage.objects;
create policy "dzine assets: read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'dzine-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "dzine assets: delete own" on storage.objects;
create policy "dzine assets: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'dzine-assets' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Signed-out visitors have no business with these tables.
revoke all on public.dzine_profiles, public.dzine_projects, public.dzine_messages,
  public.dzine_assets, public.dzine_credit_ledger from anon;

-- Signed-in users may create projects and edit what they see on screen, but the agent's
-- conversation state (history, pending) is written by the server only. Otherwise a user could
-- forge a paused turn and resume it without paying.
revoke insert, update on public.dzine_projects from authenticated;
grant insert (title, ratio) on public.dzine_projects to authenticated;
grant update (title, ratio, design, thumb) on public.dzine_projects to authenticated;
