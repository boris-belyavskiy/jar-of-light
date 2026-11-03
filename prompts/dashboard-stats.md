# Prompt log: dashboard summary stats

Prompts are quoted as written, in Russian (the chat language), with an English summary.

## Prompts

> Из фич-фильтров давай добавим в дневник, под фильтром категорий раздел статистика. Там будет 1 показатель - число записей по датам (у нас для этого все есть). кнопка статистики всегда должна быть видна

*Summary: add a statistics section under the category filter, with one metric: the number of entries by date. The statistics button must always be visible.*

> Показатель дашборда делай как решили, по числу постов за период (период меряем по датам, которые отмечает пользователь).

*Summary: build the dashboard metric as decided: the number of posts in a period, where the period is the dates the user selects.*

**Agent response (summary):** added a "Statistics" button under the filters that opens the dashboard in the same column, following ADR-0005 (everything opens in place). The filters stay on the left and apply to the dashboard. The assignment requires 2–3 summary stats, so it shows entries in the period, days with an entry and the best month.

**A change from `PLAN.md`:** the plan said "days with light this month". Since the period now comes from the dates the user selects, the stat became "days with an entry in the period". This goes into Plan vs. Reality.
