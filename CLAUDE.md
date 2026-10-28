# CLAUDE.md — Jar of Light

Guidance for Claude Code working in this repository.

## Read first

- [docs/PRD.md](docs/PRD.md) — what we build and why; requirement IDs (ACC-01, ENT-01, …); open questions in §11.
- [docs/TECH_SPEC.md](docs/TECH_SPEC.md) — stack, data model, privacy, routes, visual design.
- [docs/ROADMAP.md](docs/ROADMAP.md) — phases; **current work is P0 → P1a** (first build step).
- [docs/DECISIONS.md](docs/DECISIONS.md) — all architecture decisions (ADRs) in one append-only file: ADR-0001 (no own servers), ADR-0002 (free stack, keep-alive, backups). A new decision is a new record at the end; never rewrite an accepted one.

These documents are the source of truth. If a decision changes, update the document (or add a record to `docs/DECISIONS.md`) in the same pull request.

## Current state (2026-10-27)

- The repository exists **only locally**: its commits (docs, decisions, this file) have never been pushed. First task: check `gh auth status` shows `boris-belyavskiy` active, create the **public** repo `boris-belyavskiy/jar-of-light`, push `main`, and set its description and homepage `https://jaroflight.vercel.app`.
- Accounts are ready: Vercel, Supabase dev + prod, Google Cloud OAuth client. Not done yet: Vercel project import, `jar-of-light-backups` repo, Session pooler string for backups.

## People and language

- **Boris Belyavskiy** — product manager and owner. Chat with him in **Russian**; everything in the repository (code, comments, docs, commits, PRs) is in **English**.
- Setup and build steps are also **learning** for Boris: explain in plain words what each concept is, why we need it and where each value comes from — not only which button to press.

## First build step (P1a) in one paragraph

Google sign-in open to any Google account · profile (name, time zone, language RU/EN) · entries: text 1–4,000 chars, local date **and** time (now by default, no future), one or more categories · create, edit, delete · feed newest first with a category filter · six system categories (family, friends, work, study, health, chance encounter; hide-only) + own categories (create, rename, delete) · account deletion · `/privacy` note. Every entry is visible only to its author (RLS). Details: PRD §7, Tech Spec §4, §7.1a, §8; Definition of Done: Roadmap P1a.

## Stack and environments

| Piece | Value |
|---|---|
| App | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, `next-intl` (RU/EN) |
| Hosting | Vercel Hobby, team "Jar of Light"; production URL `https://jaroflight.vercel.app`; functions region `cle1` |
| Database + auth | Supabase Free, region US East (Ohio) |
| Supabase dev | ref `tudnruekssfzxhqkwgyd` → `https://tudnruekssfzxhqkwgyd.supabase.co` |
| Supabase prod | ref `ntnbpcmgyddklrbwfgqq` → `https://ntnbpcmgyddklrbwfgqq.supabase.co` |
| Google sign-in | Google Identity Services button → `supabase.auth.signInWithIdToken`; OAuth web client ID `30285081957-pejubc544ttl7h1jbj9007de2omp8vdu.apps.googleusercontent.com` (public); Google provider enabled in both Supabase projects; app is in "Testing" mode until `/privacy` exists |
| Supabase project security | Data API on · automatically expose new tables **off** · automatic RLS **on** → every migration grants table privileges to `authenticated` explicitly and adds RLS policies |
| Backups | Private repo `boris-belyavskiy/jar-of-light-backups` (not created yet) — keep-alive and nightly backup workflows go there (Tech Spec §3.1) |
| Node.js | v24 LTS |

## Rules

- **$0 and no payment card** in P0–P1. Never enable a paid plan, trial or add-on; ask Boris first if something seems to need one.
- **Secrets never enter the repository or the chat.** `.env.local` (git-ignored) holds **dev** keys only — the folder syncs to OneDrive. Production keys live only in Vercel environment variables. Boris fills secret values himself; give him a template with placeholders.
- **Privacy by design:** RLS on every user table with automated tests ("user A cannot read or change user B's rows"); no entry text in logs, analytics or error reports.
- **Flow:** `main` is always deployable; work on a branch, open a pull request, Vercel builds a preview. Google sign-in does not work on preview URLs (no wildcard origins) — test sign-in locally and on production.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:` …). Author is Boris's noreply address `340406159+boris-belyavskiy@users.noreply.github.com` (already in the repo's git config).
- **GitHub CLI:** the machine also has an edu account (`borisbelyavskiy-edu`). Before pushing or creating repos, check `gh auth status` shows `boris-belyavskiy` as active; switch with `gh auth switch`.
- **Line endings:** files use LF. Do not rewrite whole files with tools that convert to CRLF.
- **Outside the repository** (parent folder `Архив/`): early plans and notes from before 2026-10-19. Historical only, superseded by the PRD; never add them to the repository.
- **Definition of Done for any task:** merged via PR · migrations with grants and RLS policies · tests for new logic · RU and EN strings · docs updated if a decision changed.
