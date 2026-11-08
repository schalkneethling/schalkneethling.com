---
title: How Haystack Searches Bookmarks by Need With Jev, and What D1 Full-Text Search Could Not Do
pubDate: 2026-11-08
description: How Haystack prepares each bookmark for search, decides what may be sent to Jev, asks two questions per bookmark, and what the first day of production searches showed compared with SQLite FTS5 on the same data.
author: Schalk Neethling
tags: [typescript]
---

The first search I ran against Haystack in production was "something about a select element". It returned one bookmark, an article titled "A select should tell you something", in a little over half a second. That is the result I wanted. SQLite full-text search, run over the same data, returns nothing for the same query.

Haystack is a bookmarking tool I am building on Cloudflare Workers and D1. Search is the part of it that matters most to me, because I save links so that I can find them again when I need them, and when I need them I rarely remember the words in the title. I remember the problem I had. This post explains how search works in Haystack today: what we store for each bookmark, how we decide what may be sent to Jev, the two questions we ask about every bookmark, and what the first day of real searches showed.

> **Note**: Everything here describes Haystack as deployed on November 7, 2026, with Jev model `jev-1.14.0`. The collection is small (14 bookmarks), and every search so far is mine. The findings are a first look, not an evaluation. The evaluation is the next phase of the project, and the end of this post describes what it will measure.

## What Jev Is

