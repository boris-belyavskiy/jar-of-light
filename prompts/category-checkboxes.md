# Prompt log: category checkboxes

Prompts are quoted as written, in Russian (the chat language), with an English summary.

## Prompt

> И там же в категориях давай уберем кнопку все, рядом с каждой категорией поставим место для нажатия галочки, а сверху, рядом с заглавием "категории" должна быть кнопка "очистить" (фильтр)

> кнопка статистики всегда должна быть видна, если категории не будут помещаться на одном экране, для них должен быть свой встроенный scroll-bar

*Summary: remove the "All" button, put a tick box beside each category, add a "Clear" button next to the "Categories" title. The statistics button must always be visible, so if the categories don't fit, they get their own scroll bar.*

**Agent response (summary):** moved the filters into `components/journal/feed-filters.tsx`, replaced the rows with tick boxes and made only the category list scroll. "Clear" clears the categories, not the dates, since the dates have their own reset. Before this change the tick mark existed only on wide screens and phones had coloured chips; the same rows now serve both, following ADR-0004.
