-- Entries may have a future date and time (PRD ENT-01, changed 2026-10-28 by the PM).
drop trigger if exists entries_reject_future on public.entries;
drop function if exists public.entries_reject_future();
