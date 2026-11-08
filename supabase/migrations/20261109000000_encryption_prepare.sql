-- Encryption, step 1: prepare the database (ADR-0011, Tech Spec §5.6, PRD DATA-05..07).
--
-- Additive only: nothing is encrypted yet and the app version running while this
-- is applied keeps working. Every existing row stays as it is. What changes:
--
-- 1. `user_keys`: one row per user with the data key wrapped by the diary
--    password and by the recovery code. The server stores wrapped keys only; it
--    never sees a password, a code or the data key.
-- 2. Ciphertext columns next to the plaintext ones on `entries`, `categories`
--    and `category_names`. A row holds plaintext, ciphertext or (while an
--    account is being moved, step 3) both. Plaintext columns become optional.
-- 3. `profiles.encrypted_at`: the mark that an account is fully encrypted. No
--    grant covers it, so a user cannot set it with a direct update; step 4 adds
--    the function that does.
--
-- Not here: refusing plaintext for marked accounts and erasing plaintext (step 4).

-- ---------------------------------------------------------------------------
-- user_keys
-- ---------------------------------------------------------------------------

create table public.user_keys (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  key_version smallint not null default 1 check (key_version >= 1),
  -- Base64 text: PostgREST returns text as it is, bytea as hex.
  kdf_salt text not null check (char_length(kdf_salt) between 16 and 128),
  -- Argon2id memory, iterations and parallelism chosen on the device, kept so a
  -- later device derives the same key.
  kdf_params jsonb not null check (jsonb_typeof(kdf_params) = 'object' and char_length(kdf_params::text) <= 512),
  wrapped_key_password text not null check (char_length(wrapped_key_password) between 16 and 512),
  wrapped_key_recovery text not null check (char_length(wrapped_key_recovery) between 16 and 512),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_keys_set_updated_at
  before update on public.user_keys
  for each row execute function public.set_updated_at();

alter table public.user_keys enable row level security;

create policy "user_keys: read own" on public.user_keys
  for select to authenticated using (user_id = (select auth.uid()));
create policy "user_keys: create own" on public.user_keys
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "user_keys: update own" on public.user_keys
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- No delete policy and no delete grant: dropping the wrapped keys would make
-- the entries unreadable. The row goes away with the account (cascade).

revoke all on public.user_keys from anon, authenticated;
grant select on public.user_keys to authenticated;
grant insert (user_id, key_version, kdf_salt, kdf_params, wrapped_key_password, wrapped_key_recovery)
  on public.user_keys to authenticated;
grant update (key_version, kdf_salt, kdf_params, wrapped_key_password, wrapped_key_recovery)
  on public.user_keys to authenticated;

-- ---------------------------------------------------------------------------
-- The mark that an account is encrypted
-- ---------------------------------------------------------------------------

alter table public.profiles add column encrypted_at timestamptz;
-- Readable through the table-level select grant; deliberately no `update` grant.

-- ---------------------------------------------------------------------------
-- Entries
-- ---------------------------------------------------------------------------

-- The longest valid text is 4,000 characters of up to 4 bytes each; with the
-- nonce, the tag and base64 that stays well below 24,000 characters.
alter table public.entries
  add column body_enc text check (char_length(body_enc) between 1 and 24000),
  alter column body drop not null,
  add constraint entries_has_body check (num_nonnulls(body, body_enc) >= 1);
-- The existing check on `body` (1–4,000 characters) stays and ignores NULL.

grant insert (body_enc), update (body_enc) on public.entries to authenticated;

-- ---------------------------------------------------------------------------
-- Own categories
-- ---------------------------------------------------------------------------

-- A name is at most 40 characters, so a few hundred characters hold the ciphertext.
alter table public.categories
  add column name_ru_enc text check (char_length(name_ru_enc) between 1 and 512),
  add column name_en_enc text check (char_length(name_en_enc) between 1 and 512);

alter table public.categories drop constraint categories_system_or_custom;
alter table public.categories add constraint categories_system_or_custom check (
  (user_id is null and slug is not null
    and name_ru is null and name_en is null and name_ru_enc is null and name_en_enc is null)
  or (user_id is not null and slug is null
    and num_nonnulls(name_ru, name_en, name_ru_enc, name_en_enc) >= 1)
);
-- The unique indexes on the plaintext names stay. Ciphertext carries a random
-- nonce, so uniqueness of encrypted names is checked on the device.

grant insert (name_ru_enc, name_en_enc), update (name_ru_enc, name_en_enc) on public.categories to authenticated;

-- ---------------------------------------------------------------------------
-- A user's own names for built-in categories
-- ---------------------------------------------------------------------------

alter table public.category_names
  add column name_ru_enc text check (char_length(name_ru_enc) between 1 and 512),
  add column name_en_enc text check (char_length(name_en_enc) between 1 and 512);

alter table public.category_names drop constraint category_names_not_empty;
alter table public.category_names add constraint category_names_not_empty check (
  num_nonnulls(name_ru, name_en, name_ru_enc, name_en_enc) >= 1
);

-- `insert` on this table is granted for every column already.
grant update (name_ru_enc, name_en_enc) on public.category_names to authenticated;
