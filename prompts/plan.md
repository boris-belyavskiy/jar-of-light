# Prompt log: PLAN.md

Prompts are quoted as written, in Russian (the chat language), each with an English summary.

## Prompt 1: write the plan

> Я хочу использовать Банку Света также для выполнения задания по intro to coding for MBA - вот PDF задания. […] Ты сделаешь документ Plan, который будет основан на реальном первоначальном плане и остальных вспомогательных файлах (не надо дублировать все, основное что спрашивается в задании кратко + ссылки на профильные документы уже в репозитории). Затем ты задашь мне вопросы, ответы на которые недостают, чтобы полностью выполнить задание.

*Summary: base the plan on the real first plan and the existing documents; state briefly what the assignment asks and link the rest; then ask me what is missing.*

**Agent response (summary):** drafted the seven sections and proposed three new features of its own (open the jar, export, a calendar). It flagged that the repository history cannot meet "plan before any feature PR" and "no direct commits to main" literally, and asked ten questions.

## Prompt 2: my decisions

> Plan появился позже фич, но в плане можно отметить, что был Prod, Tech, Документы, которые появились в первом коммите, что развели на несколько документов под будущий рост приложения

> Питч: чтобы в своей жизни было больше благодарности, чувствовать включенность, не тревожиться. И план писать по одной записи в день

> Свои фичи у нас уже есть: выбор категорий нескольких, выбор даты и времени, редактирование благодарностей, редактирование заданных категорий

> Вдохновение - да, плюс книга про мумий троллей. Фича с меньшей уверенностью - редактирование заданных категорий - она может оказаться далекой от изначально заданной, что усложнит статистику в будущем

> Из фич-фильтров давай добавим в дневник, под фильтром категорий раздел статистика. Там будет 1 показатель - число записей по датам (у нас для этого все есть)

*Summary: note that the PRD, Tech Spec and other documents came in the first commit; my pitch and one entry a day; my own features are ones we already have; add Moomin as inspiration; my least sure feature; add a statistics section under the category filter.*

**Agent response (summary):** replaced its three proposed features with mine. "Editing entries" is already part of the required CRUD, so it cannot also count as my own feature, which leaves exactly three. It also kept three summary stats next to my one chart, because the assignment requires 2–3 summary stats.

## Prompt 3: stop on stars

> так, что за звезды? давай не будем делать звезды, пока ты не объяснишь, что конкретно ты с ними собираешься сделать. Можешь это оставить на финальный шаг. Возможно, мы не будем делать звезд конкретно для этого приложения

*Summary: what are these stars? Don't build them until you explain exactly what you will do. Leave it to the final step; we may not build stars for this app at all.*

**Agent response (summary):** marked feature 10 as undecided in the plan, moved the decision to the end and worded the data isolation test so it does not depend on stars.

## Prompt 4: the plan came first

> Первый план лежит в архиве и был сделан мастер-план по основным фичам, это и был первый план. Затем мы сделали 3 документа, чтобы по ним легче было распределять информацию (продуктовую, техническую и т.д.). То, что мы для задания снова сделали единый план, не означает, что план появился после - надо это явно показать.

*Summary: the first plan is the master plan in the archive; then we made three documents to organize the information. Making one plan again for the assignment does not mean the plan came later, and this must be shown explicitly.*

**Agent response (summary):** agreed that it had mixed up "the file `PLAN.md` came later" with "the plan came later". It checked the order in `main` (documents from 2026-10-19, first code on 2026-10-27) and the archived plan, then corrected the opening of `PLAN.md`. Sections 1–7 were not changed.
