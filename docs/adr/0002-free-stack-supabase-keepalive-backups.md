# ADR-0002: Free stack for P0–P1 — Next.js on Vercel, Supabase Free with keep-alive and own backups

- **Status:** Accepted
- **Date:** 2026-10-27
- **Deciders:** Boris Belyavskiy (PM), Claude (tech review)

## Context

The first build step (P1a) is a private journal: Google sign-in, entries with date, time and categories, each entry visible only to its author. It should serve about 100 users.

PM constraints (PRD Q4):

- P0–P1 cost **$0** and need **no payment card** anywhere;
- the database must not "fall asleep" and must not lose user data;
- the promise "only you see your entries" must hold even if application code has a bug.

[ADR-0001](0001-no-self-hosted-servers.md) already rules out own servers.

## Decision

| Need | Choice |
|---|---|
| App hosting | **Vercel Hobby**, `jar-of-light.vercel.app` |
| Database and auth | **Supabase Free**, region EU (Frankfurt): two projects, **dev** and **prod** |
| Isolation between users | Postgres **Row Level Security** on every user table, covered by automated tests |
| Sign-in | **Google only**, through the Google Identity Services button and Supabase `signInWithIdToken`; Google Cloud project without a billing account |
| Not pausing | **Daily keep-alive** request to both projects from GitHub Actions |
| Backups | **Nightly encrypted `pg_dump`** of prod in a private repository `jar-of-light-backups`, 30-day retention, restore tests ([Tech Spec §3.1](../TECH_SPEC.md#31-keep-alive-and-backups)) |

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **1. Supabase Free + keep-alive + own backups** *(chosen)* | $0, no card; Postgres; RLS built in; auth for 50,000 monthly users; matches the data model and later phases (aggregates, public page) | 500 MB; pauses after 7 idle days (closed by keep-alive); no provider backups (closed by own backups) |
| 2. Supabase Pro ($25/month) | Daily backups, no pausing | Breaks the $0 goal; not needed at ~100 users |
| 3. Neon Free + Better Auth | 1 GB; 6-hour point-in-time restore; compute wakes automatically; Google dialog shows our domain | Isolation would live in application code instead of the database; more auth code to own |
| 4. Cloudflare Workers + D1 | 5 GB; 7-day automatic restore | SQLite, not Postgres; moving Next.js off Vercel; isolation in application code only |
| 5. Firebase Spark (Firestore + Auth) | Never pauses; Google sign-in built in; security rules isolate users | Not SQL: stats by category and people, K-threshold counters are harder; no backups on the free plan; strong lock-in |
| 6. A private Git repository or Google Drive as storage | Free, familiar | Not a database: no queries, write conflicts, API limits; all users' entries in one place guarded only by code; Git history keeps deleted entries forever, so account deletion cannot be honored |

Free-tier facts were checked on the providers' pricing pages on 2026-10-27; recheck before relying on them.

## Consequences

**Positive**

- The whole first step runs at $0 with no card on file.
- User isolation is enforced by the database, not only by our code.
- Postgres keeps later phases (stats, summaries, public page) straightforward and the data portable.

**Negative and how we handle it**

- *We own backups.* The workflow, the encryption key and restore tests are our job; a failed run emails the owner; the restore test is in the P1a Definition of Done.
- *Keep-alive is one more moving part.* If it fails, Supabase warns by email before pausing, and a paused project keeps its data and can be resumed.
- *Google's dialog shows `jar-of-light.vercel.app`, not the app name*, until we have an own domain.
- *Google sign-in does not work on preview deployments* (no wildcard origins); sign-in is tested locally and on production.
- *Deleted data stays in encrypted backups for up to 30 days*; the privacy note says so.

## Revisit when

1. The prod database passes **400 MB** (80% of the free limit);
2. We need point-in-time restore or provider-managed backups (e.g. before the public beta);
3. Keep-alive or backups fail more than once a month;
4. The project becomes commercial (Vercel Hobby is non-commercial).

First step at that point: Supabase Pro ($25/month).
