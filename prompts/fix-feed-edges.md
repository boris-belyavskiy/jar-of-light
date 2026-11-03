# Prompt log: lines at the edges of the feed

The prompt is quoted as written, in Russian (the chat language), with an English summary. The tester's name is replaced.

## Prompt

> [тестировщик] завела аккаунт сама, у нее возникло несколько вопросов: когда прокручиваешь ленту журнала - появляются полосы записи слева и справа, уходящие вверх - некрасиво

*Summary: the tester signed up alone and had a few questions. When you scroll the journal feed, lines from the entries appear left and right, running upward. It looks bad.*

**Agent response (summary):** found the cause in the screenshot. The sticky head that entries scroll under was exactly as wide as the column, but each entry card has an outline and a shadow that reach 1–2 pixels outside it, so their edges stayed visible past the head on both sides. It widened the head's background by 0.5rem on each side without moving its content.

This bug has been there since the head became sticky in PR #5. I and the agent both missed it, and a first-time user saw it within minutes.
