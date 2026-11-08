-- Encryption, step 2c (ADR-0011, Tech Spec 5.6): the device chooses the id of a
-- new entry or own category, because the ciphertext is bound to its row id and
-- must be made before the row exists. Until now `id` had no insert grant, so
-- the database always chose it.
--
-- Additive: the running app keeps working, and an id still has to be unique, so
-- nobody can overwrite another user's row with it.

grant insert (id) on public.entries to authenticated;
grant insert (id) on public.categories to authenticated;
