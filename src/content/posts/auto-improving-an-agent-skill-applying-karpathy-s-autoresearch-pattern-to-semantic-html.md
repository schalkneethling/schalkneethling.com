---
title: "Auto-Improving an Agent Skill: Applying Karpathy's Autoresearch Pattern to Semantic HTML"
pubDate: 2026-03-20
description: "How I built an eval-judge-improve loop to autonomously refine a semantic HTML agent skill, taking it from 2.46 to 2.89 out of 3.0 across four iterations and what I learned about the limits of automated improvement."
author: "Schalk Neethling"
tags: ["ai", "research"]
---

Agent skills, markdown files that encode domain expertise for AI coding assistants, are becoming a standard part of the development workflow. Tools like Claude Code, Cursor, Codex, and Antigravity all support them in some form. You write the instructions once, and every future coding session benefits from your expertise.

But here is a question I had not seen many people tackle: how do you systematically _improve_ a skill? Not through gut feeling or manual testing, but through a structured loop that measures quality, identifies weaknesses, and makes targeted improvements, automatically?

Andrej Karpathy's [autoresearch](https://github.com/karpathy/autoresearch) project planted the seed. His setup lets an AI agent modify a training script, train a model for five minutes, check if the result improved, and repeat — autonomously, overnight. Nick Saraev [demonstrated a similar concept applied to Claude Code skills](https://www.youtube.com/watch?v=qKU-e0x2EmE), using eval loops with assertions to iteratively refine skill output.

