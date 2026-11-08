# Decisions — Jar of Light

Architecture Decision Records (ADRs) in one file. Each record captures one significant decision: the context, what we decided, what else we considered, and the consequences.

**Rules**

- Records are **append-only**: an accepted record is never rewritten. A changed decision gets a new record that says which one it supersedes, and the old record's status becomes "Superseded by ADR-XXXX".
- New records go at the end, numbered in order, with an anchor `<a id="adr-NNNN"></a>` so documents can link to `DECISIONS.md#adr-NNNN`.
- **Statuses:** Proposed · Accepted · Superseded by ADR-XXXX · Deprecated.

> **Related:** [PRD](PRD.md) · [Tech Spec](TECH_SPEC.md) · [Roadmap](ROADMAP.md)

## Log

| ADR | Decision | Status | Date |
|---|---|---|---|
| [0001](#adr-0001) | No self-hosted servers for now: managed hosting and LLM via API | Accepted | 2026-10-19 |
| [0002](#adr-0002) | Free stack for P0–P1: Next.js on Vercel, Supabase Free with keep-alive and own backups | Accepted | 2026-10-27 |
| [0003](#adr-0003) | App foundations for P1a: no Cache Components, language without a URL prefix, RLS tests on in-memory Postgres | Accepted | 2026-10-27 |
| [0004](#adr-0004) | UX principles: one experience on web and mobile, one shell with the content always in the same place | Accepted | 2026-10-31 |
| [0005](#adr-0005) | A fixed frame where only the content column scrolls; entries open in place in the feed, addressed by the URL | Accepted | 2026-11-01 |
| [0006](#adr-0006) | Full-width pages, the window's own scrollbar, an opened entry as a window over the feed | Accepted | 2026-11-01 |
| [0007](#adr-0007) | The dashboard opens in place in the feed's column; stars are private favorites in the category filter | Accepted | 2026-11-02 |
| [0008](#adr-0008) | One frame for every edge, one baseline, one set of fonts, justified main text | Accepted | 2026-11-02 |
| [0009](#adr-0009) | The screen before sign-in is a narrow column in the center | Accepted | 2026-11-02 |
| [0010](#adr-0010) | English comes first wherever both languages are listed; points before sign-in are left-aligned | Accepted | 2026-11-02 |
| [0011](#adr-0011) | Journal content is encrypted on the user's device; the operator sees profiles and activity, not what people write | Accepted, not built yet | 2026-11-08 |
| [0012](#adr-0012) | An own domain, and email and password alongside Google on one account | Accepted, not built yet | 2026-11-08 |

## Candidates

Proposed in the [Tech Spec](TECH_SPEC.md) and the [PRD](PRD.md), not yet decided. Each becomes an ADR once accepted.

- Private individuals are never published by full name; personal thanks go through private-link cards
- 100% manual pre-moderation of public posts in beta
- Entry parsing is asynchronous; AI suggests and never changes data on its own
- Model mix per task vs. one model for everything (Q7, decided on evals)

---

<a id="adr-0001"></a>

## ADR-0001: No self-hosted servers for now — managed hosting and LLM via API

- **Status:** Accepted
- **Date:** 2026-10-19
- **Deciders:** Boris Belyavskiy (PM), Claude (tech review)

### Context

The original brief proposed running our own server with an open-weight LLM to avoid paying for tokens.

At the same time:

- the product is built by one person, part-time, with no DevOps capacity;
- the next six months are about learning (customer research, closed beta), with tens to hundreds of users, not thousands;
- the product handles private, emotional texts, so security patching, backups and access control must be reliable from day one;
- the first phase (P1) has no AI at all.

### Decision

In the current horizon we **do not run our own servers**: no VMs, GPU machines or Kubernetes.

| Need | Choice |
|---|---|
| App hosting | Managed platform: **Vercel** |
| Database, auth, storage | Managed Postgres: **Supabase**, EU region |
| LLM | Commercial API: **Anthropic**, behind a provider abstraction (`lib/ai/provider.ts`) |

### Options considered

| Option | Pros | Cons |
|---|---|---|
| **1. Managed platforms + LLM API** *(chosen)* | Zero ops; free start; preview deploy per PR; cost grows with usage; strong models on RU and EN | Vendor dependence; free-tier limits; user data processed by third parties |
| 2. Own VPS for app and database | Cheaper at scale; full control | Patching, backups, monitoring and security fall on one part-time person |
| 3. Own GPU server with an open-weight LLM | No per-token cost; data stays in our perimeter | Fixed ~$500–1,500/month + DevOps from day one; small open models are noticeably weaker in Russian and on safety tasks (crisis detection, anonymization) |
| 4. Open-weight models via hosted inference (pay per token) | No servers; cheaper models available | Quality to be proven on our evals; kept as an option behind the abstraction |

**Cost comparison** (details in [Tech Spec §6.6](TECH_SPEC.md#66-cost-estimate)):

| Monthly active users | 100 | 1,000 | 10,000 |
|---|---|---|---|
| LLM API, model mix (≈ $0.10–0.15 per user) | ~$15 | ~$150 | ~$1,500 |
| Own GPU server 24/7 | $500–1,500 + DevOps | $500–1,500 + DevOps | from $1,500 + scaling |

The API is cheaper until roughly 3,000–10,000 monthly active users.

### Consequences

**Positive**

- P0 and most of P1 cost $0; time goes into the product, not infrastructure.
- Every pull request gets a preview link, which speeds up review with users.
- AI cost is visible per user and per task (`ai_runs`) and scales with usage.

**Negative and how we handle it**

- *Vendor dependence* → standard Postgres (portable), the provider abstraction for LLMs, open export formats, no core logic tied to proprietary features.
- *Free-tier limits* (Vercel Hobby is non-commercial and runs cron at most daily; Supabase Free pauses after 7 days without activity) → frequent jobs in `pg_cron`; Supabase Pro before beta users store real entries; Vercel Pro once the project is commercial.
- *Third parties process user data* → EU region, data processing terms with providers, entry text sent to the LLM only when AI is on and only from the server, all disclosed in the privacy policy.

### Revisit when

Any of these becomes true:

1. More than **5,000 monthly active users**;
2. AI cost above **$0.30 per active user per month**;
3. A requirement that **data must not leave our perimeter** (B2B customers, data localization);
4. Managed-platform bills above **~$300/month** with a clearly cheaper equivalent.

First step at that point: run open-weight models through hosted inference (option 4) on our evals. The provider abstraction makes the switch per task.

---

<a id="adr-0002"></a>

## ADR-0002: Free stack for P0–P1 — Next.js on Vercel, Supabase Free with keep-alive and own backups

- **Status:** Accepted
- **Date:** 2026-10-27
- **Deciders:** Boris Belyavskiy (PM), Claude (tech review)

### Context

The first build step (P1a) is a private journal: Google sign-in, entries with date, time and categories, each entry visible only to its author. It should serve about 100 users.

PM constraints (PRD Q4):

- P0–P1 cost **$0** and need **no payment card** anywhere;
- the database must not "fall asleep" and must not lose user data;
- the promise "only you see your entries" must hold even if application code has a bug.

[ADR-0001](#adr-0001) already rules out own servers.

### Decision

| Need | Choice |
|---|---|
| App hosting | **Vercel Hobby**, `jaroflight.vercel.app` |
| Database and auth | **Supabase Free**, region **US East (Ohio)**: two projects, **dev** and **prod**. Vercel functions run in Cleveland (`cle1`) next to the database |
| Isolation between users | Postgres **Row Level Security** on every user table, covered by automated tests |
| Sign-in | **Google only**, through the Google Identity Services button and Supabase `signInWithIdToken`; Google Cloud project without a billing account |
| Not pausing | **Daily keep-alive** request to both projects from GitHub Actions |
| Backups | **Nightly encrypted `pg_dump`** of prod in a private repository `jar-of-light-backups`, 30-day retention, restore tests ([Tech Spec §3.1](TECH_SPEC.md#31-keep-alive-and-backups)) |

### Options considered

| Option | Pros | Cons |
|---|---|---|
| **1. Supabase Free + keep-alive + own backups** *(chosen)* | $0, no card; Postgres; RLS built in; auth for 50,000 monthly users; matches the data model and later phases (aggregates, public page) | 500 MB; pauses after 7 idle days (closed by keep-alive); no provider backups (closed by own backups) |
| 2. Supabase Pro ($25/month) | Daily backups, no pausing | Breaks the $0 goal; not needed at ~100 users |
| 3. Neon Free + Better Auth | 1 GB; 6-hour point-in-time restore; compute wakes automatically; Google dialog shows our domain | Isolation would live in application code instead of the database; more auth code to own |
| 4. Cloudflare Workers + D1 | 5 GB; 7-day automatic restore | SQLite, not Postgres; moving Next.js off Vercel; isolation in application code only |
| 5. Firebase Spark (Firestore + Auth) | Never pauses; Google sign-in built in; security rules isolate users | Not SQL: stats by category and people, K-threshold counters are harder; no backups on the free plan; strong lock-in |
| 6. A private Git repository or Google Drive as storage | Free, familiar | Not a database: no queries, write conflicts, API limits; all users' entries in one place guarded only by code; Git history keeps deleted entries forever, so account deletion cannot be honored |

Free-tier facts were checked on the providers' pricing pages on 2026-10-27; recheck before relying on them.

### Consequences

**Positive**

- The whole first step runs at $0 with no card on file.
- User isolation is enforced by the database, not only by our code.
- Postgres keeps later phases (stats, summaries, public page) straightforward and the data portable.

**Negative and how we handle it**

- *We own backups.* The workflow, the encryption key and restore tests are our job; a failed run emails the owner; the restore test is in the P1a Definition of Done.
- *Keep-alive is one more moving part.* If it fails, Supabase warns by email before pausing, and a paused project keeps its data and can be resumed.
- *Google's dialog shows `jaroflight.vercel.app`, not the app name*, until we have an own domain.
- *Google sign-in does not work on preview deployments* (no wildcard origins); sign-in is tested locally and on production.
- *Deleted data stays in encrypted backups for up to 30 days*; the privacy note says so.
- *Data is hosted in the US, not in the EU* as ADR-0001 assumed: the PM and the likely first users are in the Americas, and latency matters more than an "EU-hosted" claim at this stage. The privacy note states the location; Q9 (legal check) stays open before the public beta.
- *`jar-of-light.vercel.app` was taken*, so the app runs at `jaroflight.vercel.app`; the brand stays Jar of Light.

### Revisit when

1. The prod database passes **400 MB** (80% of the free limit);
2. We need point-in-time restore or provider-managed backups (e.g. before the public beta);
3. Keep-alive or backups fail more than once a month;
4. The project becomes commercial (Vercel Hobby is non-commercial).

First step at that point: Supabase Pro ($25/month).

---

<a id="adr-0003"></a>

## ADR-0003: App foundations for P1a

- **Status:** Accepted
- **Date:** 2026-10-27
- **Deciders:** Boris Belyavskiy (owner, by merging the first build pull request), Claude Code (lead developer)

### Context

The first build step needs three technical choices that the Tech Spec leaves open:

1. **Caching.** Next.js 16 creates new apps with *Cache Components* on. With it, every page that reads the session must stream behind a loading boundary, and data can be cached on the server per user.
2. **Language in the URL.** `next-intl` supports `/ru/app` and `/en/app` style routes or a language without a URL prefix.
3. **RLS tests in CI.** The Definition of Done asks for automated tests proving that user A cannot read or change user B's rows. Supabase's local stack needs Docker, and testing against the dev project would put database keys into CI.

### Decision

| Question | Choice |
|---|---|
| Caching | **Cache Components off.** Every page under `/app` is private and rendered per request; no personal data is cached on the server |
| Language | **No URL prefix.** The language comes from the profile (kept in a `NEXT_LOCALE` cookie), and from the browser's `Accept-Language` before sign-in. Routes stay as in Tech Spec §8 |
| RLS tests | **PGlite** (Postgres compiled to WebAssembly) runs our real migrations in memory with a small stub of Supabase's `auth` schema and roles. Tests switch to the `authenticated` role with a user id, the way Supabase does for API requests |

### Options considered

| Option | Pros | Cons |
|---|---|---|
| Cache Components on | Faster navigation later; the default Next.js direction | Every session read needs a loading boundary; easy to cache private data by mistake; more concepts for a first build step |
| `/ru/…` and `/en/…` routes | Shareable links in a fixed language; good for SEO | Nothing in P1a is public except the landing and `/privacy`; the language is a profile setting, so URLs would duplicate it |
| Supabase CLI + Docker for tests | The exact Supabase stack | Docker is not installed; heavy for CI on every pull request |
| Tests against the dev project | Real Supabase | Needs the secret key in CI; tests leave data behind; slower and flaky |

### Consequences

- Pages under `/app` render on each request. At P1a scale (one query per page, ~100 users) this is fast enough.
- The landing page shows the browser's language; after sign-in the profile's language wins.
- RLS tests run in about a second on every pull request with no secrets. The stub covers only `auth.users` and `auth.uid()`; other Supabase features (storage, realtime) need their own tests when we use them.
- Migrations are applied to the dev and prod projects by hand in the SQL editor until we add the Supabase CLI.

### Revisit when

1. Next.js makes Cache Components mandatory (announced for the next major version);
2. A public page needs fixed-language URLs (P4);
3. A migration uses Supabase features the PGlite stub cannot imitate.

---

<a id="adr-0004"></a>

## ADR-0004: UX principles — one experience on web and mobile, one shell

- **Status:** Accepted
- **Date:** 2026-10-31
- **Deciders:** Boris Belyavskiy (owner), Claude Code (lead developer)

### Context

After the first round of feedback on the live app, screens had drifted apart: the header lost its tabs on public pages, the "+" lived only on the feed, links to About and Privacy sat in different places, and the content column moved between the wide feed and the narrow forms. Phones and wide screens also offered different actions.

### Decision

1. **Omnichannel: the same features on web and mobile.** Every action is available on a phone and on a wide screen. Layout may adapt (icons instead of labels, a chip row instead of a side menu), but no feature exists on only one of them. When the app later ships as a PWA or a native app, it keeps the same functions.
2. **One shell, the content always in the same place.** Every screen, signed in or not, uses the same frame:
   - a header with the Jar of Light logo and the language switch — signed in, also the tabs (Journal, Categories, Settings, About) and sign-out; signed out, the logo leads to About;
   - one page layout (`components/page-layout.tsx`): an optional side column on the left (the feed filters) and the main text column, which starts at the same place on the journal, Settings, About and every other page;
   - the same footer links (About · Privacy) at the bottom of every screen;
   - signed in, the "+" for a new entry in the bottom-right corner of every page.

### Options considered

- **A separate mobile layout with its own navigation** (bottom tab bar on phones, top on desktop) — rejected for now: two navigation patterns to build and test, and features drift apart.
- **Each page picks its own width** — rejected: the text jumps when moving between tabs.

### Consequences

- A new page uses `PageLayout` inside the app or public shell; it does not set its own outer width.
- On phones the tabs show icons only, so their labels must stay available to screen readers.
- Reviews of new UI check both a phone width (375 px) and a desktop width.

### Revisit when

1. Usability tests in the closed beta show phone users miss a bottom tab bar;
2. A screen needs a full-width layout (for example, the jar visualization).

---

<a id="adr-0005"></a>

## ADR-0005: A fixed frame; entries open in place

- **Status:** Accepted
- **Date:** 2026-11-01
- **Deciders:** Boris Belyavskiy (owner), Claude Code (lead developer)

Builds on [ADR-0004](#adr-0004); does not replace it.

### Context

With ADR-0004 live, the page still scrolled as a whole: the title, the composer, the filters and the footer links slid away with the entries. Writing, opening and editing an entry also went to separate pages, so the composer did not feel like the place where writing happens.

### Decision

1. **A fixed frame.** The screen never scrolls as a whole. The header, the page head (title; on the feed also the composer), the side column (feed filters) and the footer links stay in place; only the main column below the head scrolls — entries in the feed, the text on About, Privacy, Settings and Categories. On phones the feed filters fold under their title so the entries keep most of the screen.
2. **Entries open in place.** The composer expands into the entry card in the main column; tapping an entry opens it there like a note; "Edit" in the entry's "⋯" menu turns the same card into the form. Header, filters and footer stay. Each state has its own address — `/app?new=1`, `/app?entry=<id>`, `/app?entry=<id>&edit=1`, keeping the filter — so the back button, reloads and links work, and the pages render on the server without client-side state.
3. **Date and time as a pill.** An entry's date and time sit in a pill at the top of the card, styled like the Google sign-in button; while writing, the pill opens a small window with a calendar and the time.

### Options considered

- **A modal dialog over the feed** for new and opened entries — rejected: it covers the filters and the shell, against ADR-0004, and needs its own scroll and focus handling.
- **Client-only state** for the open entry — rejected: the back button would leave the app instead of closing the entry, and a reload would lose it.

### Consequences

- The old `/app/entry/new` and `/app/entry/[id]` routes only redirect.
- Server actions return to a path inside the feed (`safeFeedPath`), never to an address from outside.
- Long content in the side column scrolls on its own.

### Revisit when

1. Beta users on phones find the folded filters hard to discover;
2. AI suggestions or actions on an entry need more room than the main column gives.

---

<a id="adr-0006"></a>

## ADR-0006: Full-width pages, the window's scrollbar, an opened entry as a window

- **Status:** Accepted
- **Date:** 2026-11-01
- **Deciders:** Boris Belyavskiy (owner), Claude Code (lead developer)

Refines [ADR-0004](#adr-0004) (where the content sits) and [ADR-0005](#adr-0005) (how scrolling works and how an entry opens). Both stay in force where this record does not change them.

### Context

ADR-0005 scrolled an inner column, so its scrollbar sat next to the text and appeared whenever the column's bottom padding pushed it over. Pages other than the feed used a narrow column in the middle, which looked unaligned with the logo and the footer links. An entry opened in place was as narrow as the feed.

### Decision

1. **The window scrolls.** Its own scrollbar on the right appears only when the content does not fit. The header, the page head (title; on the feed also the composer and, on phones, the folded filters), the feed's side column and the footer links stick in place, so only the content moves — the effect of ADR-0005 without an inner scroll box.
2. **Widths.** Every page except the feed uses the full width of the frame: from the left edge of the logo (and of "About" in the footer) to the right edge of sign-out. On the feed the filters start at that same left edge and the entries keep a reading column (42rem).
3. **An opened entry is a window over the feed**, as wide as the frame, between the header and the footer. A click outside it, Escape or ✕ close it and return to the same place in the feed; "Edit" turns the window into the form. A new entry still expands in place from the composer (ADR-0005).
4. **The landing page** is left-aligned across the full width; text outside the cards starts where the cards' bullets start.

### Consequences

- Sticky positions assume the header is 3.5rem high and the footer about 3rem; changing either means updating `PageLayout` and the entry window.
- Long lines on wide screens for About and Privacy are accepted for alignment.

### Revisit when

1. Reading tests show full-width text on About is hard to read on large monitors;
2. The header or footer height changes.

---

<a id="adr-0007"></a>

## ADR-0007: The dashboard opens in place; stars are favorites in the filter

- **Status:** Accepted
- **Date:** 2026-11-02
- **Deciders:** Boris Belyavskiy (owner), Claude Code (lead developer)

### Context

The solo app assignment for MBA 296 requires stars and a dashboard. Neither was in the P1b plan in this form, and the PRD has no stars at all.

### Decision

1. **The dashboard opens in place,** in the feed's column at `/app?stats=1`, as ADR-0005 asks. The filters stay on the left and apply to it. The period is whatever dates the user set in the filter.
2. **A "Statistics" button is always visible** under the filters; only the list of categories gives way when space runs out, and it scrolls on its own.
3. **Stars are private favorites:** one `stars` junction table, a star beside the "⋯" menu, and a "Favorites" row in the category filter. Favorites combined with categories means "both".
4. **The chart by category double-counts on purpose.** An entry with several categories counts in each, and the page says so.

### Consequences

- The feed reads `stars`, so this migration had to reach production before the code.
- Search words and other filters travel in the URL, so they can reach Vercel's request logs. To revisit before the public beta.

### Revisit when

1. Brightness (ENT-01) arrives and overlaps with stars;
2. Statistics by category lose meaning because users rename built-in categories far from their original sense.

---

<a id="adr-0008"></a>

## ADR-0008: One frame for every edge, one set of fonts

- **Status:** Accepted
- **Date:** 2026-11-02
- **Deciders:** Boris Belyavskiy (owner), Claude Code (lead developer)

Refines [ADR-0004](#adr-0004) and [ADR-0006](#adr-0006): the feed is no longer a narrower reading column.

### Context

Edges were close but not equal: padding inside the logo's drawing and the sign-out button, and a 42rem limit on the feed, put them a few pixels apart. Text came in several sizes and fonts for the same job.

### Decision

1. **One frame.** The visible left edge of the logo, the filters and the footer share one line. The visible right edge of "Sign out" and of every entry and card shares another. Measure visible edges, not the boxes around them.
2. **One baseline.** A page title and the first line of the side column share a baseline.
3. **Three kinds of text:** titles in Source Serif 4 (24 px for a page, 20 px for a section); main text in Source Serif 4, 17 px, justified, with the `reading` class; controls in Inter, 12 px in the filter (`SMALL_BUTTON` and friends in `feed-filters.tsx`).
4. **Justified main text:** entries, About and Privacy. Titles, labels, buttons and short lists stay left-aligned.

### Consequences

- Lines are long on wide screens, by the owner's choice.
- Justified text can show wide gaps on phones; `hyphens: auto` softens this where the browser has a dictionary for the interface language.

### Revisit when

1. Reading tests show the long lines or the gaps on phones get in the way.

---

<a id="adr-0009"></a>

## ADR-0009: The screen before sign-in is a narrow column in the center

- **Status:** Accepted
- **Date:** 2026-11-02
- **Deciders:** Boris Belyavskiy (owner), Claude Code (lead developer)

Replaces point 4 of [ADR-0006](#adr-0006) and is the one exception to the frame in [ADR-0008](#adr-0008): the header and footer stay on the frame, the content does not.

### Context

Across the full width, the screen before sign-in had one short line of text in each very wide card.

### Decision

The content is a centered column of 32rem, wide enough for each point to fit on one line in both languages. Everything in it is centered: the logo on its blue circle, the title, the sign-in button, the hint and the points. The one exception is the main text, which stays justified. Phones use the full width.

### Revisit when

1. A longer point no longer fits on one line.

---

<a id="adr-0010"></a>

## ADR-0010: English comes first; points before sign-in are left-aligned

- **Status:** Accepted
- **Date:** 2026-11-02
- **Deciders:** Boris Belyavskiy (owner), Claude Code (lead developer)

Refines [ADR-0009](#adr-0009).

### Decision

1. **English comes first wherever both languages are listed:** the language switch, Settings, the category name fields and the copy.
2. **The points on the screen before sign-in are left-aligned inside their cards.** The cards stay where they are, in the centered column.

### Consequences

- English also stays the fallback language, as before; a Russian-language browser still opens the app in Russian.
- When renaming a category, the cursor now starts in the English field. Cyrillic typed there still moves to the Russian field.

---

<a id="adr-0011"></a>

## ADR-0011: Journal content is encrypted on the user's device

- **Status:** Accepted, not built yet (Horizon 1 in the [Roadmap](ROADMAP.md#horizon-1--end-to-end-encryption))
- **Date:** 2026-11-08
- **Deciders:** Boris Belyavskiy (owner), Claude Code (lead developer)

Reverses the "no end-to-end encryption" line of PRD §9 and [Tech Spec §5.5](TECH_SPEC.md#55-data-protection). Design details: [Tech Spec §5.6](TECH_SPEC.md#56-end-to-end-encryption).

### Context

Row Level Security separates users from each other. It does not limit the operator: the owner of the Supabase project has the `postgres` role and the secret key, and holds the private key of the backups. So today the promise is "the operator does not read entries", not "cannot".

The owner wants the second promise: what users write must be unavailable to the owner, while profiles and activity stay visible.

The moment is cheap: production holds little data so far, and every new user adds data that would have to be moved later.

### Decision

1. **Content is encrypted on the device before it leaves, and the key never reaches the server.** Each user has one random data key.
2. **A diary password and a recovery code protect that key.** The diary password is separate from any sign-in password, because a sign-in password is sent to Supabase and Google users have none. The app asks for it once per device, not at every visit. Short PINs are not allowed: the wrapped key is in the database, so a weak secret could be guessed offline.
3. **The operator still sees profiles and activity:** email, display name, language, time zone, sign-up and sign-in dates, when entries were created and changed, how many there are.
4. **Encrypted:** entry text and everything else the user writes, including the names of own categories and renames of built-in ones. Entry date and time, links to categories and stars stay open, so filters keep working simply.
5. **Default rule for new columns:** any field written by the user or describing their life is encrypted unless a later record says otherwise.
6. **AI works by consent, only while the app is open.** The device decrypts the text and sends it to our server function, which calls the model and stores nothing. The result is encrypted on the device before saving. AI is off by default. Nothing runs in the background on entry text.
7. **Publishing stays possible.** Posting to the public page or creating a thank-you card is a deliberate disclosure by the author; that copy is stored readable, as designed.
8. **Existing users move on the device, with a safety check before anything is erased** ([Tech Spec §5.6](TECH_SPEC.md#56-end-to-end-encryption)). The setup screen is required at the next sign-in, so the app has no permanent mixed mode. Accounts that never come back keep their data as it is; nothing is deleted.
9. **Built in small pull requests, and before the second horizon** ([ADR-0012](#adr-0012)). Encryption is the only one of the two projects that can lose data, so it ships alone. Erasing plaintext is its own pull request, first on the owner's account.

### Options considered

| Option | Pros | Cons |
|---|---|---|
| **1. Encrypted on the device** *(chosen)* | The only option where the operator technically cannot read content; leaks of the database and backups expose no text | Lost password and code mean lost entries; no background AI; search and summaries move to the device; the largest amount of work |
| 2. Encrypted on the server, key in Vercel | Protects against a look in the dashboard and against database leaks; AI and search keep working; little work | The operator can still read, by deliberately using the key |
| 3. Encryption inside the database (`pgcrypto`, Vault) | Very little work | The key is available to the same owner, so the goal is not met |
| 4. Keep RLS and the promise not to read | No work | The goal is not met |

### Consequences

**Positive**

- "We cannot read your entries" becomes true for encrypted accounts, once the old backups expire.
- New accounts are encrypted from their first entry.
- Backups stop holding readable text.

**Negative and how we handle it**

- *Losing both the password and the code loses the entries for good.* Setup says so plainly and requires typing the code back.
- *The operator ships the web code,* so a malicious release could steal keys. The honest promise is "cannot read without deliberately changing the code, and the code is public". Cross-site scripting would have the same effect, so a Content Security Policy is required before the feature ships; the app has none today.
- *Text passes through our server and the model provider during an AI request.* The privacy note must say so.
- *Metadata stays visible,* and ciphertext size hints at text length. The privacy note must say so.
- *Plaintext stays in old backups for up to 30 days after the move.* This is also the safety net; the promise is complete only after that.

**Effects on other decisions**

| Area | Effect |
|---|---|
| Search, filter `q`, statistics with `q` (ENT-04) | Move to the device, which must load all of a user's ciphertext; the feed's 200-row limit no longer bounds search |
| Validation (ENT-01, CAT-02) | Length rules run on the device; the database can only bound ciphertext size |
| Server rendering | Server components still fetch rows; client components decrypt them, with a locked state when the device has no key |
| Guided entries, people, places (ENT-02, CUM-02) | Labels are encrypted; autocomplete and "top people and places" run on the device |
| Open the jar, brightness (CUM-01) | Brightness is encrypted under the default rule; the weighted draw runs on the device |
| Local drafts (ENT-01, ACC-02) | Kept encrypted on the device once a key exists |
| Export (DATA-01) | Runs on the device |
| Account deletion (DATA-02) | Unchanged; the key row goes with the cascade |
| Parsing, T1 (AI-01) | Started by the app when saving, not by `after()`; failed runs retry when the app is next open, not by `pg_cron` |
| Summaries and digest, T6 (CUM-03, CUM-04) | Aggregates are computed on the device; the digest is prepared when the app opens; email can say only that it is ready; the Batch API discount is lost |
| Crisis signal (AI-04) | Works only with AI on, which is now off by default. Open question Q21 |
| Thank-you cards, public posts (P3, P4) | Readable by design after the author's action; drafts and notes stay encrypted |
| Analytics (§12) | Properties derived from content (`has_people`, `has_place`, `length_bucket`) are dropped |
| Errors (Sentry) | Must never receive keys or decrypted text |
| Backups | `user_keys` is added to `COUNTS_SQL`; without it a restored database cannot be decrypted |
| [ADR-0002](#adr-0002), [ADR-0003](#adr-0003) | RLS and its tests stay and extend to the new table; encryption adds to them |
| [ADR-0004](#adr-0004) | Setup and unlock screens are the same on web and mobile, inside the shell |

### Revisit when

1. Unlocking with a passkey works on most users' devices: it could replace or join the diary password;
2. Users ask for background AI: it needs a separate consent and giving the server that user's key, so effectively a second architecture;
3. Store apps come back on the table: a bundled client would also stop code being swapped by an ordinary deployment;
4. Lockouts become a common support problem.

---

<a id="adr-0012"></a>

## ADR-0012: An own domain, and email and password alongside Google

- **Status:** Accepted, not built yet (Horizon 2 in the [Roadmap](ROADMAP.md#horizon-2--own-domain-and-email-and-password))
- **Date:** 2026-11-08
- **Deciders:** Boris Belyavskiy (owner), Claude Code (lead developer)

Allows one exception to the $0 rule of [ADR-0002](#adr-0002) and PRD Q4: the yearly cost of a domain. Everything else in that record stands. Changes PRD Q17. Comes after [ADR-0011](#adr-0011).

### Context

Sign-in is Google only. The owner wants people to sign in with any email and a password, with Google still available, and without existing users losing anything. On 2026-11-08 every account in production came through Google, with a confirmed email and no password.

Passwords need email: to prove the address belongs to the person and to reset a forgotten password. Supabase's built-in sender delivers only to the project's team, 2 messages an hour. Receiving servers check that a sender may use an address, through DNS records of the domain, and the DNS of `jaroflight.vercel.app` belongs to Vercel.

### Decision

1. **Buy an own domain and move the site to it.** Email goes through **Resend**, connected to Supabase as custom SMTP.
2. **Email and password join Google on the same account.** Data belongs to `user_id`, not to a way of signing in, so a new way of signing in touches no data.
3. **One sign-up flow for everyone: email and password, then a 6-digit code from the email.** If the email is new, the code confirms a new account. If it already has an account, the code proves ownership and the password is added to that account, so the person can then use both Google and the password. The screens and responses are identical, so the form does not reveal who is registered.
4. **No password is ever attached without that code.** Otherwise anyone could type another person's email with their own password and take over the account.
5. **The password stays in the form on screen until the code is confirmed,** and is not saved anywhere meanwhile.
6. **A forgotten sign-in password never affects the diary.** The diary key is independent of sign-in. The UI names them differently: "sign-in password" and "diary password".

### Options considered

| Option | Pros | Cons |
|---|---|---|
| **1. Own domain + Resend** *(chosen)* | Letters come from the product's address; the domain also becomes the site's address | About $10–15 a year and a payment card; DNS setup |
| 2. A separate Gmail with an app password | $0, no card, no domain, 500 messages a day | A `@gmail.com` sender; Google does not recommend app passwords |
| 3. Sign-up refuses an existing email | Simple | A person has to find another path to add a password |
| 4. Attach the password with no confirmation | One step less | Account takeover |
| 5. Turn email confirmation off | No email service needed | No password reset; anyone can claim someone else's address |
| 6. One-time codes instead of passwords (earlier PRD plan) | No passwords to remember | The owner asked for a login and password; it needs the same domain and email service |

### Consequences

**Positive**

- People without Google can use the app; existing users keep their accounts and can add a password.
- Sign-in works on preview deployments, which Google sign-in does not.
- The domain also opens reminder emails, and shows the site's own name in Google's dialog.

**Negative and how we handle it**

- *Moving the site after encryption means every device asks for the diary password once,* because browser storage belongs to one web address. Users are warned first and reminded of their recovery code, and the old address redirects to the new one. Moving the site before encryption would avoid this, since moving it does not depend on encryption code; the owner chose to keep the domain after encryption.
- *Signing up with a different email creates a new empty account.* Supabase cannot tell it is the same person, and accounts encrypted with different keys are hard to merge later. A clear line above the form sends existing users to Google or to email change in Settings.
- *Leaked-password checking needs Supabase Pro,* so we rely on a minimum length of 8.
- *Supabase's `signUp` on an existing address returns a disguised success and sends nothing.* So the server decides first whether the email exists, through a function reachable only with the secret key.
- *The move needs configuration in several places:* Vercel domain and redirect, Google allowed origins and consent screen, Supabase Site URL and redirect URLs. Sessions are per address, so people sign in again once.

### To confirm on the dev project before building on it

1. Google sign-in still reaches the same account after the user changes their email.
2. The full flow for a Google-only account: code, password added, both ways of signing in work.
3. Whether Supabase rate limits per IP affect sign-ups, since the requests come from our server.
4. Whether changing the domain on Google's consent screen triggers Google verification.

Facts from provider documentation were checked on 2026-11-08; recheck before relying on them.

### Revisit when

1. Email volume nears Resend's free limits (100 a day, 3,000 a month);
2. Sign-up abuse appears: add a CAPTCHA, which Supabase supports.

---

## Template for a new record

```markdown
## ADR-NNNN: Title

- **Status:** Proposed | Accepted | Superseded by ADR-XXXX
- **Date:** YYYY-MM-DD
- **Deciders:** …

### Context
### Decision
### Options considered
### Consequences
### Revisit when
```