[Jev](https://docs.typesafe.ai/) is a model from TypeSafe that answers questions about structured data with probabilities instead of prose. We send it a JSON `state` and a set of questions about that state, and it returns a number for each question. The two question types Haystack uses for search are a [Noul](https://docs.typesafe.ai/primitives/noul.md), which returns the probability that the answer to a yes-or-no question is yes, and a [Score](https://docs.typesafe.ai/primitives/score.md), which places the answer on a set of ordered levels that we define.

What I care about is that each answer is a number we can store, compare and threshold in code. Ranking search results needs one number per bookmark, and a model that writes a paragraph about relevance would need another step to turn that paragraph into a number.

## Preparing a Bookmark for Search

Most of what decides search quality happens before anyone types a query. When a bookmark is saved, Haystack enriches it in the background, and the output of that enrichment is a short text field called `match_text`. That field is what Jev reads at search time, and the URL is never part of it.

```mermaid
flowchart TD
    A[Bookmark saved] --> B{Sensitivity check:<br>Jev Noul on a description<br>of the URL}
    B -- "Noul at or above 0.5,<br>not confirmed by the user" --> H[Held:<br>nothing more is sent anywhere]
    B -- "below 0.5, or confirmed<br>not private" --> G{GitHub repository?}
    G -- yes --> GH[Fetch repository data<br>from the GitHub API]
    G -- no --> K
    GH --> K[Jev Choice question:<br>what kind of link is this?]
    K --> L[Language model writes summary,<br>use cases, alternative terms and more]
    L --> M[Code derives match_text]
    M --> D[(D1: enrichments)]
```

### The Sensitivity Gate

Some links grant access on their own. A link to a shared document, a password reset link or a signed download URL gives access to whoever has it, and I do not want any of those sent to an external model. Before anything else, Haystack therefore asks Jev one Noul question: would this web address give anyone who has it access to something private?

Jev does not see the URL. It sees a description produced by a function called `describeUrlForJudgment`, which replaces every query value, every fragment value and every path segment that does not read as words with a placeholder such as `<hex:32>` or `<digits:6>`. The page title is included, because "Reset your password" is strong evidence on its own. The question's instructions explain what the placeholders mean, because Jev interprets the question literally and has no other way to learn what they stand for.

A bookmark whose Noul is at or above 0.5 is Held unless I confirm that the link is not private. For a Held bookmark, enrichment stops at this step: nothing is sent to GitHub, to the `kind` question or to the language model, and the bookmark is never a search candidate. The same check also runs when I submit the save form, with one attempt and a two-second time limit, so the form can show a warning before the bookmark is saved. A timeout there never blocks saving. The bookmark is saved, and the background enrichment asks the question again, with retries.

### Classifying the Kind of Link

The second Jev question is a [Choice](https://docs.typesafe.ai/primitives/choice.md) between eight options: `tool`, `library`, `reference`, `tutorial`, `article`, `discussion`, `collection` and `other`. The options describe what a person does with the link, not where it is hosted, so a GitHub repository for a test runner is a `tool`. `other` is listed last, because TypeSafe's documentation for Jev 1.13 notes that Jev favors the first option when several options fit.

### What the Language Model Writes

A language model, currently `claude-haiku-5-5` called through Cloudflare AI Gateway, reads what the page and GitHub provided and writes a structured enrichment: a summary of at most 280 characters, use cases, problems solved, technologies, topics and alternative terms. Its output is validated against a schema, and when a response fails validation, the request is retried once.

### Deriving `match_text` in Code

The language model does not write `match_text`. Our code derives it from the stored enrichment, one line per part, in a fixed order. This is the `match_text` for the select article:

```text
A select should tell you something
Kind: article
A blog article arguing that the customizable select element is more than a prettier dropdown, showing with five before/after demos how select options can display information people need to make a decision.
Use when you need to design a select or dropdown whose options show extra details like images or descriptions.
Use when you want to understand what the customizable select element enables beyond styling.
Other terms: customizable select, styled dropdown, custom select menu, select element design, dropdown UX, rich select options
```

Because the text is derived in code, we can change the derivation and regenerate `match_text` for every stored enrichment without calling the language model or Jev again. Version 1 of the derivation leaves out technologies, topics and problems solved, because I expect the use cases to describe a need more directly than a list of topics does. The evaluation phase will test that expectation by comparing search results with and without those fields.

## Deciding What Reaches Jev

A search sends the query and a set of bookmarks to an external service, so most of the search code decides what may be sent, and how much of it in each request.

```mermaid
flowchart TD
    P[GET /] --> F{search-enabled flag on?}
    F -- no --> X2[Redirect to saved links,<br>no Search link in the header]
    F -- yes --> SP[Search page]
    SP --> Q[POST /api/search]
    Q --> S{Signed in?}
    S -- no --> X1[401]
    S -- yes --> V{Query 1 to 500 characters,<br>not only spaces?}
    V -- no --> X3[400, nothing read,<br>sent or logged]
    V -- yes --> C[Read candidates from D1:<br>enriched and not Held]
    C --> CH[Split into chunks that fit<br>Jev's token budgets]
    CH --> LIM[Rate limiter:<br>requests and tokens per second]
    LIM --> J[Jev: two questions<br>per bookmark]
    J --> R[Rank by the display signal,<br>keep those at or above the threshold]
    R --> LOG[(Log the run and every answer)]
    LOG --> OUT[Results]
```

A Flagship feature flag, `search-enabled`, decides whether the search page exists at all. While the flag is off, `/` redirects to the saved links and the header has no Search link. When the flag cannot be read, Haystack behaves as if it were off. This lets me turn search off without a deploy. The search API itself checks the session, as every route except sign-in does.

The query is then validated against a shared schema: at least one character that is not a space, and at most 500 characters. A query that fails is rejected before anything is read from the database, sent to Jev or written to the log. The limit applies to every channel, including the agent channels planned for later, because agents can send long queries and the query is included in every request sent to Jev.

The candidates are the bookmarks that have at least one enrichment and are not Held. Search makes the Held decision with the same function that the background enrichment and the review page use, so the three cannot disagree. Every valid query is sent to Jev together with every candidate. There is no keyword filter in front of Jev today, and the section on D1 explains why.

### What Jev Receives

For each bookmark, Jev receives three fields: the title, the kind and the `match_text`. It does not receive the URL, the bookmark's ID or anything else from the row. Each bookmark is named by an alias, `b_0`, `b_1` and so on, and our code maps every answer back to the bookmark's ID after the response arrives. The aliases are also shorter than an ID, which keeps each request smaller, because every alias appears in both of the questions asked about its bookmark.
