# Prompt log: encryption, step 2a (the crypto module)

Prompts are quoted as written, in Russian (the chat language), with English summaries.

## Prompts

> Да, план шага 2

*Summary: yes, show me the plan for step 2.*

**Agent response (summary):** proposed four pull requests (2a module, 2b setup and unlock, 2c writing and reading, 2d search and statistics) and asked four questions.

> делаем добровольно (recommended), саму настройку добавляем в раздел settings
> Когда закончим с этим шагом выведи мне все оставшиеся шаги которые надо будет сделать до того, как мы можем считать шифрование полностью реализованным

*Summary: make it voluntary and put the setup in Settings. When this step is done, list every remaining step until encryption counts as fully built.*

> Да, начинай 2a

*Summary: yes, start 2a, accepting the agent's recommendations for the other three questions (search on the device, four pull requests, a hint for weak passwords).*

**Agent response (summary):** built `lib/crypto/` with unit tests, allowed WebAssembly in the Content Security Policy and recorded the step 2 decisions in ADR-0013.

## Decisions by the agent

- The data key is wrapped with AES-GCM under the derived key instead of the Web Crypto key-wrapping call, so it never exists as an extractable key. Unlocking returns a non-extractable key.
- The recovery code is 28 symbols (140 bits) rather than the 26 first discussed, so it splits into seven groups of four.
- Argon2id settings are picked from a ladder by timing on the device, and settings weaker than OWASP's minimum or heavier than 256 MiB are refused on unlock, so a hostile server cannot freeze a device.
- `hash-wasm` (MIT, WebAssembly) was chosen over the audited but pure-JavaScript `@noble/hashes`, because it is much faster on a phone; it loads only when a key is derived.
- Tests were checked by breaking the code on purpose: without the row binding and the settings bounds, three tests fail.
