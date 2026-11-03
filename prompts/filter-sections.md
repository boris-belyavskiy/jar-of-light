# Prompt log: three parts in the filter

The prompt is quoted as written, in Russian (the chat language), with an English summary. The tester's name is replaced.

## Prompt

> и второе: фильтр времени громоздкий. ее просьба С до По разместить на одну строчку. рядом с кнопкой показать должна быть кнопка очистить (дата / время). и ее просьба была визуально разделить поиск по словам, поиск по датам, поиск по категориям. и у поиска по словам также должна быть кнопка очистить

*Summary: second, the date filter is bulky. The tester asked to put From and To on one line, to have a Clear button next to Show, to visually separate search by words, by dates and by categories, and to give search by words its own Clear button.*

**Agent response (summary):** split the filter into three parts with a line between them. Search and dates became two forms, each carrying the rest of the filter in hidden fields, so clearing or applying one keeps the others. From and To share one line, which needed a slightly wider side column (14rem to 16rem) and a smaller date font.

## A bug the agent caught

While adding Clear, the agent suspected that a date field would keep its old value after clearing, because a link inside the app does not rebuild the form. It checked this on a temporary page: without the fix the URL was clear but the fields still showed 01.10 and 31.10, so pressing Show would have brought the old dates back. The old "Reset dates" link had the same bug. The fix gives each form a `key` that changes with its filter, and the same check then showed empty fields.
