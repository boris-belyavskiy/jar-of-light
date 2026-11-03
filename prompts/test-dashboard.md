# Prompt log: dashboard test

Prompts are quoted as written, in Russian (the chat language), with an English summary.

## Prompt

> Давай проводить тест. Показатель дашборда делай как решили, по числу постов за период (период меряем по датам, которые отмечает пользователь).

*Summary: let's run the test. Build the dashboard metric as decided: the number of posts in a period, where the period is the dates the user selects.*

**Agent response (summary):** wrote the test from the Given / When / Then in `PLAN.md`, with one change: because the period now comes from the dates the user selects, "days with light this month" became "days with an entry in the period". The second case (only November selected) is the plan's original expectation of 2 days.

To show red, then green, it temporarily changed `activeDays` in `lib/dashboard-stats.ts` to count entries instead of different dates, ran the test in a console window and saved a screenshot. It then reverted the change with `git checkout`, ran the test again and saved a second screenshot.
