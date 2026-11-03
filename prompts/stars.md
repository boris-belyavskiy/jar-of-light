# Prompt log: stars

Prompts are quoted as written, in Russian (the chat language), with an English summary.

## Prompt 1: a question first

> так, что за звезды? давай не будем делать звезды, пока ты не объяснишь, что конкретно ты с ними собираешься сделать. Можешь это оставить на финальный шаг. Возможно, мы не будем делать звезд конкретно для этого приложения

*Summary: what are these stars? Don't build them until you explain exactly what you will do. We may not build them for this app at all.*

**Agent response (summary):** explained that stars are spine feature 5 in the assignment, not its own idea, and described the smallest version: a star on an entry, one `stars` table, a list of starred entries, visible only to the author. It also explained what skipping them would cost.

## Prompt 2: my decision

> Давай звезды как избранное добавим в фильтр категорий, и саму звезду можно будет нажать справа сверху, рядом с 3 точками меню поста (редактировать / удалить)

*Summary: let's add stars as favorites in the category filter, and the star itself goes in the top right of a post, next to the three-dot menu (edit / delete).*

**Agent response (summary):** added the `stars` table with its access rules and RLS tests, and the star button beside the menu, both in the feed and in an opened entry. The favorites row in the filter comes in the next PR.

**A note on deployment:** the feed now reads `stars`, so the migration must reach production before this PR is merged. Otherwise the feed would break.
