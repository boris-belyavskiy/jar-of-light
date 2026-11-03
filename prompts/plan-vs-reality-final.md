# Prompt log: final Plan vs. Reality

The prompt is quoted as written, in Russian (the chat language), with an English summary.

## Prompt

> Самый большой разрыв с организацией категорий. Был план, что будут предзаданные, а потом будут просто добавляться новые. Но в процессе использования обнаружилось, что с категориями много деталей: переименования имеющихся, если недостаточно точны, возможность перемещать их, и не просто стрелочками, но зажатием мыши, Что потребовалось делать имена категорий на двух языках, иначе в английской версии отображается русский и наоборот

*Summary: the biggest gap is how categories are organized. The plan was preset categories, with new ones simply added later. Using the app showed many details: renaming existing ones when they are not accurate enough, moving them, by holding the mouse rather than with arrows, and names in two languages, because otherwise the English version shows Russian and the other way round.*

**Agent response (summary):** went through the history. The first commit's PRD said built-in categories "can be hidden or renamed". On 2026-10-27 the agent recommended "built-in ones: hide only", I accepted that default, and the PRD changed. It updated Plan vs. Reality and added the quoted replies to `prompts/retroactive-pr-1-7.md`.

## Prompt 2: a correction

> "ты выбрал" - я строил по плану по умолчанию, а затем говорил какие доработки требуются - в частности, переименования имеющихся категорий и возможность пользоваться мышью - эти фичи предложил я

*Summary: "you chose" is wrong. I built to the default plan and then said what improvements were needed; renaming existing categories and using the mouse in particular were features I proposed.*

**Agent response (summary):** agreed that it had put the weight in the wrong place. The agent's recommendation only set the starting default. The changes themselves were my call, and each starts from my own prompt. It rewrote "Who decided?" in the reflection to say so.
