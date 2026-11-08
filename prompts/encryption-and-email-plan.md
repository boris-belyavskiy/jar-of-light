# Prompt log: plan for encryption, own domain and email sign-in

Prompts are quoted as written, in Russian (the chat language), with English summaries. This was a planning conversation: no application code changed.

## Prompts

> Есть ли способ сделать для меня (владельца supabase) недоступными данные, что заполняют пользователи? Но оставить доступным активность и их профили, но не видеть, что именно они пишут?

*Summary: can the data users enter be made unavailable to me, the Supabase owner, while activity and profiles stay visible?*

**Agent response (summary):** only encryption on the user's device makes it technically impossible. Encryption on the server or inside the database still leaves the owner able to read. It also found that the docs' claim that end-to-end encryption is incompatible with AI and the public page was too strong.

> Давай также продумаем, как будет осуществлен переход для действующих пользователей. И относительно пункта 3 - если мы введем регистрацию: как это будет осуществлено для действующих пользователей, чтобы их данные не потерялись

*Summary: let's work out how existing users move over, and how registration works for them without losing their data.*

**Agent response (summary):** counted accounts in production (aggregates only) and proposed a move on the device with a check before anything is erased. Data belongs to `user_id`, so a new way of signing in touches no data.

> а мы можем сделать, чтобы если человек делает регистрацию по имеющемуся аккаунту, то просто у человека появится опция и через google API, и через вход по логину (email) и паролю

*Summary: can registering with an existing account simply give the person both Google and email and password?*

**Agent response (summary):** yes, with a 6-digit code from the email as proof of ownership; the same screens serve new and existing emails.

> что проще и надежнее сделать: 1. Сперва сделать шифрование записей, а потом отдельной итерацией покупать домен и делать регистрацию 2. Или делать оба процесса параллельно

*Summary: which is simpler and more reliable, encryption first and then domain and registration, or both in parallel?*

**Agent response (summary):** one after the other, encryption first, which changed its own earlier suggestion to start with sign-in.

> ты тогда зафиксируй решения в соответствующих документах по нашим планам. Первый горизонт - сделать шифрование, и как это отразится на остальных наших решениях. Второй горизонт - переход на отдельный домен и переход на логин-пароль наряду с API. А сам кодинг сделаю уже со следующим агентом

*Summary: record the decisions in the plan documents. Horizon 1: encryption and how it affects our other decisions. Horizon 2: an own domain and login and password alongside Google. The coding will be done with the next agent.*

## Decisions by the owner

- Encryption on the device, with a diary password and a recovery code ([ADR-0011](../docs/DECISIONS.md#adr-0011)).
- AI by consent, only while the app is open.
- Google Play and App Store apps are parked.
- Encryption first, domain and registration after it, not in parallel.
- An own domain rather than a separate Gmail ([ADR-0012](../docs/DECISIONS.md#adr-0012)), with the site moved to it after encryption.
- The diary password has a minimum of 8 characters (the agent had proposed 12).
