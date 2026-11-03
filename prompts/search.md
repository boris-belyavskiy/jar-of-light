# Prompt log: search

There was no separate prompt for this feature. It comes from feature 8 in `PLAN.md` ("search my entries by text"), and I agreed to the count of feature PRs it helps to reach:

> Про фичи согласен

*Summary: I agree about the features.*

**Agent response (summary):** added a search field above the dates. It escapes `%`, `_` and `\` so that they match literally and limits the query to 100 characters. While testing it noticed that a space in the URL becomes `+`, which `safeFeedPath` rejected: saving an entry during a search would have thrown away the filter. It fixed that too. It also pointed out that the search words travel in the URL, so they can reach Vercel's request logs, and left that decision to me.
