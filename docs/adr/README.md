# Architecture Decision Records

An ADR records one significant decision: the context, what we decided, what else we considered, and the consequences. ADRs are never rewritten after acceptance; a changed decision gets a new ADR that supersedes the old one.

**Statuses:** Proposed · Accepted · Superseded by ADR-XXXX · Deprecated.
**File name:** `NNNN-short-title.md`, numbered in order.

## Log

| ADR | Decision | Status | Date |
|---|---|---|---|
| [0001](0001-no-self-hosted-servers.md) | No self-hosted servers for now: managed hosting and LLM via API | Accepted | 2026-10-19 |
| [0002](0002-free-stack-supabase-keepalive-backups.md) | Free stack for P0–P1: Next.js on Vercel, Supabase Free with keep-alive and own backups | Accepted | 2026-10-27 |

## Candidates

Proposed in the [Tech Spec](../TECH_SPEC.md) and the [PRD](../PRD.md), not yet decided. Each becomes an ADR once accepted.

- Private individuals are never published by full name; personal thanks go through private-link cards
- 100% manual pre-moderation of public posts in beta
- Entry parsing is asynchronous; AI suggests and never changes data on its own
- Model mix per task vs. one model for everything (Q7, decided on evals)

## Template

```markdown
# ADR-NNNN: Title

- **Status:** Proposed | Accepted | Superseded by ADR-XXXX
- **Date:** YYYY-MM-DD
- **Deciders:** …

## Context
## Decision
## Options considered
## Consequences
## Revisit when
```
