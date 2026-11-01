-- Category names in Russian and English, and renaming built-in categories
-- (PRD CAT-01, CAT-02; PM decision 2026-11-01).
--
-- 1. A custom category has a Russian name, an English name, or both. The app
--    shows the name in the interface language and falls back to the other one.
-- 2. A user may rename a built-in (system) category for themselves. System
--    categories are shared rows, so the user's names live in their own table,
--    `category_names`; without a row the app shows the built-in translation.
--
-- The old `name` column stays for now so the app version still running while
-- this migration is applied keeps working; a later migration drops it.

-- ---------------------------------------------------------------------------
-- Custom categories: name_ru / name_en
-- ---------------------------------------------------------------------------

alter table public.categories
  add column name_ru text check (name_ru is null or char_length(btrim(name_ru)) between 1 and 40),
  add column name_en text check (name_en is null or char_length(btrim(name_en)) between 1 and 40);

-- Existing names go to the language their letters are written in.
update public.categories
set name_ru = case when name ~ '[А-Яа-яЁё]' then btrim(name) end,
    name_en = case when name !~ '[А-Яа-яЁё]' then btrim(name) end
where user_id is not null;

alter table public.categories drop constraint categories_system_or_custom;
alter table public.categories add constraint categories_system_or_custom check (
  (user_id is null and slug is not null and name is null and name_ru is null and name_en is null)
  or (user_id is not null and slug is null and coalesce(name_ru, name_en, name) is not null)
);

-- No two of a user's categories share a name in the same language.
create unique index categories_user_name_ru_key
  on public.categories (user_id, lower(btrim(name_ru)))
  where user_id is not null and name_ru is not null;
create unique index categories_user_name_en_key
  on public.categories (user_id, lower(btrim(name_en)))
  where user_id is not null and name_en is not null;

grant insert (name_ru, name_en), update (name_ru, name_en) on public.categories to authenticated;

-- ---------------------------------------------------------------------------
-- A user's own names for built-in categories
-- ---------------------------------------------------------------------------

create table public.category_names (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  name_ru text check (name_ru is null or char_length(btrim(name_ru)) between 1 and 40),
  name_en text check (name_en is null or char_length(btrim(name_en)) between 1 and 40),
  primary key (user_id, category_id),
  constraint category_names_not_empty check (name_ru is not null or name_en is not null)
);

alter table public.category_names enable row level security;

-- Only your own rows, and only for system categories (custom ones carry their own names).
create policy "category_names: read own" on public.category_names
  for select to authenticated using (user_id = (select auth.uid()));
create policy "category_names: name system" on public.category_names
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.categories c where c.id = category_id and c.user_id is null)
  );
create policy "category_names: rename own" on public.category_names
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "category_names: reset own" on public.category_names
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.category_names from anon, authenticated;
grant select, insert, delete on public.category_names to authenticated;
grant update (name_ru, name_en) on public.category_names to authenticated;
