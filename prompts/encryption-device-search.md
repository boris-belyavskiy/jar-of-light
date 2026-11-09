# Prompt log: encryption, step 2d (search and statistics on the device)

Prompts are quoted as written, in Russian (the chat language), with English summaries.

## Prompts

> А насчет статистики - что ты имеешь в виду? что ее будет видеть только пользователь, и я как автор базы не смогу видеть статистику?

*Summary: what did you mean by statistics in 2d? That only the user will see it, and I as the author of the database will not?*

**Agent response (summary):** the statistics page counts entries by date and category, which stay readable, so it already works with encrypted entries; only statistics with a text query move to the device. The author of the database can still count entries by date and by built-in category, but cannot read the text or the names of the user's own categories.

> да, идем в 2d

*Summary: yes, go ahead with 2d.*

## Decisions by the agent

- **The words stay in the memory of the tab** (a context in the shell), not in the address and not in any request. An old link with `q` is ignored for an account with keys. The category, date and favorites filters stay in the address and run in SQL.
- **The device fetches the entries the other filters select, page by page** (500 rows a page, ordered like the feed with the id as a tie-break), decrypts them as they arrive and matches the words as one phrase, ignoring case and Unicode form, as the server's `ILIKE` did. The feed shows the first 200 matches.
- **One list, two sources.** The server renders the list when there are no words; with words the device draws the matches with the same card component, so both look the same.
- **The statistics components no longer know about the server.** They use the same hooks on both sides and draw category names through the client component that decrypts them, so the device can reuse them for statistics over its matches.
- **Results are fetched again when the person returns to the list,** so an entry that was edited, added or deleted does not leave stale results.
- **A locked device shows an unlock card** instead of searching, because without the key it could only match readable entries.

## Checked

Unit tests for the matching and for the filter round trip. In the browser on a stand-in page with a replaceable row fetcher: 1,100 entries across three pages, two of them with the word in ciphertext and one in readable text, found in any letter case; the address does not change; the statistics count exactly those three with the right split by category; a locked device shows the unlock card and the results return after unlocking; no console errors. Not checked by the agent: the real server action and the signed-in shell, which need Google sign-in.
