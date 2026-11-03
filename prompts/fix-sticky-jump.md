# Prompt log: filters and head shaking while scrolling

The prompt is quoted as written, in Russian (the chat language), with an English summary.

## Prompt

> когда прокручиваю скролл-баром записи, фильтры и верхняя шапка немного скачат, "дребезжат", надо убрать этот эффект

*Summary: when I drag the scroll bar through the entries, the filters and the top header jump a little, they "rattle". This effect has to go.*

**Agent response (summary):** did not guess. It dragged the real scrollbar in Chrome by script, at display scales of 1, 1.25, 1.5 and 2, recorded every frame and compared the fixed parts pixel by pixel.

**What it found:** the filters and the page head moved by exactly 1 pixel between the very top of the page and any scrolled position. The header was 57 pixels tall (56 plus its bottom line), while the parts below stick at 56. So they sit at 57 at the top and at 56 once scrolled.

**The fix:** the header is now exactly 56 pixels including its line.

**What is not proven:** in the recorded frames this was the only movement. A shake that shows only on a real screen while dragging would not appear in this test, so I have to check it myself.
