# Database migrations

Each file in `migrations/` is one change to the database schema, applied in name order. Files are never edited after they reach production; a fix is a new file.

## Applying a migration (until we add the Supabase CLI)

1. Open the Supabase dashboard → the **dev** project (`tudnruekssfzxhqkwgyd`) → **SQL Editor** → New query.
2. Paste the whole migration file and run it. It should finish with "Success. No rows returned".
3. Check the app locally.
4. After the pull request is merged, repeat for the **prod** project (`ntnbpcmgyddklrbwfgqq`).

## Rules for every migration

- Enable RLS on every new table and add policies; the projects run with "automatic RLS" on and "expose new tables" off.
- Grant table privileges to `authenticated` explicitly, and only what the policies need. Never grant anything to `anon` for user data.
- Add RLS tests to `tests/db/` (run with `npm test`; they use an in-memory Postgres, see [ADR-0003](../docs/DECISIONS.md#adr-0003)).
