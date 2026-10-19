# ADR-0001: No self-hosted servers for now — managed hosting and LLM via API

- **Status:** Accepted
- **Date:** 2026-10-19
- **Deciders:** Boris Belyavskiy (PM), Claude (tech review)

## Context

The original brief proposed running our own server with an open-weight LLM to avoid paying for tokens.

At the same time:

- the product is built by one person, part-time, with no DevOps capacity;
- the next six months are about learning (customer research, closed beta), with tens to hundreds of users, not thousands;
- the product handles private, emotional texts, so security patching, backups and access control must be reliable from day one;
- the first phase (P1) has no AI at all.

## Decision

In the current horizon we **do not run our own servers**: no VMs, GPU machines or Kubernetes.

| Need | Choice |
|---|---|
| App hosting | Managed platform: **Vercel** |
| Database, auth, storage | Managed Postgres: **Supabase**, EU region |
| LLM | Commercial API: **Anthropic**, behind a provider abstraction (`lib/ai/provider.ts`) |

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **1. Managed platforms + LLM API** *(chosen)* | Zero ops; free start; preview deploy per PR; cost grows with usage; strong models on RU and EN | Vendor dependence; free-tier limits; user data processed by third parties |
| 2. Own VPS for app and database | Cheaper at scale; full control | Patching, backups, monitoring and security fall on one part-time person |
| 3. Own GPU server with an open-weight LLM | No per-token cost; data stays in our perimeter | Fixed ~$500–1,500/month + DevOps from day one; small open models are noticeably weaker in Russian and on safety tasks (crisis detection, anonymization) |
| 4. Open-weight models via hosted inference (pay per token) | No servers; cheaper models available | Quality to be proven on our evals; kept as an option behind the abstraction |

**Cost comparison** (details in [Tech Spec §6.6](../TECH_SPEC.md#66-cost-estimate)):

| Monthly active users | 100 | 1,000 | 10,000 |
|---|---|---|---|
| LLM API, model mix (≈ $0.10–0.15 per user) | ~$15 | ~$150 | ~$1,500 |
| Own GPU server 24/7 | $500–1,500 + DevOps | $500–1,500 + DevOps | from $1,500 + scaling |

The API is cheaper until roughly 3,000–10,000 monthly active users.

## Consequences

**Positive**

- P0 and most of P1 cost $0; time goes into the product, not infrastructure.
- Every pull request gets a preview link, which speeds up review with users.
- AI cost is visible per user and per task (`ai_runs`) and scales with usage.

**Negative and how we handle it**

- *Vendor dependence* → standard Postgres (portable), the provider abstraction for LLMs, open export formats, no core logic tied to proprietary features.
- *Free-tier limits* (Vercel Hobby is non-commercial and runs cron at most daily; Supabase Free pauses after 7 days without activity) → frequent jobs in `pg_cron`; Supabase Pro before beta users store real entries; Vercel Pro once the project is commercial.
- *Third parties process user data* → EU region, data processing terms with providers, entry text sent to the LLM only when AI is on and only from the server, all disclosed in the privacy policy.

## Revisit when

Any of these becomes true:

1. More than **5,000 monthly active users**;
2. AI cost above **$0.30 per active user per month**;
3. A requirement that **data must not leave our perimeter** (B2B customers, data localization);
4. Managed-platform bills above **~$300/month** with a clearly cheaper equivalent.

First step at that point: run open-weight models through hosted inference (option 4) on our evals. The provider abstraction makes the switch per task.
