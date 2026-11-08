# Prompt log: encryption, step 1 (prepare)

Prompts are quoted as written, in Russian (the chat language), with English summaries.

## Prompts

> Привет - изучи репозиторий, нам надо сейчас делать шифрование согласно плану
> Напиши как ты понял задачу этапа и приступай

*Summary: study the repository; we now build encryption according to the plan. Say how you understood the stage, then start.*

**Agent response (summary):** read ADR-0011, Tech Spec §5.6 and Horizon 1 of the Roadmap, and took step 1 as "prepare with no visible change": an additive migration (`user_keys`, ciphertext columns, optional plaintext, a mark that users cannot set), the app reading both formats, a Content Security Policy, an extra backup, and `user_keys` in the backups repository's `COUNTS_SQL`. Opened Issue #63.

## Decisions by the agent

- A row may hold plaintext and ciphertext at the same time (`num_nonnulls(...) >= 1`). The first draft in the Tech Spec said "or", but step 3 writes ciphertext next to plaintext, so "or" would have refused it; the Tech Spec now says so.
- The Content Security Policy uses a nonce with `'strict-dynamic'` and allows inline style attributes, because the charts size bars with `style`.
- Applying the migration to the dev database through the agent's database tool was refused by the permission system, so the owner applies it by hand as `supabase/README.md` describes.
