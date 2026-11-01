-- Each user's own order of categories in the feed filter and the entry form
-- (PRD CAT-02, "order" moved from P1b by the PM on 2026-10-31). An array of
-- category ids on the profile: system categories are shared rows, so their
-- position cannot live on the category itself. Ids missing from the array
-- (a new category, or an empty array) fall back to the default order.
alter table public.profiles
  add column category_order uuid[] not null default '{}'
    check (cardinality(category_order) <= 200);

grant update (category_order) on public.profiles to authenticated;
