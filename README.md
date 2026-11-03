# Jar of Light

**A gratitude journal that helps you notice the good, see who makes it possible, and give thanks back: first to the people close to you, then to the world.**

*RU: «Банка света»* · **Live app: [jaroflight.vercel.app](https://jaroflight.vercel.app)**

---

## What it is

Jar of Light is a private journal for gratitude and bright moments. Each entry is a small light you put into the jar. Sign in with Google, write down a bright moment in under 30 seconds, and look back at what your life already holds. Every entry is visible only to its author, and the database itself enforces that.

This is the first step of a longer product (see the [Roadmap](docs/ROADMAP.md)): later come AI help, private thank-you cards and a public page that shows who people are grateful to and why.

## Features

**Core**

- **Sign up and login** with any Google account, no passwords; each user sees only their own data
- **Entries:** add, read in a window with its own link, edit, delete after an "are you sure?" dialog
- **Validation:** friendly messages for a blank or too-long entry, in Russian and English
- **Favorites:** star an entry beside its "⋯" menu; a "Favorites" row in the filter shows the starred ones
- **Find things:** filter by categories (tick boxes, one "Clear" button) and dates, search by text, sort newest or oldest first
- **Statistics:** for the entries the filter selects, the number of entries, days with an entry, the best month, a chart by date and a chart by category

**My own features**

- **Several categories on one entry**
- **Date and time of an entry:** now by default, past or future allowed
- **Editing the built-in categories:** rename or hide them, for yourself only

**Also working**

- **Language switch:** the whole interface in Russian or English, always in the header
- **Dragging categories** into your own order, with the left mouse button or by touch
- **Your own categories:** create, rename, delete, with a name in one language or both
- **Time zones:** "now" follows your time zone, and the list shows UTC offsets
- **Account deletion** in Settings, which removes all your data
- **Light and dark themes**, following your system setting
- **One layout on every page and device:** the header, footer and "+" for a new entry never move

## Tools

| Piece | Choice |
|---|---|
| Coding agent | Claude Code |
| App | Next.js, TypeScript, Tailwind CSS, shadcn/ui, `next-intl` (RU / EN), Zod |
| Database and sign-in | Supabase (Postgres with Row Level Security), Google Identity Services |
| Hosting | Vercel, deploying from `main` |
| Tests and CI | Vitest, PGlite (real Postgres in memory), GitHub Actions |

The stack runs on free tiers at $0 ([ADR-0002](docs/DECISIONS.md#adr-0002)).

## How to run it

**The tests need no accounts.** You need [Node.js 24](https://nodejs.org):

```bash
git clone https://github.com/boris-belyavskiy/jar-of-light.git
```

```bash
cd jar-of-light
```

```bash
npm ci
```

```bash
npm test
```

**The app needs your own free Supabase project and Google OAuth client:**

1. In [Supabase](https://supabase.com), create a project. In the SQL Editor, run every file in `supabase/migrations/` in name order ([details](supabase/README.md)).
2. In [Google Cloud](https://console.cloud.google.com), create an OAuth client for a web application and add `http://localhost:3000` to its authorized JavaScript origins.
3. In Supabase, under Authentication → Providers, enable Google and paste that client ID.
4. Copy `.env.example` to `.env.local` and fill in the values; the file says where each one comes from.
5. Start it, then open [http://localhost:3000](http://localhost:3000):

```bash
npm run dev
```

Other checks: `npm run lint`, `npm run typecheck`, `npm run build`.

## Documents

| Document | What's inside |
|---|---|
| [PLAN](PLAN.md) | The blueprint in one document, and Plan vs. Reality |
| [schema](schema.md) | Every table, its columns and how they relate |
| [prompts/](prompts/) | The key prompts behind each change |
| [PRD](docs/PRD.md) | Problem, audience, jobs to be done, requirements, metrics, open questions |
| [Tech Spec](docs/TECH_SPEC.md) | Architecture, data model, privacy levels, AI design, visual design |
| [Roadmap](docs/ROADMAP.md) | Phases from a private journal to the public page, research plan, decision gates |
| [Decisions](docs/DECISIONS.md) | Architecture decisions (ADRs) and why we made them |

## About

A portfolio product by [Boris Belyavskiy](https://github.com/boris-belyavskiy), product manager, built with Claude Code as the engineering partner, and also the solo app for MBA 296 Intro to Coding at UC Berkeley Haas. Repository documents are in English.
