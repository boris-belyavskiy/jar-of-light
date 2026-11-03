-- Stars ("favorites"): one table for everyone, where each row says "this user
-- starred this entry" (PM decision 2026-11-02). A row disappears with its entry
-- or its user. Only the entry's author can star it, and stars are never visible
-- to anyone else.

create table public.stars (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_id uuid not null references public.entries (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, entry_id)
);

create index stars_entry_idx on public.stars (entry_id);

alter table public.stars enable row level security;

create policy "stars: read own" on public.stars
  for select to authenticated using (user_id = (select auth.uid()));
create policy "stars: star own entries" on public.stars
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.entries e where e.id = entry_id and e.user_id = (select auth.uid()))
  );
create policy "stars: unstar own" on public.stars
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.stars from anon, authenticated;
grant select, delete on public.stars to authenticated;
grant insert (entry_id) on public.stars to authenticated;
