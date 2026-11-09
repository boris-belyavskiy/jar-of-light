# Prompt log: record encryption steps 1 to 3 as merged

Prompts are quoted as written, in Russian (the chat language), with English summaries.

## Prompts

> спасибо, смерджил, зафиксируй результаты в документации и на этом сегодня остановимся

*Summary: thanks, I merged step 3; record the results in the documentation and we stop for today.*

**Agent response (summary):** updated the Roadmap (Horizon 1 steps 1 to 3 merged, the backups restore check ticked) and the "Next work" section of `CLAUDE.md`, which a new agent reads first: what exists, what is not verified, and what step 4 must do.

## What the record says

- **Done in one day, 2026-11-08:** steps 1 to 3 of Horizon 1 as PRs #64, #68, #70, #72, #74, #76 and #78, plus backups PR #4 and the decisions ADR-0013, ADR-0014 and ADR-0015.
- **Not checked by an agent:** the real server actions and the signed-in shell of steps 2 and 3 need a Google sign-in, so the screens were checked on stand-in pages and by the owner by hand. A new agent should ask whether the move has been run on production before step 4.
- **Open before step 4:** tell the other existing users in person (a draft message exists in the conversation, not in the repository), an extra backup and restore before touching production, and step 4 itself, first on the owner's account.
- **Lessons kept for the process:** migrations go to production before the merge (step 1 was merged first and the new code read missing columns for a few minutes); `npm run dev` creates an untracked `AGENTS.md`, which is never committed.
