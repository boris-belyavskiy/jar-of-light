# Prompt log: remember the key on the device

Prompts are quoted as written, in Russian (the chat language), with English summaries.

## Prompts

> я вообще хочу, чтобы пользователь один раз задавал ключ, его спрашивали при входе в дневник на устройстве один раз и все
> Если человек входит на новом устройстве, ему придется ввести ключ еще раз
> Если человек хочет сменить пароль, ему надо ввести ключ еще раз
> И будет по умолчанию отображаться иконка, что шифрование включено

*Summary: the owner described the behaviour he wants: set the key once, asked once per device, again on a new device and when changing the password, and an icon that shows encryption is on.*

**Agent response (summary):** compared this with what was built. All but two points already held. Sign-out wiped the key, so the password was asked after every sign-in; and the open-lock icon read as "not protected". Offered a "Remember on this device" checkbox and an icon from step 2c, and asked two questions. The owner chose both recommended answers.

## Decisions by the owner

- Remember the key by default, with a checkbox at unlock and setup ([ADR-0014](../docs/DECISIONS.md#adr-0014)).
- Show the "encryption is on" icon from step 2c, when new entries are really encrypted: a shield with a check, or a lock.

## Decisions by the agent

- The checkbox is on by default and explains itself in one line, including the advice to uncheck it on a shared computer.
- Signing in as another account on the same browser removes the first account's key.
- The plain server-side sign-out form is back; the client button of step 2b existed only to wipe the key.
