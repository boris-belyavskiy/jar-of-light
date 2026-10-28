# Jar of Light

**A gratitude journal that helps you notice the good, see who makes it possible, and give thanks back: first to the people close to you, then to the world.**

*RU: «Банка света»*

---

## What it is

Jar of Light is a private journal for gratitude and bright moments. Each entry is a small light you put into the jar; on a dark day you open the jar and get one back.

Gratitude journals usually stay private. Jar of Light goes further, one step at a time:

1. **Notice.** Write down a bright moment in under 30 seconds, as free text or with a simple template.
2. **Own.** See what your life already holds: summaries by period, place, topic and people.
3. **Connect.** See the people, professions and organizations who made the good things possible.
4. **Give back.** Turn gratitude into action with a private thank-you card, or share it on a public page that shows who people are grateful to and why.

AI helps along the way, but it only suggests: nothing is published or sent without your confirmation, and entries are private by default.

## Status

**First build step (P1a) in progress.** The app skeleton and the minimal private journal are in code: Google sign-in, entries with date, time and categories (visible only to their author, enforced by the database and covered by tests), own categories, profile settings, account deletion and a privacy note. Next: deploy to `jaroflight.vercel.app`, backups, then the rest of the journal in parallel with customer research.

## Documents

| Document | What's inside |
|---|---|
| [PRD](docs/PRD.md) | Problem, audience, jobs to be done, requirements, metrics, open questions |
| [Tech Spec](docs/TECH_SPEC.md) | Architecture, data model, privacy levels, AI design, visual design |
| [Roadmap](docs/ROADMAP.md) | Phases from a private journal to the public page, research plan, decision gates |
| [Decisions](docs/DECISIONS.md) | Architecture decisions (ADRs) and why we made them |

## Planned stack

Next.js on Vercel · Supabase Postgres (US East) with Row Level Security · Google sign-in · Anthropic API behind a provider abstraction (from P2) · PostHog · Sentry. The first phases run on free tiers at $0 ([ADR-0002](docs/DECISIONS.md#adr-0002)). Product languages: Russian and English.

## About

A portfolio product by [Boris Belyavskiy](https://github.com/boris-belyavskiy), product manager, built with Claude Code as the engineering partner. Repository documents are in English.
