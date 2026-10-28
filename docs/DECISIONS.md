# Decisions — Jar of Light

Architecture Decision Records (ADRs) in one file. Each record captures one significant decision: the context, what we decided, what else we considered, and the consequences.

**Rules**

- Records are **append-only**: an accepted record is never rewritten. A changed decision gets a new record that says which one it supersedes, and the old record's status becomes "Superseded by ADR-XXXX".
- New records go at the end, numbered in order, with an anchor `<a id="adr-NNNN"></a>` so documents can link to `DECISIONS.md#adr-NNNN`.
- **Statuses:** Proposed · Accepted · Superseded by ADR-XXXX · Deprecated.

> **Related:** [PRD](PRD.md) · [Tech Spec](TECH_SPEC.md) · [Roadmap](ROADMAP.md)

## Log

| ADR | Decision | Status | Date |
|---|---|---|---|
| [0001](#adr-0001) | No self-hosted servers for now: managed hosting and LLM via API | Accepted | 2026-10-19 |
| [0002](#adr-0002) | Free stack for P0–P1: Next.js on Vercel, Supabase Free with keep-alive and own backups | Accepted | 2026-10-27 |

## Candidates

Proposed in the [Tech Spec](TECH_SPEC.md) and the [PRD](PRD.md), not yet decided. Each becomes an ADR once accepted.

- Private individuals are never published by full name; personal thanks go through private-link cards
- 100% manual pre-moderation of public posts in beta
- Entry parsing is asynchronous; AI suggests and never changes data on its own
- Model mix per task vs. one model for everything (Q7, decided on evals)

---

<a id="adr-0001"></a>

## ADR-0001: No self-hosted servers for now — managed hosting and LLM via API

- **Status:** Accepted
- **Date:** 2026-10-19
- **Deciders:** Boris Belyavskiy (PM), Claude (tech review)

### Context

The original brief proposed running our own server with an open-weight LLM to avoid paying for tokens.

At the same time:

- the product is built by one person, part-time, with no DevOps capacity;
- the next six months are about learning (customer research, closed beta), with tens to hundreds of users, not thousands;
- the product handles private, emotional texts, so security patching, backups and access control must be reliable from day one;
- the first phase (P1) has no AI at all.

### Decision

In the current horizon we **do not run our own servers**: no VMs, GPU machines or Kubernetes.

| Need | Choice |
|---|---|
| App hosting | Managed platform: **Vercel** |
| Database, auth, storage | Managed Postgres: **Supabase**, EU region |
| LLM | Commercial API: **Anthropic**, behind a provider abstraction (`lib/ai/provider.ts`) |

### Options considered

| Option | Pros | Cons |
|---|---|---|
| **1. Managed platforms + LLM API** *(chosen)* | Zero ops; free start; preview deploy per PR; cost grows with usage; strong models on RU and EN | Vendor dependence; free-tier limits; user data processed by third parties |
| 2. Own VPS for app and database | Cheaper at scale; full control | Patching, backups, monitoring and security fall on one part-time person |
| 3. Own GPU server with an open-weight LLM | No per-token cost; data stays in our perimeter | Fixed ~$500–1,500/month + DevOps from day one; small open models are noticeably weaker in Russian and on safety tasks (crisis detection, anonymization) |
| 4. Open-weight models via hosted inference (pay per token) | No servers; cheaper models available | Quality to be proven on our evals; kept as an option behind the abstraction |

**Cost comparison** (details in [Tech Spec §6.6](TECH_SPEC.md#66-cost-estimate)):

| Monthly active users | 100 | 1,000 | 10,000 |
|---|---|---|---|
| LLM API, model mix (≈ $0.10–0.15 per user) | ~$15 | ~$150 | ~$1,500 |
| Own GPU server 24/7 | $500–1,500 + DevOps | $500–1,500 + DevOps | from $1,500 + scaling |

The API is cheaper until roughly 3,000–10,000 monthly active users.

### Consequences

**Positive**

- P0 and most of P1 cost $0; time goes into the product, not infrastructure.
- Every pull request gets a preview link, which speeds up review with users.
- AI cost is visible per user and per task (`ai_runs`) and scales with usage.

**Negative and how we handle it**

- *Vendor dependence* → standard Postgres (portable), the provider abstraction for LLMs, open export formats, no core logic tied to proprietary features.
- *Free-tier limits* (Vercel Hobby is non-commercial and runs cron at most daily; Supabase Free pauses after 7 days without activity) → frequent jobs in `pg_cron`; Supabase Pro before beta users store real entries; Vercel Pro once the project is commercial.
- *Third parties process user data* → EU region, data processing terms with providers, entry text sent to the LLM only when AI is on and only from the server, all disclosed in the privacy policy.

### Revisit when

Any of these becomes true:

1. More than **5,000 monthly active users**;
2. AI cost above **$0.30 per active user per month**;
3. A requirement that **data must not leave our perimeter** (B2B customers, data localization);
4. Managed-platform bills above **~$300/month** with a clearly cheaper equivalent.

First step at that point: run open-weight models through hosted inference (option 4) on our evals. The provider abstraction makes the switch per task.

---

<a id="adr-0002"></a>

## ADR-0002: Free stack for P0–P1 — Next.js on Vercel, Supabase Free with keep-alive and own backups

- **Status:** Accepted
- **Date:** 2026-10-27
- **Deciders:** Boris Belyavskiy (PM), Claude (tech review)

### Context

The first build step (P1a) is a private journal: Google sign-in, entries with date, time and categories, each entry visible only to its author. It should serve about 100 users.

PM constraints (PRD Q4):

- P0–P1 cost **$0** and need **no payment card** anywhere;
- the database must not "fall asleep" and must not lose user data;
- the promise "only you see your entries" must hold even if application code has a bug.

[ADR-0001](#adr-0001) already rules out own servers.

### Decision

| Need | Choice |
|---|---|
| App hosting | **Vercel Hobby**, `jaroflight.vercel.app` |
| Database and auth | **Supabase Free**, region **US East (Ohio)**: two projects, **dev** and **prod**. Vercel functions run in Cleveland (`cle1`) next to the database |
| Isolation between users | Postgres **Row Level Security** on every user table, covered by automated tests |
| Sign-in | **Google only**, through the Google Identity Services button and Supabase `signInWithIdToken`; Google Cloud project without a billing account |
| Not pausing | **Daily keep-alive** request to both projects from GitHub Actions |
| Backups | **Nightly encrypted `pg_dump`** of prod in a private repository `jar-of-light-backups`, 30-day retention, restore tests ([Tech Spec §3.1](TECH_SPEC.md#31-keep-alive-and-backups)) |

### Options considered

| Option | Pros | Cons |
|---|---|---|
| **1. Supabase Free + keep-alive + own backups** *(chosen)* | $0, no card; Postgres; RLS built in; auth for 50,000 monthly users; matches the data model and later phases (aggregates, public page) | 500 MB; pauses after 7 idle days (closed by keep-alive); no provider backups (closed by own backups) |
| 2. Supabase Pro ($25/month) | Daily backups, no pausing | Breaks the $0 goal; not needed at ~100 users |
| 3. Neon Free + Better Auth | 1 GB; 6-hour point-in-time restore; compute wakes automatically; Google dialog shows our domain | Isolation would live in application code instead of the database; more auth code to own |
| 4. Cloudflare Workers + D1 | 5 GB; 7-day automatic restore | SQLite, not Postgres; moving Next.js off Vercel; isolation in application code only |
| 5. Firebase Spark (Firestore + Auth) | Never pauses; Google sign-in built in; security rules isolate users | Not SQL: stats by category and people, K-threshold counters are harder; no backups on the free plan; strong lock-in |
| 6. A private Git repository or Google Drive as storage | Free, familiar | Not a database: no queries, write conflicts, API limits; all users' entries in one place guarded only by code; Git history keeps deleted entries forever, so account deletion cannot be honored |

Free-tier facts were checked on the providers' pricing pages on 2026-10-27; recheck before relying on them.

### Consequences

**Positive**

- The whole first step runs at $0 with no card on file.
- User isolation is enforced by the database, not only by our code.
- Postgres keeps later phases (stats, summaries, public page) straightforward and the data portable.

**Negative and how we handle it**

- *We own backups.* The workflow, the encryption key and restore tests are our job; a failed run emails the owner; the restore test is in the P1a Definition of Done.
- *Keep-alive is one more moving part.* If it fails, Supabase warns by email before pausing, and a paused project keeps its data and can be resumed.
- *Google's dialog shows `jaroflight.vercel.app`, not the app name*, until we have an own domain.
- *Google sign-in does not work on preview deployments* (no wildcard origins); sign-in is tested locally and on production.
- *Deleted data stays in encrypted backups for up to 30 days*; the privacy note says so.
- *Data is hosted in the US, not in the EU* as ADR-0001 assumed: the PM and the likely first users are in the Americas, and latency matters more than an "EU-hosted" claim at this stage. The privacy note states the location; Q9 (legal check) stays open before the public beta.
- *`jar-of-light.vercel.app` was taken*, so the app runs at `jaroflight.vercel.app`; the brand stays Jar of Light.

### Revisit when

1. The prod database passes **400 MB** (80% of the free limit);
2. We need point-in-time restore or provider-managed backups (e.g. before the public beta);
3. Keep-alive or backups fail more than once a month;
4. The project becomes commercial (Vercel Hobby is non-commercial).

First step at that point: Supabase Pro ($25/month).

---

## Template for a new record

```markdown
## ADR-NNNN: Title

- **Status:** Proposed | Accepted | Superseded by ADR-XXXX
- **Date:** YYYY-MM-DD
- **Deciders:** …

### Context
### Decision
### Options considered
### Consequences
### Revisit when
```
