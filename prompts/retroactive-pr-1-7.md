# Prompt log: PRs #1–#7 (retroactive)

**Recovered on 2026-11-02, after the fact.** These PRs were built from the first plan and the PRD, Tech Spec and Roadmap, but had no prompt logs at the time. The quotes below are copied from the saved Claude Code session logs on my machine, in Russian as written, with an English summary. Long prompts are shortened with […]. Times are UTC.

## PR #1: app skeleton and minimal private journal

**2026-10-27 20:23**

> так, давай идти от простого к сложному. на первом шаге мы будем делать личный кабинет (регистрация / подключение через google account), и возможность добавлять записи благодарностей, указывать им дату и самому назначать категорию. Чтобы эти благодарности видели люди только в своем аккаунте. Какие технические развилки надо пройти - дай мне сюда вопросы, и я тебе отвечу

*Summary: start simple: an account through Google, entries with a date and my own category, visible only in one's own account. Ask me about the technical forks first.*

**2026-10-27 20:30** (my answers)

> 2. Язык сразу два […] 4. Вход только Google 5. Я бы хотел любой с гугл-аккаунтом […] 8. […] лимит давай 4000 символов 9. Дата и время давай 10. Редактирование и удаление да 11. Фильтр по категории сразу 12. Категорий можно несколько 13. Категории давай на старте: семья, друзья, работа, учеба, здоровье, случайная встреча […]

*Summary: two languages, Google only and open to anyone, a 4,000-character limit, date and time, edit and delete, a category filter, several categories per entry, six starter categories.*

**2026-10-28 01:07**

> Мы готовы создавать репозиторий на гитхаб и делать первую версию приложения. Напиши, какой у тебя план на текущую итерацию с учетом знания проекта и приступай

*Summary: we are ready to create the repository and build the first version. Tell me your plan for this iteration and start.*

**2026-10-28 01:57** (after trying it)

> все сработало, несколько моментов для доработки: пусть кнопка смены языка будет видна сразу, а не только в settings; пусть будет кнопка изменения категорий сразу при выборе категорий […]; пусть в фильтре будет возможность выбирать несколько категорий сразу […]; фильтр также нужен по датам, без времени; возможность сохранить дату и время в будущем я бы оставил

*Summary: it works. Show the language switch right away, link to category editing from the category picker, allow several categories in the filter, add a date filter, keep future dates.*

## PR #2: mark P1a deployed

**2026-10-28 02:45**

> Всё работает

*Summary: everything works.*

**Agent response (quoted):** "Обновлю статус в документах через небольшой PR (правило проекта: в `main` — только через PR)". The status update was the agent's proposal; I went along with it.

## PR #3: P1a done, backups running, sign-in open to everyone

**2026-10-28 03:17**

> да, все сработало. тогда обнови документы по текущему статусу, а я после этого замерджу реквест по документам

*Summary: yes, it all worked. Update the documents to the current status, and I will merge that request afterwards.*

## PR #4: one shell, left-side feed filters, category order, About page

**2026-10-31 23:22**

> План по доработке Jar of Light: 1. Возможность кастомизировать порядок категорий, которые отображаются 2. Сделать выбор категорий как вертикальное меню сбоку слева 3. Фильтр дат сделать слева над фильтром категорий […] 6. Там, где сейчас категории, должна быть полоска, ткнув на которую, начнется создание новой записи (как feed в ленте новостей facebook) 7. Раздел пусть называется не «ваша банка» а «ваши огоньки» 8. Должен быть короткий раздел «о проекте» […]

*Summary: custom category order, categories as a left-side menu, the date filter above them, a composer bar as in the Facebook feed, rename the section to "Your lights", a short About page.*

**2026-10-31 23:45**

> нужно чтобы категории можно было менять порядок, перетаскивая ее при зажатии ЛКМ, иначе неудобно

*Summary: categories should be reordered by dragging with the left mouse button.*

**2026-11-01 00:04**

> Отлично, давай зафиксируем несколько общих принципов. 1. Омниканальность - будем делать единый опыт веб и мобильный по функционалу 2. Единая оболочка, всегда текстовый блок всегда в одном и том же месте […]

*Summary: fix two general principles: the same features on web and mobile, and one shell with the text block always in the same place. These became ADR-0004.*

## PR #5: fixed frame, entries open in place, date pill and entry menu

**2026-11-01 00:20**

> вот эта часть всегда должна оставаться сверху, а остальные посты и их части прокручиваться. создание записи при нажатии плашки должно оказываться в той же оболочке […]. Выбор даты и времени должен быть вверху поста […]. при нажатии на пост он просто должен открываться как заметка в facebook, а кнопка редактирования на посте должна быть отдельно, небольшое меню в правом верхнем углу: редактирвовать, удалить […]

*Summary: the top part stays in place and only posts scroll; the composer opens in the same shell; date and time at the top of a post; a post opens like a Facebook note; edit and delete in a small corner menu.*

## PR #6: full-width frame, entry window, bilingual category names, UTC offsets

**2026-11-01 19:47**

> 1. далее - пусть scroll bar появляяется только тогда, когда текст не умещается на странице […] 2. пусть в дневнике запись в развернутом состоянии будет как всплывающее окно […] 3. Если категорию называют, нужно 2 поля на русском и английском […] 5. У встроенных категорий должна быть возможность переименовываться […]

*Summary: a scroll bar only when the text does not fit; an opened entry as a pop-up window; two name fields for a category, Russian and English; built-in categories can be renamed.*

**2026-11-01 20:06**

> Да, выкатывай

*Summary: yes, roll it out. The agent applied the migration to the dev database first and to production right before merging.*

## PR #7: drop the old single-language category name

**Agent response (quoted, 2026-11-01 20:08):** "Осталось одно: старое поле `categories.name` в базе. […] Новый код его уже не читает, так что его можно убрать отдельной маленькой миграцией."

**2026-11-01 20:25**

> Да, сделай

*Summary: the cleanup was the agent's proposal and I approved it.*
