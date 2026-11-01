-- Drop the old single-language category name, replaced by name_ru / name_en in
-- 20261101000000_bilingual_category_names.sql. It was kept only so the app
-- version live during that migration kept working; no code reads it now.

alter table public.categories drop constraint categories_system_or_custom;
alter table public.categories add constraint categories_system_or_custom check (
  (user_id is null and slug is not null and name_ru is null and name_en is null)
  or (user_id is not null and slug is null and (name_ru is not null or name_en is not null))
);

-- Dropping the column also drops its unique index (categories_user_name_key)
-- and the column-level grants on it.
alter table public.categories drop column name;
