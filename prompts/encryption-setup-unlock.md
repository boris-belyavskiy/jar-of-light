# Prompt log: encryption, step 2b (setup and unlock in Settings)

Prompts are quoted as written, in Russian (the chat language), with English summaries.

## Prompts

> замерджил, делай

*Summary: I merged 2a, go ahead (with 2b).*

**Agent response (summary):** built the "Encryption" section of Settings (turn on, change the diary password, a new recovery code), a lock in the header that opens an unlock dialog (password, or recovery code plus a new password), and key handling on the device. Nothing is encrypted yet.

## Decisions by the agent

- **Keys are saved only after the recovery code is typed back.** Generating the keys happens in memory; the server hears about them last. A code the user never saved would promise a way back that does not exist.
- **The lock lives in the header, not in a banner,** so no page moves when encryption is on (ADR-0004). Locked content will show the existing "Locked" placeholder until the device is unlocked.
- **"Forgot password" means the recovery code plus a new password,** one flow, instead of unlocking with the code alone.
- **The key provider takes the storing functions as props.** The real ones are server actions; this let the screens be checked in the browser with stand-ins, because the built-in browser cannot sign in with Google. The stand-in page was deleted before the PR.
- **Weak passwords are hinted at, never blocked** (ADR-0013): a three-bar meter and a suggestion of a phrase of four words.
- The device key store swallows storage errors: in a private window the key lives in memory for the visit and the password is asked again next time.

## Checked

Unit tests for the device key store and the password hint. In the browser, on a stand-in page: setup, a wrong then a right recovery code typed back (case, spaces and dashes forgiven), a key that survives a reload, lock, a wrong password, reset with the recovery code, change of password, the unlock dialog from the header; no console errors under the Content Security Policy. Not checked by the agent: the real server actions and the shell with a signed-in session, which need Google sign-in.
