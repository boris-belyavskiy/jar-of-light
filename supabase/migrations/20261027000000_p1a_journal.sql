-- P1a: minimal private journal (Tech Spec §4, PRD ACC-04, ENT-01, CAT-01, CAT-02, DATA-02).
--
-- Every user table has RLS and explicit grants: the Supabase projects run with
-- "automatically expose new tables" off, so nothing is reachable through the
-- Data API unless this file grants it. The `anon` role gets nothing.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_valid_timezone(tz text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = tz);
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles: one row per auth user, created by a trigger on sign-up.
-- locale and timezone stay NULL until the browser sends them on first sign-in.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default ''
    check (char_length(display_name) <= 80),
  locale text check (locale in ('ru', 'en')),
  timezone text check (timezone is null or public.is_valid_timezone(timezone)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 80)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Categories: system ones have user_id NULL and a slug (names come from the UI
-- translations); custom ones belong to a user and store a name.
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  slug text unique,
  name text,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  constraint categories_system_or_custom check (
    (user_id is null and slug is not null and name is null)
    or (user_id is not null and slug is null and char_length(btrim(name)) between 1 and 40)
  )
);

create unique index categories_user_name_key
  on public.categories (user_id, lower(btrim(name)))
  where user_id is not null;

insert into public.categories (slug, sort) values
  ('family', 1),
  ('friends', 2),
  ('work', 3),
  ('study', 4),
  ('health', 5),
  ('chance_encounter', 6);

-- Hiding a system category is stored per user (CAT-01: hide only).
create table public.hidden_categories (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (user_id, category_id)
);

-- ---------------------------------------------------------------------------
-- Entries: local date and time as entered (no time zone shift when travelling).
-- ---------------------------------------------------------------------------

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (char_length(body) <= 4000 and char_length(btrim(body)) >= 1),
  occurred_on date not null,
  occurred_time time(0) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index entries_user_occurred_idx
  on public.entries (user_id, occurred_on desc, occurred_time desc, created_at desc);

create trigger entries_set_updated_at
  before update on public.entries
  for each row execute function public.set_updated_at();

-- "Not in the future" is checked against the author's time zone, with one
-- minute of slack for clocks that run slightly ahead.
create or replace function public.entries_reject_future()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  tz text;
begin
  select coalesce(p.timezone, 'UTC') into tz from public.profiles p where p.id = new.user_id;
  if (new.occurred_on + new.occurred_time)
     > (now() at time zone coalesce(tz, 'UTC')) + interval '1 minute' then
    raise exception 'entry date and time cannot be in the future'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger entries_reject_future
  before insert or update of occurred_on, occurred_time on public.entries
  for each row execute function public.entries_reject_future();

create table public.entry_categories (
  entry_id uuid not null references public.entries (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (entry_id, category_id)
);

create index entry_categories_category_idx on public.entry_categories (category_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.hidden_categories enable row level security;
alter table public.entries enable row level security;
alter table public.entry_categories enable row level security;

-- Profiles: read and update your own row. Rows are created by the trigger and
-- removed by deleting the auth user.
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Categories: everyone signed in sees system categories; custom ones only
-- their owner. Only custom categories can be created, renamed or deleted.
create policy "categories: read system and own" on public.categories
  for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));
create policy "categories: create own" on public.categories
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "categories: update own" on public.categories
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "categories: delete own" on public.categories
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "hidden_categories: read own" on public.hidden_categories
  for select to authenticated using (user_id = (select auth.uid()));
create policy "hidden_categories: hide system" on public.hidden_categories
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.categories c where c.id = category_id and c.user_id is null)
  );
create policy "hidden_categories: unhide own" on public.hidden_categories
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "entries: read own" on public.entries
  for select to authenticated using (user_id = (select auth.uid()));
create policy "entries: create own" on public.entries
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "entries: update own" on public.entries
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "entries: delete own" on public.entries
  for delete to authenticated using (user_id = (select auth.uid()));

-- Links: the entry must be yours; the category must be a system one or yours.
create policy "entry_categories: read own" on public.entry_categories
  for select to authenticated using (
    exists (select 1 from public.entries e where e.id = entry_id and e.user_id = (select auth.uid()))
  );
create policy "entry_categories: link own" on public.entry_categories
  for insert to authenticated with check (
    exists (select 1 from public.entries e where e.id = entry_id and e.user_id = (select auth.uid()))
    and exists (
      select 1 from public.categories c
      where c.id = category_id and (c.user_id is null or c.user_id = (select auth.uid()))
    )
  );
create policy "entry_categories: unlink own" on public.entry_categories
  for delete to authenticated using (
    exists (select 1 from public.entries e where e.id = entry_id and e.user_id = (select auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- Grants (only what the policies above allow; nothing for anon)
-- ---------------------------------------------------------------------------

revoke all on public.profiles, public.categories, public.hidden_categories,
  public.entries, public.entry_categories from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (display_name, locale, timezone) on public.profiles to authenticated;
grant select, delete on public.categories to authenticated;
grant insert (user_id, name, sort), update (name, sort) on public.categories to authenticated;
grant select, insert, delete on public.hidden_categories to authenticated;
grant select, delete on public.entries to authenticated;
grant insert (user_id, body, occurred_on, occurred_time),
  update (body, occurred_on, occurred_time) on public.entries to authenticated;
grant select, insert, delete on public.entry_categories to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
