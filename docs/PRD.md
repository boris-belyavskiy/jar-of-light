# PRD — Jar of Light

> **Status:** Draft v0.3 · **Updated:** 2026-10-27 · **Owner (PM):** Boris Belyavskiy · **Tech review:** Claude (lead dev)
> **Built from:** Plan v0.1 (2026-10-16), PM notes on audience, JTBD and features (2026-10-19) and the PM's decisions on the first build step (2026-10-27).
> **Related:** [Tech Spec](TECH_SPEC.md) · [Roadmap](ROADMAP.md) · [Decisions](DECISIONS.md)

**Priorities:** `Must` blocks the release · `Should` is important · `Could` is nice to have · `Later` is out of the current horizon.
**Phases** (see [Roadmap](ROADMAP.md)): **P0** foundation · **P1** private journal without AI + customer research (**P1a** minimal journal, the first build step; **P1b** the rest of the journal and the closed beta) · **P2** AI layer · **P3** gratitude → action · **P4** public page · **P5** "Who is grateful to me?"

---

## Contents

1. [Summary](#1-summary)
2. [Problem](#2-problem)
3. [Target audience](#3-target-audience)
4. [Jobs to be done](#4-jobs-to-be-done)
5. [Positioning](#5-positioning)
6. [Product principles](#6-product-principles)
7. [Requirements](#7-requirements)
8. [Success metrics](#8-success-metrics)
9. [Non-goals](#9-non-goals)
10. [Product risks](#10-product-risks)
11. [Open questions](#11-open-questions)
12. [Glossary](#12-glossary)
13. [Appendix](#13-appendix)

---

## 1. Summary

**One-liner.** Jar of Light is a gratitude platform that builds trust in life and a sense of happiness, and draws people into relationships: first with the people close to them, then with the wider world.

**What it is.** A private journal for gratitude and bright moments. AI helps you notice the good, see who made it possible, and give thanks back: in person, with a private thank-you card, or publicly, on a shared page that shows who people are grateful to and why.

**What makes it different.** Gratitude journals stay private. Jar of Light adds the other direction: anyone can see who is grateful to their profession, organization or work. This is both the differentiator and the growth loop ("Look how many people thanked nurses this month"). *To be confirmed by the competitor review in P1.*

---

## 2. Problem

People who care about their well-being, and people who feel lonely or anxious, tend to keep a negative "mental ledger": bad things stay vivid, good things fade. Gratitude practices help (see [Appendix 13.1](#131-research-basis)), but in practice:

| # | Problem | Hypothesis | How we test it |
|---|---|---|---|
| H1 | People start a gratitude practice and drop it after 1–2 weeks | Entries in under 30 seconds, gentle reminders and regular "returning light" (Open the jar, digests) keep the practice going | W4 retention ≥ 20% in beta |
| H2 | Gratitude stays in one's head and never reaches the person | A ready draft and a delivery channel raise the share of thanks that actually get said | Action rate ≥ 10% of gratitude entries |
| H3 | People rarely see the concrete people and organizations behind the good things in their life | Recording "who made it possible" and seeing it summarized increases the sense of connection | Monthly pulse item "I feel connected to people" trends up (§8.3) |
| H4 | Many professions rarely hear thanks, and it matters to them | A public page of thanks to a profession creates emotion and gets shared | Visitor → sign-up ≥ 3%; share rate |
| H5 | People will share gratitude publicly if it is safe | Clear visibility levels, anonymization and preview lead to ≥ 15% of entries shared | Share rate; reports < 1% |

---

## 3. Target audience

### 3.1 Primary segments

| Segment | Who | What they look for | Product implications |
|---|---|---|---|
| **S1. Self-optimizers** | People investing in self-improvement, productivity and mental health. Already try habit trackers, journaling, self-help content | A practice with a visible effect, structure, insights about themselves | Guided entries, summaries and insights matter; benchmark against Day One and The Five Minute Journal |
| **S2. Seeking ground** | People who feel lonely, dissatisfied with their life or anxious about the future | Feeling resourced and connected, a low-effort start, warmth | Potentially vulnerable users. The product is **not therapy**: crisis safety is a `Must`, the tone never blames, no streak pressure |

Which segment is the beachhead is an open question (Q16) to settle after the interviews.

### 3.2 Secondary: recipients of gratitude

| Who | Job | Role in the product |
|---|---|---|
| People who receive a thank-you card | "When someone thanks me, I want to keep it and maybe thank back" | Growth via cards (P3) |
| "Invisible professionals": nurses, teachers, couriers, social workers, open-source maintainers | "When I doubt my work matters, I want to see that people are grateful to my profession" | Visitors of the public page, entry point for growth (P4–P5) |
| Organizations (Later) | "We want to see the thanks we receive and show them to the team" | Monetization hypothesis ([13.3](#133-monetization-hypotheses-not-in-scope)) |

### 3.3 Behavioral markers

Markers are proxies for recruiting interviewees, testing messages and, later, acquisition. They are hypotheses to validate in P1 research.

| Marker | Examples | Mostly signals |
|---|---|---|
| Active in Reddit communities on self-improvement, overcoming anxiety, loneliness | Self-improvement, anxiety and loneliness subreddits | S1, S2 |
| Watch psychologists and coaches on TikTok and YouTube | Ekaterina Sokalskaya (RU), Michael Hunter (EN) | S1, S2 |
| Visit therapist marketplaces | B17, Zigmund.Online (RU); US analogs such as the Psychology Today directory, BetterHelp, Talkspace | S2, mental-health-aware S1 |

---

## 4. Jobs to be done

The four jobs form a **ladder**. Each step widens the circle: notice the good → own it as a resource → see the people behind it → give thanks back. This matches the one-liner ("first close ones, then the world") and maps directly onto the product layers and phases.

| # | Job: *When… I want to… so that…* | What the user feels | Product answer | Phase |
|---|---|---|---|---|
| **J1. Notice** | When my days blur into stress and to-dos, I want to notice and keep the bright moments, so that my mental ledger of life tips toward the good | "There is more good in my life than I thought" | Fast free-form and guided entries, prompts, reminders, Open the jar | P1 |
| **J2. Own** | When I feel I lack resources or options, I want to see the concrete good things my life already has, so that I feel I have something to stand on | A sense of resources and possibilities | Simple stats (P1), AI summaries by period, place, topic and people (P2) | P1 → P2 |
| **J3. Connect** | When I am grateful for something, I want to see the specific people, professions and companies who made it possible, so that I feel part of a web of relationships, not alone | Connection, less loneliness | "Who made it possible" field in guided entries, AI extraction of people and organizations, "people of my life" view | P1 → P2 |
| **J4. Give back** | When I realize someone made my life better, I want to return the thanks, personally or in public, so that I feel needed and able to make a difference | Agency, being needed | Thank-you cards via private link (written alone or with AI), sharing to the public page | P3 → P4 |

**Recipient job.** **J5. Be seen:** when I doubt that my work matters, I want to see that people are grateful to my profession or organization, so that I keep going. → Public page and profile search (P4–P5).

**Research grounding.** J1 corresponds to the *Three Good Things* exercise, J4 to the *Gratitude Visit / Letter* ([13.1](#131-research-basis)).

---

## 5. Positioning

**Name.** **Jar of Light** (RU: «Банка света»). Each entry is a small light you put into the jar; on a dark day you open the jar. The name is also the signature feature (CUM-01).

**Positioning statement.** For people who invest in their well-being, and for those who feel lonely or anxious about the future, Jar of Light is a gratitude journal that helps you notice the good, see who makes it possible and give thanks back. Unlike private gratitude apps, it connects your gratitude to real people and to a public map of who the world is thankful to.

**Tone of voice.** Warm, calm, simple. Second person, short sentences. No guilt, no hype, no promises of happiness: we offer a practice, not a cure.

**Visual identity.** Light blue and warm beige, with golden "light" accents: option A "Morning sky", chosen on 2026-10-27 out of three ([options](design/palettes/)). Details: [Tech Spec §9](TECH_SPEC.md#9-visual-design).

---

## 6. Product principles

1. **Private by default.** A new entry is visible only to its author. Any publication is a deliberate action with a preview.
2. **AI suggests, people decide.** No category, publication or message happens without confirmation.
3. **Fast.** An entry takes less than 30 seconds on a phone.
4. **No guilt.** No "streak broken!". Gentle counters such as "days with light this month".
5. **Not therapy.** The product does not replace a psychologist and says so. Signs of crisis → a caring message and help contacts.
6. **Honest data.** Public numbers are real. Demo content is always labeled.
7. **Works without AI.** Every core flow has a manual path; AI makes it easier, not possible.

---

## 7. Requirements

Format: **ID — requirement** *(priority, phase)*. Acceptance criteria (AC) for key items.

**First build step (P1a), decided 2026-10-27:** sign in with Google · profile (name, time zone, language) · entries with text, date and time, and several categories · edit and delete · feed with a category filter · own categories · account deletion · privacy note. Every entry is visible only to its author. RU + EN. Everything else in P1 comes in P1b.
PM's feature list (2026-10-19) maps as: F1 → ENT-01 · F2 → ENT-02 · F3 → CUM-02/03 · F4 → ACT/CARD · F5 → PUB · F6 → COM-01 · F7 → ID-01.

### 7.1 Account and onboarding

- **ACC-01** — Sign in with **Google**. Anyone with a Google account can sign up. No passwords. *(Must, P1a)*
  - Email sign-in (one-time code) comes later: it needs an own domain and an email service. *(Should, P1b)*
- **ACC-02** — The first entry can be written **before sign-up**: the draft is kept locally and moved into the account after sign-in. *(Should, P1b)*
- **ACC-03** — Three-screen onboarding: language and time zone (auto-detected), reminder schedule, AI consent with a plain explanation. *(Must, P1b without the AI step; AI step in P2)*
- **ACC-04** — Profile: display name (from Google, editable), time zone (auto-detected from the browser, editable), interface language RU / EN. *(Must, P1a)* Pseudonym. *(Must, P4)*
  - **AC:** "today" and the default entry time follow the user's time zone, not the server's.

### 7.2 Entries

- **ENT-01 Free-form entry (F1)** — One text field (**1–4,000 characters**), **date and time** (now by default, in the user's time zone; past allowed, future not), one or more categories. *(Must, P1a)*
  - **AC:** from an open app an entry takes ≤ 3 actions; a character counter shows the limit; an entry is visible only to its author.
  - Later, in P1b: optional "to whom / to what" and brightness 1–5; if "to whom" is filled the entry is a **gratitude**, otherwise a **bright moment** (user can override); optimistic saving and a local draft that survives a lost connection.
- **ENT-02 Guided entry (F2)** — A template with optional fields: **What happened** · **Who was there** · **When** · **Where** · **Who made it possible / whom I thank** · *Why it matters* (optional). Only "What happened" is required. The user can switch between free-form and guided without losing text. *(Must, P1b)*
  - **AC:** guided fields are stored as structured data (people and places as separate records, not concatenated text) so that P1 stats work without AI; "who" and "where" fields autocomplete from the user's earlier entries.
- **ENT-03** — Prompts against the blank page, rotating ("Who made your day easier today?", "What small moment do you want to remember?"). *(Should, P1b)*
- **ENT-04** — Feed of entries, newest first by entry date and time, with a **filter by category**. *(Must, P1a)* Grouping by day, other sorts, filters by kind, person, place and brightness, full-text search. *(Must, P1b)*
- **ENT-05** — Edit and delete; deleting asks for confirmation and is immediate (no trash). *(Must, P1a)* Deleting a published entry removes it from the public page (§7.8). *(Must, P4)*
- **ENT-06** — Voice input via the keyboard's system dictation (free, no extra work). Own audio transcription and photos — *Later*.

### 7.3 Categories

- **CAT-01** — System categories are on by default. Starter set: **Family · Friends · Work · Study · Health · Chance encounter** (RU: Семья · Друзья · Работа · Учёба · Здоровье · Случайная встреча). System categories can be hidden, but not renamed or deleted. An entry can have **several** categories. *(Must, P1a)*
- **CAT-02** — Custom categories: create, rename, delete. *(Must, P1a)* Color, icon, order. *(Should, P1b)*
  - **AC:** deleting a custom category removes it from entries but never deletes the entries.
- **CAT-03** — AI suggests 1–3 categories after saving; the user accepts with one tap or edits. AI may propose a **new** category. *(Must, P2)*
  - **AC:** accepted and rejected suggestions are logged (quality metric); a rejected suggestion is not shown again for that entry.

### 7.4 Habit and reminders

- **HAB-01** — Reminder schedule: time and frequency (daily / 3× a week / weekly; default 3× a week in the evening). *(Must, P1b)*
- **HAB-02** — Channels: web push (on iOS after the PWA is added to the home screen) and email. *(Must, P1b)* Telegram bot — *Later*.
- **HAB-03** — Reminder texts rotate and contain a prompt; tapping opens the composer. *(Should, P1b)*
- **HAB-04** — Gentle counter "days with light this month", no resettable streak. *(Should, P1b)*

### 7.5 Looking back (the cumulative effect)

**Cumulative effect** means: (a) for the user, past entries regularly come back and add up to a visible picture; (b) for the community, thanks to addressees accumulate on the public page.

- **CUM-01 Open the jar** — The "I need some light" button shows a random past entry (weighted by brightness); the user can keep drawing. *(Must, P1b)*
- **CUM-02 Simple stats (no AI)** — Entries per week, top people, top places, top categories, built from guided fields and categories. *(Should, P1b)*
- **CUM-03 AI summaries (F3)** — Summaries by **period** (week, month, year), **place**, **topic** and **people**: "October: 23 bright moments, most often with Anna and in the park; you thanked doctors three times." Works for free-form entries too, thanks to AI extraction. *(Must, P2)*
- **CUM-04 Weekly digest** — In-app and email: count, top categories and people, 1–2 bright entries, an AI summary and one gentle reflection question. *(Should, P2)*
- **CUM-05 On this day** — Entries from a month, six months and a year ago. *(Should, P2)*
- **CUM-06 The jar visualization** — The jar fills with lights: one light per entry, color by category. Clickable prototype tested with 5 users in P2; full build *Later*. *(Could)*
- **CUM-07 Book of the year** — Export a year of gratitude as a beautiful PDF. *(Later)*

### 7.6 AI understanding of entries

- **AI-01** — After saving, an entry is parsed asynchronously: kind, people and organizations (with type), places, generalization ladder, categories, personal data flag, crisis signal. *(Must, P2)*
- **AI-02** — The UI shows that AI is working; results appear as **suggestions**, not changes. *(Must, P2)*
- **AI-03** — AI can be switched off globally and per entry. Then the entry is never sent to the LLM provider. *(Must, P2)*
- **AI-04** — On a crisis signal (self-harm, violence) the app shows a caring message and help-line contacts for the user's locale. AI does not "counsel". *(Must, P2)*

### 7.7 Gratitude → action and thank-you cards (F4)

- **ACT-01** — A gratitude entry has a "Turn into action" button. The user can write the message alone, or ask AI for 1–3 action ideas suited to the addressee type and a draft in the user's tone and language. *(Must, P3)*

| Addressee type | Example actions |
|---|---|
| Close person | Message or letter, call, say it in person, a small gesture |
| Specialist, role | Thank their manager or organization, a public post |
| Organization, place | Review on maps or website, recommend to a friend |
| Author, work, discovery | Write to the author, rate or review, support by buying or donating |
| Strangers, society, nature | Pay it forward: a good deed, volunteering, a donation |
| Myself | A note to self, a small reward |

- **ACT-02** — Channels: copy, system share sheet (Web Share API), `mailto:`, link to a review page, **thank-you card**. The user always sends it themselves. *(Must, P3)*
- **ACT-03** — Statuses: suggested → opened → done / dismissed. After "done", an optional note "How did they react?" (which is also a bright moment). *(Should, P3)*
- **CARD-01** — The author creates a card from an entry: message (editable), how to address the recipient, whether to show the author's name. Result: a secret link that cannot be guessed and is not indexed. *(Must, P3)*
- **CARD-02** — The recipient opens the link without signing up and sees a beautiful card. They can save it to "Thanks I received" (sign-up required) — a growth point. *(Should, P3)*
- **CARD-03** — The author can revoke a card and sees whether it was opened (no data about the recipient). *(Should, P3)*

### 7.8 Sharing to the public page (F5)

Every entry has a **visibility level**. The PM's three public options are levels L2–L4; L1 is a proposed low-risk addition (Q15).

| Level | Name | What others see | Author shown |
|---|---|---|---|
| **L0** | Only me *(default)* | Nothing | — |
| **L1** | Count only *(proposed)* | +1 to the addressee's counter, no text | No |
| **L2** | Anonymized text | An AI-anonymized version of the text, reviewed by the author | No |
| **L3** | Full text, anonymous | The author's own text | No |
| **L4** | Full text, signed | The author's own text | Display name or pseudonym (author's choice) |

- **PUB-01** — Each entry has a level, default L0; the default can be changed in settings. *(Must, P4)*
- **PUB-02** — For L1–L4 the user chooses where on the **generalization ladder** the addressee is shown ("Dr. Petrova at Clinic 5" → "clinic doctor" → "doctors"). A private person is never published by full name at any level. *(Must, P4)*
- **PUB-03** — Before publishing, the user sees a **preview "as others will see it"**. L2: AI proposes the anonymized text. L3–L4: automatic checks highlight contact details and full names of private people, which must be replaced. *(Must, P4)*
  - **AC:** publication is impossible without confirming the preview; pattern checks (email, phone, URL, @handles) block publication even after AI.
- **PUB-04** — Unpublish at any time; the entry disappears from the public page and counters are recalculated. *(Must, P4)*

### 7.9 Public page (F6)

Readable without an account.

- **COM-01 Public feed** — Recent gratitude **and the actions it led to** ("Someone thanked their child's teacher, then wrote to the principal"), totals, top addressees of the week, search. An action is shown only if the author shares it. *(Must, P4)*
- **COM-02 Addressee page** (e.g. "Nurses") — Number of thanks and of distinct authors, trend, texts, actions, related addressees, buttons "Thank them too" and "This is me". *(Must, P4)*
- **COM-03** — An addressee page and its anonymous texts appear only once **≥ K distinct authors** have thanked it (K = 3), to prevent de-anonymization. *(Must, P4)*
- **COM-04** — SEO: server rendering, meta tags, share images ("128 people thanked teachers"). *(Should, P4)*
- **COM-05** — Addressee catalog: hierarchy, synonyms, RU/EN. New addressees enter the catalog through moderation. *(Must, P4)*

### 7.10 Moderation and content safety

- **MOD-01** — Publishing pipeline: checks and anonymization → author preview and confirmation → AI moderation → **100% manual pre-moderation in beta** → delayed publication. *(Must, P4)*
- **MOD-02** — Random publication delay of 1–24 h so a post cannot be linked to a moment and a person. *(Should, P4)*
- **MOD-03** — "Report" on every public post; after N reports the post is hidden until reviewed. *(Must, P4)*
- **MOD-04** — Limits: max N publications per day per account; max M thanks to one organization per author per month (anti-boosting). *(Must, P4)*
- **MOD-05** — Admin panel: moderation queue, decisions with reasons, reports, catalog management. *(Must, P4)*

### 7.11 "Who is grateful to me?" — profile search (F7)

- **ID-01 Free-text profile search** — A visitor describes themselves in their own words ("I'm a night-shift nurse in a children's hospital and I volunteer at a dog shelter"). AI extracts identities (professions, roles, organizations, communities) and matches them to the catalog. *(Must, P5)*
- **ID-02** — Results: thanks to those identities (totals and texts), with "Start your jar" and "Notify me about new thanks". *(Must, P5)*
- **ID-03** — The user can correct what AI understood via editable chips with catalog autocomplete. *(Should, P5)*
- **ID-04** — Saved identities are **private**: never shown anywhere, used only for matching and the "You were thanked" digest. The free-text description is not stored unless the user saves the identities. *(Must, P5)*
- **ID-05** — An organization verifies membership (email on its domain) and gets a page. *(Later, B2B hypothesis)*

### 7.12 User data

- **DATA-01** — Export all entries to JSON and Markdown. *(Must, P1b)*
- **DATA-02** — Account deletion: immediate deletion of the profile, entries and categories (later also posts, cards and identities); encrypted backups expire within 30 days (stated in the privacy note). *(Must, P1a)*
- **DATA-03** — Privacy policy and terms in plain language: what goes to the AI provider and what gets published. *(Must before public beta)*
- **DATA-04** — Short privacy note on the site, linked from the sign-in screen: only you see your entries, and the database itself enforces it; the operator technically has database access and does not read entries; no end-to-end encryption, and why; backups and how long they are kept. It is also the privacy-policy link that Google sign-in requires. *(Must, P1a)*

### 7.13 Reflection coach *(Later)*

Conversations about one's own entries: patterns, reflection questions, positive-psychology exercises.
**Preconditions:** review of scenarios by a practicing psychologist; red-team set (crisis, dependency, manipulation); explicit "not therapy" boundaries; separate consent. Extra care for S2 users.

---

## 8. Success metrics

### 8.1 North Star

**WAJ — Weekly Active Journalers:** users with ≥ 1 entry in the last 7 days.

*Why not "number of entries":* research suggests a weekly gratitude practice can work as well as a daily one ([13.1](#131-research-basis)). We grow **regularity**, not volume.

### 8.2 Metric tree and beta targets

Starting targets, to be revisited after P1.

| Group | Metric | Target |
|---|---|---|
| Activation | First entry in the first session | ≥ 70% |
| Activation | ≥ 3 entries in the first 7 days | ≥ 40% |
| Retention | W1 / W4 retention (≥ 1 entry in week N) | ≥ 40% / ≥ 20% |
| Engagement | Entries per WAJ per week | 2–4 (not maximized) |
| Habit | Reminder opened → entry | ≥ 25% |
| Looking back | Users who opened the jar or a digest in a month | ≥ 30% |
| Connection (J3) | Share of entries with at least one person or organization | ≥ 50% |
| Action (J4) | Share of gratitude entries with an action marked done | ≥ 10% |
| Public | Share of entries at level ≥ L1 | ≥ 15% |
| Growth | Public page visitor → sign-up | ≥ 3% |
| Growth | Sent cards opened by the recipient | ≥ 60% |
| AI quality | Category suggestions accepted without edits | ≥ 70% |
| AI cost | LLM cost per active user per month | ≤ $0.20 |
| **Guardrails** | Personal data leaks on the public page | **0** |
| Guardrails | Reports and takedowns | < 1% of posts |
| Guardrails | Users switching AI off | Tracked as a trust signal |
| Guardrails | Reminder opt-out in the first 14 days | < 30% |

### 8.3 JTBD outcome pulse (opt-in)

Once a month, four statements on a 1–5 scale, one per job. We watch the trend and make no clinical claims.

| Job | Statement |
|---|---|
| J1 | "I notice good things in my days." |
| J2 | "I feel I have resources and possibilities in my life." |
| J3 | "I feel connected to the people around me." |
| J4 | "I feel I make a difference to others." |

Event taxonomy: [Tech Spec §12](TECH_SPEC.md#12-analytics-events). Events never contain entry text.

---

## 9. Non-goals

In the current horizon we do **not** build:

- Native iOS / Android apps (a PWA is enough; Q1)
- Sending messages or reviews on the user's behalf
- Searching for or identifying private individuals
- A social network: public profiles, likes, comments, follows
- Therapy features or diagnostics
- Monetization (hypotheses only)
- End-to-end encryption (incompatible with AI and the public page; trade-off in [Tech Spec §5.5](TECH_SPEC.md#55-data-protection))

---

## 10. Product risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Users drop the journal after 1–2 weeks | High | High | Fast entry, reminders, Open the jar, digests; measure W1/W4 from P1 |
| R2 | Cold start: empty public pages | High | High | Start with broad addressees (professions), L1 counters, seed from research participants with consent |
| R3 | Personal data leak or de-anonymization via the public page | Medium | **Critical** | L0 by default, generalization ladder, checks + anonymization + preview, K threshold, delay, 100% pre-moderation in beta |
| R4 | Abuse: harassment disguised as "thanks", ads, boosting organizations | Medium | High | No private people by full name, AI moderation, reports, limits, pre-moderation |
| R5 | Crisis content; S2 makes this more likely | Medium | Critical | Crisis signal, help screen, "not therapy" disclaimer, coach only *Later* with an expert |
| R6 | Scope creep for a solo builder | High | Medium | Strict phases, a *Later* bucket, decision gates in the [Roadmap](ROADMAP.md) |
| R7 | Legal: GDPR, Russian data localization law (152-FZ), AI provider terms | Medium | High | Plain-language note on where data is stored (US East), privacy policy, server-side LLM calls only, legal check before public beta (Q9) |

Technical risks are in the [Tech Spec §10](TECH_SPEC.md#10-non-functional-requirements) and [Decisions](DECISIONS.md).

---

## 11. Open questions

| # | Question | Recommendation | Status | Needed by |
|---|---|---|---|---|
| Q1 | Platform: PWA, Telegram Mini App or native? | **Web app on Next.js**, mobile-first; PWA install and offline in P1b | ✅ Decided 2026-10-27 | — |
| Q2 | Languages: RU, EN or both? | **RU + EN from day one**; first beta users Russian-speaking, portfolio case in English | ✅ Decided 2026-10-27 | — |
| Q3 | Hours per week for the build | 12–15 h/week (roadmap estimates assume this) | Open | P0 |
| Q4 | Monthly budget for infrastructure and AI | **$0 and no payment card in P0–P1**: free tiers only ([ADR-0002](DECISIONS.md#adr-0002)). Revisit before P2, when AI adds cost | ✅ Decided for P0–P1, 2026-10-27 | P2 |
| Q5 | Product name | **Jar of Light** («Банка света») | ✅ Decided 2026-10-19 | — |
| Q6 | Public repository? | Yes, without secrets | ✅ Decided 2026-10-19 | — |
| Q7 | Models: mix (A) or one strong model (B)? | Start with the mix; run B on the same evals and decide on data | Proposed | P2 |
| Q8 | Visual metaphor for "looking back" | **The jar** follows from the name; validate with a prototype | Partly decided | P2 |
| Q9 | Do we target users in Russia (152-FZ, data localization)? | Position as an international product; data is hosted in the US (Supabase Ohio, decided 2026-10-27); legal check before public beta | Open | P4 |
| Q10 | Allow public figures by name (artists, scientists)? | Yes, with pre-moderation | Proposed | P4 |
| Q11 | Sign-up required to read the public page? | No: reading is open, publishing needs an account | Proposed | P4 |
| Q12 | Value of the K threshold | K = 3 | Proposed | P4 |
| Q13 | L4 "signed": real name or pseudonym? | The author picks a display name; pseudonym by default | Open | P4 |
| Q14 | Private people in full-text levels (L3–L4) | First names allowed; full names and contact details blocked | Open | P4 |
| Q15 | Keep L1 "count only"? | Yes: the cheapest way to fill public pages with zero privacy risk | Open | P4 |
| Q16 | Beachhead segment: S1 or S2? | Decide after interviews; compare activation and W2 retention | Open | End of P1 |
| Q17 | Sign-in methods at start | **Google only**; email later (needs a domain) | ✅ Decided 2026-10-27 | — |
| Q18 | Who can sign up | **Anyone with a Google account** | ✅ Decided 2026-10-27 | — |
| Q19 | Database on a free tier that pauses when idle | **Supabase Free + daily keep-alive + own nightly backups** ([ADR-0002](DECISIONS.md#adr-0002)) | ✅ Decided 2026-10-27 | — |
| Q20 | Color palette | **Option A "Morning sky"** out of three ([options](design/palettes/)) | ✅ Decided 2026-10-27 | — |

---

## 12. Glossary

| Term | Definition |
|---|---|
| **Entry** | A journal item: text, date, kind, categories, optional people and place |
| **Gratitude** | An entry with an addressee: *to whom* or *to what* one is grateful |
| **Bright moment** | An entry without an addressee: something good that happened |
| **Free-form / guided entry** | Two ways to write: one text field, or a template (what, who, when, where, who made it possible) |
| **Addressee** | Who or what the gratitude is for: a person, role, organization, place, work, nature, oneself, etc. |
| **Addressee type** | One of 10 addressee categories ([Tech Spec §6.3](TECH_SPEC.md#63-taxonomies)) |
| **Generalization ladder** | From specific to general: "Dr. Petrova at Clinic 5" → "clinic doctor" → "doctors" → "medicine" |
| **Visibility level** | How visible an entry is to others: L0–L4 (§7.8) |
| **Public page** (code name *Commons*) | The public part of the site with aggregated, safe-to-share gratitude |
| **Identity** | A role, profession or organization a user associates with (private, used for matching) |
| **Thank-you card** | A private page behind a secret link, for a specific recipient |
| **Action** | A deed that follows gratitude: a message, review, call, paying it forward |
| **Open the jar** | Shows a random past entry on request |

---

## 13. Appendix

### 13.1 Research basis

*Check sources before publishing externally.*

- **Emmons & McCullough (2003)**, *Counting blessings versus burdens*: weekly gratitude lists were associated with higher well-being than control conditions.
- **Seligman, Steen, Park & Peterson (2005)**, *Positive psychology progress*: *Three Good Things* produced effects lasting months; the *Gratitude Visit* had the largest short-term effect, which faded within about a month.
- **Lyubomirsky, Sheldon & Schkade (2005)**: counting blessings once a week raised well-being, three times a week did not — an argument against chasing daily streaks.
- Recent meta-analyses show **modest** effects of gratitude interventions. Marketing never promises happiness; it offers a practice.

**Implication:** the product's two halves mirror two studied interventions; moderate frequency is fine; the Gratitude Visit gives the emotional peak, so actions and cards are a strong feature.

### 13.2 Competitors to review in P1

Gratitude and AI journals: Presently, Gratitude (Hapjoy), The Five Minute Journal, Day One, Reflectly, Rosebud, Stoic. Group thanks: Kudoboard. Goal: confirm that nobody has the "reverse" public layer, and collect best practices for onboarding and reminders.

### 13.3 Monetization hypotheses (not in scope)

1. **Freemium:** AI summaries, Book of the year, advanced insights in a subscription.
2. **B2B "Wall of thanks":** organizations (hospitals, schools, companies) verify a page and get tools: a website widget, team reports, collecting thanks from customers.
3. **Gift Book of gratitude:** printed or PDF.
