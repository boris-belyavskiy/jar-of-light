# Prompt log: data isolation test

Prompts are quoted as written, in Russian (the chat language), with an English summary.

## Prompt

> Давай проводить тест

*Summary: let's run the test.*

**Agent response (summary):** `tests/db/rls.test.ts` already checked pieces of this, but it had no required evidence. The agent added one dedicated test written as the Given / When / Then from `PLAN.md`. It runs the real migrations and policies on an in-memory Postgres, with no mocks.

To show red, then green, it temporarily changed the migrations so that anyone could read entries and stars (`using (true)`), ran the test in a console window and saved a screenshot. It then reverted the change with `git checkout`, ran the test again and saved a second screenshot.
