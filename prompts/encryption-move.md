# Prompt log: encryption, step 3 (move existing content)

Prompts are quoted as written, in Russian (the chat language), with English summaries.

## Prompts

> да, давай весь шаг 3

*Summary: yes, do the whole of step 3.*

**Agent response (summary):** before coding, listed the risks of the step (nothing erased, never overwrite newer ciphertext, check by a fresh download, resumable, request size limits, the required setup reaching other users, `updated_at` changing) and how each is closed. Then built the move.

## Decisions by the agent

- **The run keeps no state.** What is left is whatever has readable text and no ciphertext, asked of the server each time, so a closed tab costs nothing. Recorded as [ADR-0015](../docs/DECISIONS.md#adr-0015).
- **Writes touch only rows that still have readable text.** A row that was edited meanwhile on an encrypted device has none, and its newer ciphertext is never replaced. The filter uses the column being non-empty, because the text itself would not fit in a URL.
- **The check is a fresh download.** Mismatches are repaired from the readable text, which is the truth until step 4, and checked again, up to three rounds. A deliberate break of the repair and of the loop guard made three tests fail.
- **Batches are limited by size (about 300 KB),** well under the server action limit of about 1 MB.
- **The required setup keeps Settings reachable,** so a person who does not want it can still delete their account. Public pages stay open too.
- **The gate's rule is a pure function with its own tests,** apart from the screen that shows it.
- **Moved rows report only counts:** the screen never shows a title, a name or a piece of text, and errors carry only a kind.
- **The syntax of the three PostgREST filters was checked against the dev project** without signing in: a wrong filter is rejected with a parse error before permissions are looked at, a right one with "permission denied".

## Checked

Unit tests for the engine with an in-memory store (everything moved and read back, resume, an edit after encryption, a newer ciphertext not overwritten, a corrupt and a misplaced ciphertext, a save that does not take, abort, large batches, progress) and for the gate rule. In the browser on a stand-in page with 352 rows: a network failure shows a clear message and a retry button; closing the tab halfway leaves 250 of 350 unencrypted; running again encrypts only those 250, checks all 352, repairs none and leaves every readable text in place; no console errors. Not checked by the agent: the real server actions and the required-setup gate in the signed-in shell, which need Google sign-in.
