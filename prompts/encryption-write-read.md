# Prompt log: encryption, step 2c (write and read encrypted content)

Prompts are quoted as written, in Russian (the chat language), with English summaries.

## Prompts

> замерджил, давай 2c

*Summary: I merged the previous pull request, go ahead with 2c.*

**Agent response (summary):** before coding, listed the risks of this step (plaintext leaking from an encrypted account, the row id needed before encrypting, stale plaintext after an edit, a locked device, drafts, search) and how each is closed. Then built it.

## Decisions by the agent

- **The server refuses plaintext from an account that has keys,** and refuses ciphertext from one that has none. The device also drops the readable text from what it sends, so a stale tab or a bug cannot put readable text next to keys that promise otherwise.
- **The device makes the row id before encrypting,** because the ciphertext is bound to it. This needed one small migration (an insert grant on `id`), which must reach production before the merge.
- **Editing an old plaintext entry on an encrypted account stores ciphertext and erases the plaintext** in the same update, and so does renaming a category, so no stale readable copy stays behind.
- **A locked device sees an unlock card instead of a form,** so typed text is not lost to a failed save. A new account sees the setup flow before its first entry or category.
- **Drafts of an encrypted account stay in memory only,** which survives the trip to the categories page and back but never touches the disk. This is stricter than "encrypted drafts" in ADR-0011.
- **Category names are decrypted once, in one place,** and every screen reads them from there; pages rendered on the server draw an encrypted name with a small client component.
- **The uniqueness of own category names moved to the device,** because the unique indexes cannot see inside ciphertext. Built-in renames never had that rule.
- **Search by words does not find encrypted entries until step 2d.** The statistics count entries by date and category and are not affected.

## Checked

Unit tests for the write mode, for validating and encrypting an entry and category names, and for the database grant. In the browser on a stand-in page: a ciphertext entry and category name are decrypted into the feed, the edit form and the chips; a new entry sends only ciphertext, a fresh id and the dates, with no readable field; a locked device shows the locked texts and the unlock card, and everything returns after unlocking; no console errors. Not checked by the agent: the real server actions, the categories page and the shell with a signed-in session, which need Google sign-in.