I wanted to try this with one of my own skills: [semantic-html](https://github.com/schalkneethling/webdev-agent-skills/tree/main/semantic-html), a skill that guides AI agents to write well-considered, accessible HTML. It turned out to be a fascinating experiment; not just in what the loop improved, but in what it could not.

## The Challenge: Semantic HTML is Not a Single Metric

Karpathy's autoresearch has a single, unambiguous metric: validation bits per byte (val_bpb). Lower is better. That clarity is what makes the autonomous loop work. The agent knows, without human input, whether an experiment succeeded.

Semantic HTML quality does not have that luxury. A well-structured page involves correct element choice, proper heading hierarchy, appropriate landmark usage, disciplined ARIA use, accessible forms, sensible list semantics, and more. Some of these are objectively testable ("is there a `<caption>` on this table?"), but many require contextual judgment ("is this content truly self-contained enough to warrant an `<article>`?").

This meant I could not use a simple pass/fail eval suite. I needed something that could evaluate across multiple dimensions and express nuance.

## Designing the Eval Suite

Working with Claude, I designed eight eval cases that exercise the full breadth of the skill. Each case is a realistic HTML generation prompt — not an abstract test, but the kind of request a developer would actually make:

1. **Product listing page** — landmarks, headings, lists, article elements, search, filter forms
2. **FAQ page** — details/summary, breadcrumbs, heading hierarchy
3. **Data table with controls** — table semantics, form controls, pagination
4. **Multi-step checkout form** — fieldset/legend, labels, error handling, autocomplete
5. **Blog article page** — article, time, aside, comments, address element
6. **Dashboard with sidebar nav** — multiple navs, aria-current, Popover API for dropdowns
7. **Pricing comparison table** — row and column headers, boolean feature display
8. **Settings form** — radio groups, toggles, fieldset nesting

Each eval case includes `focus_dimensions` (which of the eight scoring dimensions are most relevant) and `key_expectations` — specific, testable assertions like "product cards are in a `<ul>`" or "skip navigation links are the first focusable elements."

Here is the first eval case to give a sense of how they are structured:

```json
{
  "id": 1,
  "name": "product-listing-page",
  "prompt": "Create the HTML for a product listing page. The page has a site header with logo and main navigation, a search bar, a sidebar with filter options (price range checkboxes, category checkboxes, an 'in stock only' toggle), and a main content area showing 6 product cards. Each card has an image, product name, price, a short description, and an 'Add to cart' button. There's also a footer with contact info and secondary nav links. Use realistic product names and prices — not 'Product 1'. The page title is 'Running Shoes — SportGear'.",
  "focus_dimensions": [
    "element_choice",
    "landmark_structure",
    "heading_hierarchy",
    "list_semantics",
    "aria_discipline"
  ],
  "key_expectations": [
    "Uses <header>, <nav>, <main>, <aside>, <footer> landmarks appropriately",
    "<main> contains only the primary page content — site header, footer, and primary nav are outside it",
    "Skip navigation links are the first focusable elements — at minimum 'Skip to content', with 'Skip to search' also appropriate given the search bar",
    "Navigation uses <nav> with a label that does NOT include the word 'navigation'",
    "Search uses the <search> element",
    "Filter sidebar uses <form> with <fieldset>/<legend> for each filter group",
    "Product cards use <article> (they are self-contained)",
    "Product cards are in a <ul> (unordered — the count helps the user, but sequence is not meaningful)",
    "Heading hierarchy flows logically: h1 for page, h2 for sections, h3 for product names",
    "Buttons are <button> elements, not <div> or <a> with click handlers",
    "'Add to cart' buttons have accessible names that distinguish which product",
    "No ARIA attributes used where native HTML provides the same semantics",
    "Filter checkboxes use proper <label> elements, not placeholders",
    "The 'in stock only' toggle uses a native checkbox or switch pattern, not a custom div"
  ]
}
```

## The LLM-as-Judge Approach

Rather than binary pass/fail assertions, I chose an LLM-as-judge scoring approach. A separate Claude call evaluates each HTML output across eight dimensions, each scored 0–3:

- **element_choice** — right element for the job
- **aria_discipline** — ARIA used sparingly, only when native semantics do not suffice
- **heading_hierarchy** — logical structure, no skipped levels
- **landmark_structure** — proper landmarks, skip navigation, correct `<main>` usage
- **form_semantics** — labels, fieldsets, error handling
- **content_realism** — real names, varied lengths, no placeholder content
- **list_semantics** — intentional use of lists
- **table_semantics** — full structure with caption, thead, th[scope]

A detailed rubric defines what each score means per dimension. For example, a `landmark_structure` score of 3 requires appropriate landmarks, correct `<main>` placement (containing the `<h1>`, with site header/footer outside), and skip navigation links appropriate to the page's complexity. A score of 1 means key landmarks are missing or there is no skip navigation at all.

The composite score is the average across all scored dimensions.

## The Loop

The orchestration runs in Claude Code via a bash script. A `config.json` at the project root tells the script where to find the skill and how many iterations to run:

```json
{
  "skill_source": "~/dev/opensource/webdev-agent-skills/semantic-html",
  "max_iterations": 5,
  "target_score": 2.7
}
```

To start everything of you enter `claude` in the terminal from the root of the `skills-autoresearch` project, and then give Claude the following prompt:

```text
Read program.md and evals/eval-cases.json, then run the auto-improvement
loop on the skill in skill/. Start with iteration 1.
```

The script copies the skill into a working directory on each run (so the original is never modified directly), then for each iteration:

1. **Snapshot** the current skill
2. **Generate** HTML for each eval case using `claude -p` with the skill loaded via `--append-system-prompt`
3. **Judge** each output with a separate `claude -p` call that reads the rubric and HTML from disk
4. **Aggregate** scores with a Python script that computes per-dimension averages and identifies weaknesses
5. **Improve** the skill by having Claude read the summary, the current skill files, and make targeted edits
6. **Repeat** until the target score is reached or iterations are exhausted

One early discovery: all `claude -p` calls need `--dangerously-skip-permissions` because non-interactive mode has no TTY to approve file reads and writes. Also, using `--append-system-prompt` rather than `--system-prompt` is essential. The generation and judge steps need Claude Code's built-in file I/O capabilities to read skills, rubrics, and HTML outputs from disk.

## Run 1: From 2.46 to 2.80 — and a Critical Finding

The first iteration scored **2.46 out of 3.0**. The weakest dimension was `landmark_structure` at **1.62**. But the story behind that score turned out to be more interesting than the number itself.

The landmark elements were correct across all eight evals. The agent already knew how to use `<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`, and `<search>` appropriately — without the skill needing to explain them in detail. The low score came from a single gap: skip navigation. The skill had no guidance on skip links, so the agent never produced them, and the rubric treated their absence as a gate. Without skip navigation, the maximum `landmark_structure` score was 1 regardless of how well the landmarks were used otherwise.

Here is what made this revealing: **we had included skip navigation in the rubric before the first run ever happened.** We knew it was a best practice, so we encoded it as an expectation. The skill did not mention it. The loop identified the gap, the improvement step added a Skip Navigation section to the skill, and on iteration 2, every eval output included well-formed skip links.

The agent produced skip links correctly on the first attempt after the guidance was added. It did not struggle, get the syntax wrong, or need multiple iterations to learn the pattern. This tells us something important: **the model already knew how to implement skip links. It simply did not consider them important enough to include by default.**

This is one of the critical finding from the experiment. The rubric did not just test the skill, it surfaced a gap between what the model _knows_ and what it _does_. The model's training data contains skip link patterns, but without explicit guidance, it falls back to more common patterns that omit them. The skill acts as a bridge, promoting known-but-not-default practices to the level of expected behaviour.

This pattern likely extends well beyond skip links. The model probably knows about `tabindex="-1"` on focus targets, about the Popover API for dropdowns, about unique accessible names for repeated buttons, but without a skill prompting it, it defaults to more common (and less accessible) approaches. The loop's deepest value is not in teaching the model new things but in **systematically identifying where model defaults fall short of best practice and encoding the corrections into the skill**.

After one improvement iteration, the score jumped to **2.80**, exceeding the 2.7 target. Beyond skip navigation, the loop added guidance on filter control grouping, required field indicators, unique accessible names for repeated buttons, and the `aria-disabled` pitfall for links.

The `landmark_structure` dimension went from **1.62 to 2.88** in a single iteration, not because the agent learned about landmarks, but because a known-but-dormant capability was activated.

Here is the actual output from that run:

```markdown
┌───────────┬────────────┬───────────────────────────┐
│ Iteration │ Score │ Status │
├───────────┼────────────┼───────────────────────────┤
│ 1 │ 2.46 │ Below target │
├───────────┼────────────┼───────────────────────────┤
│ 2 │ 2.80 │ ✅ Target reached (≥ 2.7) │
└───────────┴────────────┴───────────────────────────┘

Iteration 1 weaknesses identified:

- landmark_structure (1.62) — skip navigation links missing in 6/8 evals
- form_semantics (2.33) — filter controls not grouped, required fields not indicated
- element_choice (2.38) — repeated "Add to cart" buttons lacked accessible names

Changes made to the skill after iteration 1:

- Added a dedicated Skip Navigation section
- Strengthened form guidance: grouping filter controls, required field indicators, accessible button names
- Added the aria-disabled pitfall for links

Iteration 2 scores:

- landmark_structure: 1.62 → 2.88 (huge jump)
- form_semantics: 2.33 → 3.00
- list_semantics, content_realism, table_semantics: all held at 3.00
- Remaining weak area: aria_discipline (2.38) — minor redundant ARIA use
```

## Between Runs: Human Review

Before running again, I reviewed the improved skill manually. Several things needed attention that the loop could not catch:

**The Popover API was missing.** The dashboard eval expected a button-triggered dropdown using the Popover API, but this expectation was added after Run 1 started. On reviewing the output, I found the agent had used `<details>/<summary>` for the user dropdown menu — a native disclosure pattern, but the wrong one for an action menu. `<details>/<summary>` is for progressive disclosure of _content_, not for menus of commands. The Popover API, with its light-dismiss behaviour, top-layer rendering, and native focus management, is the appropriate choice for this pattern.

**`tabindex="-1"` on `<main>` was missing.** The skip link section showed `<main id="main-content">` as the target, but `<main>` is not natively focusable. Without `tabindex="-1"`, activating the skip link scrolls to the element but does not move keyboard focus there in all browsers. This is the kind of spec-level detail that an LLM judge will not catch because it requires knowledge of browser focus behaviour. But it follows the same pattern as skip links: the model knows about `tabindex="-1"` for programmatic focus. When the skill includes it, the agent applied it correctly through guidance. This is another knowledge gap worth encoding in both the skill and the rubric. Had the rubric checked for `tabindex="-1"` on skip link targets from the start, the loop likely would have surfaced the gap and added the guidance itself, without requiring manual intervention.

**`aria-haspopup` was incorrectly included.** The Popover API example (added by the loop in a later iteration) included `aria-haspopup="true"` on the trigger button. But `aria-haspopup="true"` is equivalent to `aria-haspopup="menu"`, which implies `role="menu"` on the target. Per [Hidde de Vries and Scott O'Hara's research on popover accessibility](https://hidde.blog/popover-accessibility/), the browser automatically handles `aria-expanded` on the invoking button via the `popovertarget` association. No manual ARIA is needed.

This mistake is revealing. The Popover API is a relatively recent addition to the web platform and is likely sparse in most models' training data. The loop correctly identified that Popover API guidance was needed and added it, but the agent mixed new API knowledge (`popover`, `popovertarget`) with old ARIA patterns (`aria-haspopup`) because it could not distinguish which parts of its training data were still current. This is where skills can do their most valuable work: not just activating dormant knowledge, but providing accurate guidance on newer APIs where the model's training data may be incomplete or outdated.

It also raises a question about skill design: for newer APIs, is it enough to point the agent to the official specification or MDN, or does the skill need to include the key patterns directly? Pointing to docs sounds ideal, but the agent would need to fetch and read those documents at runtime, adding latency and token cost to every invocation. More critically, many development environments restrict or block internet access entirely, air-gapped corporate networks, CI pipelines, offline development. Even when access is available, specific domains may be blocked. A skill that merely mentions a new API and links to the spec is wasted context if the agent cannot reach those URLs. Including the key patterns directly in the skill ensures the guidance is available regardless of the environment, covering the common cases without a network dependency. The practical answer is to include the critical patterns and gotchas directly in the skill (what the browser handles automatically, what not to add manually), and reference the spec as supplementary reading rather than a prerequisite. For the Popover API specifically, knowing what _not_ to do (`aria-haspopup`, `role="menu"`) is as important as knowing what to do, and that kind of guidance requires a skill — a spec link alone will not prevent the model from mixing old patterns with new APIs.

**Skip link targeting was too rigid.** The loop had added "skip links must target landmark elements" with a focus on `<main>` only. I corrected this to say the primary skip link should target `<main>`, with additional links targeting other meaningful landmarks or controls depending on page complexity.

**Repeated button naming favoured `aria-label` over visually hidden text.** The skill offered `aria-label` as the first approach for giving unique accessible names to repeated "Add to cart" buttons. The problem: not all translation tools translate the text value of `aria-label`. A user browsing in German would see a translated page but hear an English-only button name from their screen reader. The visually hidden span pattern (`<span class="visually-hidden">Nike Pegasus 41</span>` inside the button) avoids this entirely. The text is in the DOM, so it gets translated along with everything else. The skill should lead with visually hidden text as the preferred approach, with a note about the translation limitation of `aria-label`. Ironically, this connects directly to the skill's own "Content Realism" principle about accounting for multi-language support.

These manual fixes were informed by the W3C specification, Scott and Hidde's popover accessibility research, and accessibility testing experience. They represent the kind of knowledge that lives in specs and practitioner expertise, not in eval rubrics.

## Run 2: The Popover API Surfaces

With the manual fixes applied and the eval expectations updated to include the Popover API, I ran two more iterations. The starting score was **2.71** (slightly below Run 1's final 2.80 because the evals got harder).

After improvement, it reached **2.84**. The loop added:

- **Popover API guidance** — preferred over ARIA menu patterns for user dropdowns, with clear guidance on when ARIA menu patterns _are_ appropriate (true application menus only)
- **Redundant ARIA section** — explains why `role="list"` on `<ul>`, `role="switch"` on a native checkbox, and `aria-label` duplicating visible text are harmful
- **`<main>` must contain the `<h1>`** — with a wrong/right example showing the screen reader impact
- **`<aside>` vs `<section>` removability test** — "would the page still be complete without this?"

## Run 3: The Plateau

I ran five more iterations. The results oscillated between **2.85 and 2.89** with no clear upward trend:

| Iteration | Score       | Weakest Dimensions                               |
| --------- | ----------- | ------------------------------------------------ |
| 1         | 2.89 (best) | heading_hierarchy (2.62), form_semantics (2.67)  |
| 2         | 2.88        | heading_hierarchy (2.62), aria_discipline (2.75) |
| 3         | 2.85        | aria_discipline (2.62), content_realism (2.75)   |
| 4         | 2.87        | form_semantics (2.67), aria_discipline (2.75)    |
| 5         | 2.85        | aria_discipline (2.62), form_semantics (2.67)    |

The skill had plateaued. Five dimensions were consistently hitting 3.0 (landmark_structure, list_semantics, content_realism, table_semantics, and heading_hierarchy in most iterations). The remaining gaps were increasingly edge-case-y: `aria-current` placed on `<li>` instead of `<a>`, CSS-only boolean state indicators in tables, filter sidebars without wrapping `<form>` elements.

The agent's own analysis was telling: "The limiting factor is model variance in the HTML generator, not gaps in the skill." When the "misses" are debatable judgment calls (is h3 correct here given a visually hidden intermediate heading?), you have moved past systematic skill gaps into noise.

Here is the terminal output from that final run:

```text
┌───────────┬─────────────┬──────────────────────────────────────────────────┐
│ Iteration │    Score    │                Weakest dimensions                │
├───────────┼─────────────┼──────────────────────────────────────────────────┤
│ 1         │ 2.89 ← best │ heading_hierarchy (2.62), form_semantics (2.67)  │
├───────────┼─────────────┼──────────────────────────────────────────────────┤
│ 2         │ 2.88        │ heading_hierarchy (2.62), aria_discipline (2.75) │
├───────────┼─────────────┼──────────────────────────────────────────────────┤
│ 3         │ 2.85        │ aria_discipline (2.62), content_realism (2.75)   │
├───────────┼─────────────┼──────────────────────────────────────────────────┤
│ 4         │ 2.87        │ form_semantics (2.67), aria_discipline (2.75)    │
├───────────┼─────────────┼──────────────────────────────────────────────────┤
│ 5         │ 2.85        │ aria_discipline (2.62), form_semantics (2.67)    │
└───────────┴─────────────┴──────────────────────────────────────────────────┘
```

## What the Final Skill Produces

To ground all these scores in something concrete, here is the actual HTML output from the product listing page eval, generated by an agent using the improved skill:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Running Shoes — SportGear</title>
  </head>
  <body>
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <a href="#search" class="skip-link">Skip to search</a>
    <a href="#filters" class="skip-link">Skip to filters</a>

    <header>
      <a href="/">
        <img src="/images/sportgear-logo.svg" alt="SportGear home" />
      </a>
      <nav aria-label="Main">
        <ul>
          <li><a href="/mens">Men</a></li>
          <li><a href="/womens">Women</a></li>
          <li><a href="/kids">Kids</a></li>
          <li><a href="/sale">Sale</a></li>
          <li><a href="/new-arrivals">New Arrivals</a></li>
        </ul>
      </nav>
    </header>

    <search id="search" aria-label="Product search">
      <label for="product-search">Search products</label>
      <input
        type="search"
        id="product-search"
        name="q"
        placeholder="e.g. trail running shoes"
      />
      <button type="submit">Search</button>
    </search>

    <aside id="filters" aria-label="Product filters">
      <form aria-label="Filter products">
        <fieldset>
          <legend>Price range</legend>
          <ul>
            <li>
              <label>
                <input type="checkbox" name="price" value="0-50" /> Under $50
              </label>
            </li>
            <li>
              <label>
                <input type="checkbox" name="price" value="50-100" /> $50 – $100
              </label>
            </li>
            <!-- ...more options -->
          </ul>
        </fieldset>

        <fieldset>
          <legend>Category</legend>
          <ul>
            <li>
              <label>
                <input type="checkbox" name="category" value="road" /> Road
                running
              </label>
            </li>
            <!-- ...more options -->
          </ul>
        </fieldset>

        <fieldset>
          <legend>Availability</legend>
          <label>
            <input type="checkbox" name="in-stock" value="true" /> In stock only
          </label>
        </fieldset>

        <button type="submit">Apply filters</button>
      </form>
    </aside>

    <main id="main-content" tabindex="-1">
      <h1>Running Shoes</h1>

      <ul>
        <li>
          <article>
            <img
              src="/images/products/nike-pegasus-41.jpg"
              alt="Nike Air Zoom Pegasus 41 in black and white colorway"
            />
            <h2 id="product-pegasus">Nike Air Zoom Pegasus 41</h2>
            <p>$129.99</p>
            <p>
              A versatile daily trainer with responsive ZoomX foam and a
              breathable mesh upper for comfortable miles on road or treadmill.
            </p>
            <button aria-describedby="product-pegasus">Add to cart</button>
          </article>
        </li>
        <li>
          <article>
            <img
              src="/images/products/brooks-ghost-16.jpg"
              alt="Brooks Ghost 16 in grey and green colorway"
            />
            <h2 id="product-ghost">Brooks Ghost 16</h2>
            <p>$139.95</p>
            <p>
              Smooth, balanced cushioning with DNA Loft v2 foam delivers a soft
              ride for neutral runners tackling everyday training.
            </p>
            <button aria-describedby="product-ghost">Add to cart</button>
          </article>
        </li>
        <!-- ...4 more product cards -->
      </ul>
    </main>

    <footer>
      <nav aria-label="Secondary">
        <ul>
          <li><a href="/about">About Us</a></li>
          <li><a href="/shipping">Shipping &amp; Returns</a></li>
          <li><a href="/privacy">Privacy Policy</a></li>
          <li><a href="/terms">Terms of Service</a></li>
        </ul>
      </nav>

      <address>
        <p>SportGear Customer Support</p>
        <p>
          Email:
          <a href="mailto:support@sportgear.com">support@sportgear.com</a>
        </p>
        <p>Phone: <a href="tel:+18005557890">1-800-555-7890</a></p>
      </address>

      <p><small>&copy; 2026 SportGear. All rights reserved.</small></p>
    </footer>
  </body>
</html>
```

Notice what the skill guided the agent to produce: three skip links targeting `<main>`, `<search>`, and the filter `<aside>`. Landmarks correctly structured with `<header>`, `<nav>`, `<search>`, `<aside>`, `<main>`, and `<footer>` — each labelled. Product cards wrapped in `<article>` elements within a `<ul>`. Each "Add to cart" button linked to its product heading via `aria-describedby`. Filter groups in `<fieldset>` with `<legend>`. The `<h1>` inside `<main>`. `tabindex="-1"` on `<main>`. Realistic product names with varied prices. And no redundant ARIA anywhere.

But the output is not perfect, and the imperfections are instructive. The filter checkboxes are wrapped in a `<ul>` inside each `<fieldset>` — a pattern so common it feels correct. But [Russ Weakley's screen reader test cases](https://russmaxdesign.github.io/accessible-forms/fieldset-checkbox-group.html) reveal an unexpected problem: when checkboxes are inside a `<ul>` within a `<fieldset>`, VoiceOver on Chrome and Firefox announces "Dog. Unticked. Tick box. List 3 items" — the list count is announced, but the legend and group role are _not_. The user gets "3 items" but loses the crucial context of _what_ those items are for. Without the list, VoiceOver correctly announces "Dog. Unticked. Tick box. Favourite animal. Group." NVDA and JAWS handle both patterns, but VoiceOver's behaviour means the list is not just unnecessary noise — it actively interferes with the fieldset/legend relationship in some screen readers. A simpler approach avoids the issue entirely:

```html
<fieldset>
  <legend>Price range</legend>
  <label for="price-under-50">
    <input type="checkbox" id="price-under-50" name="price" value="0-50" />
    Under $50
  </label>
  <label for="price-mid-range">
    <input type="checkbox" id="price-mid-range" name="price" value="50-100" />
    $50 – $100
  </label>
</fieldset>
```

Notice the explicit `for`/`id` association between label and input. The agent's output uses implicit association (wrapping the input inside the label), which works, but the explicit relationship is clearer, more robust across assistive technologies. This is another rubric gap: the evals did not check for explicit versus implicit label association, so the loop had no reason to prefer one over the other.

One notable pattern in the output: the agent uses `/>` for void elements like `<img>`, `<input>`, and `<meta>`. This is an XHTML convention that persists widely in training data, tutorials, and frameworks like React (where JSX requires it). The [HTML specification actively discourages its use](https://html.spec.whatwg.org/dev/syntax.html#start-tags). This is a clear case of training data weight at work: the `/>` pattern is so prevalent that the model defaults to it despite the spec's guidance. It is a good candidate for the skill to address, and another example of how common patterns in training data do not always align with best practice.

## What the Loop Taught Me

**Skills do not teach models; they steer and activate dormant knowledge.** This was the most important finding. The model already knew how to implement skip links, the Popover API, unique accessible names for repeated buttons, and `<fieldset>/<legend>` for form grouping. It produced all of these correctly on the first attempt after the skill mentioned them. What the model lacked was not knowledge but _prioritisation_. Without explicit guidance, it defaults to more common patterns from its training data — patterns that are often less accessible. The skill's role is not to teach HTML to the model. It is to raise the floor, to ensure that known-but-not-default best practices are applied consistently rather than left to chance. This has implications beyond semantic HTML: any domain where best practice diverges from common practice is a candidate for skill-based correction.

The utopia, then, is finding the sweet spot between playing to the model's strengths and enhancing its innate knowledge through specialised domain expertise. The model already understands landmarks, the skill does not need to explain what `<nav>` is. But the model does not prioritise skip navigation, the skill needs to steer it there. A well-tuned skill leans into what the model does well and fills only the gaps where its defaults fall short. That balance, leveraging strength while correcting for gaps, is what makes a skill genuinely useful rather than just a context hog.

**The rubric is where the real decisions happen.** The auto-improvement loop does not discover what good semantic HTML looks like — it closes the gap between what the rubric expects and what the skill produces. We added skip navigation to the rubric before the first run, knowing the skill did not mention it. The loop then mechanically identified the gap, added the guidance, and verified it worked. The judgment happened at rubric design time. If we had not put skip navigation in the rubric, the loop would never have surfaced it, and the skill would still be missing it. This means the ceiling of the loop is determined entirely by the quality and completeness of the evals — the human in the loop, if you will.

**Bundling related criteria can mask real quality.** We scored skip navigation as part of `landmark_structure` rather than as its own dimension. This meant that in iteration 1, the agent's excellent landmark usage was hidden behind a skip navigation gate that capped the score at 1. The 1.62 score suggested the agent was bad at landmarks — in reality, it was good at landmarks, but skip links likely carry lower weight in the model's training data compared to common landmark patterns. The skill raised the importance of that component. In hindsight, skip navigation belongs in a broader "best practices" or "keyboard accessibility" dimension alongside concerns like `tabindex="-1"` on focus targets, translation-resilient accessible names, and progressive enhancement — patterns that cut across structural elements rather than belonging to any single one.

**LLM-as-judge works well for multi-dimensional quality.** Binary assertions would have missed the nuance of semantic HTML. A `<table>` can have all the right elements and still be the wrong choice for the content. The 0–3 scoring with detailed justifications gave the loop enough signal to make targeted improvements without being so rigid that valid alternative approaches were penalised.

**Human review catches what evals cannot.** The `tabindex="-1"` issue, the `aria-haspopup` problem, and the Popover API preference all required knowledge that was not encoded in the eval rubric. The most effective workflow was letting the loop handle the systematic gaps (skip navigation, form grouping, button naming) and then applying human expertise for the spec-level and practitioner-level refinements.

**Skills plateau — and that is informative.** After a certain point, the remaining improvements are edge cases that vary between runs. This is not a failure — it is a signal that the skill has activated all the dormant model knowledge that the current eval suite can reach. To go further, you would need either more eval cases targeting specific remaining weaknesses, a more granular rubric, or — and this is the interesting implication — you may have found the boundary of what the model knows about the domain. That is where skills can truly shine, by contributing specialised knowledge the model does not have. The Limitations and Future Work section explores this idea further.

**The loop respects the skill's voice.** The improvement step maintained the original skill's tone and structure across iterations. It explained _why_ guidance matters, gave concrete code examples, and avoided heavy-handed language.

## Where This Fits in the Landscape

The autoresearch pattern applied to agent skills is gaining traction. Anthropic's own [skill-creator](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills) now includes eval creation, benchmarking, and A/B comparison. [MindStudio has documented](https://www.mindstudio.ai/blog/claude-code-autoresearch-self-improving-skills) how to apply the pattern with binary assertions and pass rates. [Addy Osmani has written](https://addyosmani.com/blog/self-improving-agents/) about self-improving coding agents more broadly.

Most of the existing work focuses on binary assertions (pass/fail) and skill _triggering_ (does the skill activate for the right prompts?). What I found valuable about the LLM-as-judge approach for semantic HTML specifically is that it handles the multi-dimensional, judgment-heavy nature of the domain. There is no single "correct" HTML for a given page — there are better and worse choices across multiple interrelated dimensions, and a rubric-based judge can express that nuance.

The pattern also composes well with human expertise. The automated loop handles the systematic gaps that are hard to spot manually (you do not notice skip navigation is missing until you test with a keyboard), while human review handles the spec-level details that require deeper knowledge than the judge possesses.

## The Result

Starting from the original skill (which was already well-structured and thoughtful), the auto-improvement loop produced a meaningfully better version:

- **Skip navigation** — a complete section with guidance on `tabindex="-1"`, when to add additional skip targets, and sidebar layout considerations
- **Popover API** — preferred over ARIA menu patterns for dropdowns, with clear boundaries for when ARIA menus _are_ appropriate
- **Redundant ARIA** — concrete examples of noise patterns to avoid
- **Unique accessible names** — three progressive approaches for repeated buttons
- **Form grouping** — `<search>` wrapping all filter controls, `<fieldset>/<legend>` for settings sections
- **`<main>` and `<h1>`** — placement guidance with screen reader impact explained
- **`<aside>` vs `<section>`** — the removability test
- **Required fields, hint text, disabling controls, decorative separators** — smaller but meaningful additions

The composite score went from **2.46 to 2.89** — and the remaining gap is model variance, not skill quality.

## Limitations and Future Work

The harness worked well for identifying and fixing systematic gaps, but several limitations emerged that are worth noting for anyone building something similar.

**File structure preservation.** The improvement step consistently merged the skill's reference files (`element-decision-trees.md`, `heading-patterns.md`) into SKILL.md, despite explicit instructions to keep them separate. The skill is designed as three files — agents load the references independently based on context. I tried prompt-level instructions, file structure documentation, and eventually switching to file-based I/O where the agent reads and writes files on disk directly. The file-based approach helped but did not fully solve the problem. The agent gravitates toward consolidation because it is easier to reason about everything in one context. A post-improvement validation step that checks file integrity would be a more reliable fix.

**The loop only adds, never removes.** Every improvement iteration made the skill longer. But if the dormant-knowledge finding is right — that the model already knows much of what the skill tells it — then some guidance may be consuming context for no measurable benefit. The landmark table, for instance, might be entirely redundant. The model used landmarks correctly from the very first iteration without detailed instructions.

This suggests a complementary experiment: **skill minification**. The same principle as tree-shaking unused code — if guidance does not change the output, it is wasted context. And with agents operating under context window constraints, wasted context has a real cost. Every character in the skill is a character unavailable for the actual task.

The improvement step could be modified to occasionally propose _removals_ alongside additions. Remove a section, re-run the evals, and compare. If the scores hold, the section was not needed. If they drop, put it back. Over enough iterations, you would converge on a minimal skill — the smallest set of instructions that produces the same quality output.

This kind of experimentation would need more iterations than what I ran here. My runs were two loops, two loops, then five loops — enough to find and fix systematic gaps, but not enough for the subtler work of pruning. I would estimate at least ten to twenty iterations to get meaningful signal from removal experiments, since you need enough cycles to both remove guidance and verify the removal did not cause regressions that only surface in specific eval cases.

The result would be a skill that is not just _correct_ but _efficient_ — a minimal encoding of the gap between model defaults and domain best practice. Everything else is noise the model does not need.

**Rubric design shapes outcomes.** Several issues surfaced during the review of the output that the rubric did not check for: checkboxes wrapped in lists inside fieldsets (which breaks VoiceOver's legend announcement), implicit versus explicit label association, unnecessary `<form>` wrappers without `method` or `action`, and the `aria-label` translation problem. Each of these is a rubric gap that, if encoded, would let the loop catch and fix them automatically. The rubric is a living document — every manual review finding is a candidate for a new eval expectation.

## Try It Yourself

The full auto-improvement harness — eval cases, rubric, judge prompt, aggregation script, and orchestration script — is [available on GitHub](https://github.com/schalkneethling/skills-autoresearch). The resulting skill improvements are in [this pull request](https://github.com/schalkneethling/webdev-agent-skills/pull/3). The eval cases are specific to semantic HTML, but the pattern is adaptable to any agent skill with multi-dimensional quality requirements.

If you experiment with this pattern on your own skills, I would love to hear what you find. What dimensions did you evaluate? Where did the loop plateau? What did human review catch that the loop missed?

## Further Reading

- [Karpathy's autoresearch](https://github.com/karpathy/autoresearch) — the original autonomous research loop for LLM training
- [On popover accessibility](https://hidde.blog/popover-accessibility/) — Hidde de Vries and Scott O'Hara on what the browser does and does not do with the Popover API
- [MDN: aria-haspopup](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-haspopup) — why `aria-haspopup="true"` implies `role="menu"` and when it is (and is not) appropriate
- [Void elements and trailing slashes](https://github.com/validator/validator/wiki/Markup-%C2%BB-Void-elements) — the HTML validator wiki on why trailing slashes on void elements are unnecessary and potentially harmful
- [Improving skill-creator](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills) — Anthropic's eval and benchmarking additions to the skill-creator
- [Self-improving coding agents](https://addyosmani.com/blog/self-improving-agents/) — Addy Osmani on the broader pattern of autonomous agent improvement
- [Agent Skills specification](https://agentskills.io/) — the open standard for cross-platform agent skills
- [Nick Saraev on auto-improving Claude Code skills](https://www.youtube.com/watch?v=qKU-e0x2EmE) — the video that sparked this experiment
