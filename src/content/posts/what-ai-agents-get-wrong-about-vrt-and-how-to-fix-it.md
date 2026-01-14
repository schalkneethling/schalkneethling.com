---
title: "What AI Agents Get Wrong About VRT, And How to Fix It"
pubDate: 2026-01-14
description: "Exploring common misconceptions AI agents have about Visual Regression Testing and practical solutions to address them."
author: "Schalk Neethling"
tags: ["testing", "visual-regression-testing", "ai", "automation"]
---

I recently had an AI agent write Visual Regression Tests for a component library. The tests it produced were technically correct—they ran, they passed, they generated snapshots. But they were architecturally wrong in ways that would cause maintenance headaches for months. It's a good example of why working with AI agents requires explicit guardrails, and why those guardrails need to live in your codebase.

## The Problems

The agent looked at a hero component and decided to be thorough. It produced tests for mobile, desktop, and large desktop viewports. Each test called `page.setViewportSize()` directly. This seems reasonable until you understand how Playwright's multi-project configuration works.

When you define projects in `playwright.config.js` with different viewports and device settings, Playwright runs every test across all matching projects automatically. One test becomes multiple snapshots across browsers and breakpoints. The agent didn't know this, so it wrote separate tests that each overrode the project configuration. Instead of one test running across all projects, I had redundant tests generating duplicate snapshots.

After fixing this, tests dropped from 15 to 9 runs per component—roughly 60% faster. That's the cost of fighting your tooling instead of working with it.

But the viewport overrides caused a more subtle problem. The agent used `Desktop Chrome` settings with a mobile viewport width:

```javascript
// What the agent wrote
await page.setViewportSize({ width: 375, height: 667 });
```

This sets the viewport size but doesn't emulate mobile behaviour. The `isMobile` flag stays false. Touch events aren't enabled. The device scale factor remains at 1x instead of 2-3x. CSS media queries like `@media (hover: none)` or `@media (pointer: coarse)` won't trigger correctly. The test looks like it's testing mobile, but it's really testing a narrow desktop window.

The agent also tested a dialog that loads third-party content. That content might render differently on each run, or might not load at all. Testing it with VRT guarantees flaky tests. The agent couldn't reason about the runtime behaviour of external dependencies.

## What I Actually Needed

One test. Playwright's project configuration handles the viewport and browser matrix automatically.

The agent produced duplicated tests with viewport overrides, tests for UI elements that would be captured in page-level tests anyway, and tests for content that can't be reliably snapshot-tested. Each additional test added maintenance burden without adding confidence.

## Document Your Testing Architecture

AI agents don't have institutional knowledge. They can't intuit that your team relies on Playwright's multi-project setup, or that mobile emulation requires specific device presets, or that Firefox doesn't support mobile emulation at all (it doesn't—this is a Playwright limitation).

You have to tell them. Explicitly. Create an `AGENTS.md` file in your project root or test directory. If your tooling doesn't support `AGENTS.md`, use the appropriate alternative—`CLAUDE.md` for Claude Code, or whatever format your agent expects. The [agents.md specification](https://agents.md) provides a standard format if you want consistency across tools.

Here's an example of what VRT guidance might look like:

```markdown
## Visual Regression Testing

### Key Principles

Write ONE test, not multiple with viewport overrides. Let Playwright run it
across all configured projects automatically.

### Standard Viewports

| Breakpoint | Width  | Browsers                  |
|------------|--------|---------------------------|
| Mobile     | 375px  | Chromium, WebKit          |
| Tablet     | 768px  | Chromium, Firefox, WebKit |
| Desktop    | 1440px | Chromium, Firefox, WebKit |

Firefox is excluded from mobile tests—Playwright has no mobile emulation
support for Firefox.

### Mobile Device Emulation

Mobile projects must use mobile device presets (`Pixel 5`, `iPhone 14`) to get
proper touch emulation, user agent strings, and device scale factors. Setting
a mobile viewport width on a desktop device preset is not sufficient.

### Test Structure

- Use semantic locators (`.ComponentName`)
- Wait for `networkidle` and key elements before capturing
- Always disable animations: `animations: "disabled"`

### What Not to Test

- Third-party content or iframes with external dependencies
- Dynamic data that may render inconsistently between runs
- Granular UI elements (buttons, icons) unless explicitly testing that component
- States that will be captured in full-page VRT tests
```

## The Broader Lesson

AI agents optimise for what they can see. They'll produce syntactically correct code that follows patterns they recognise. What they can't do is reason about your Playwright configuration, your CI pipeline's tolerance for flakiness, or the maintenance cost of each additional snapshot.

This isn't a criticism—it's a constraint to design around. The more context you encode in documentation files, the better the output. Treat these files as onboarding documentation for a technically skilled team member who knows nothing about your project's architecture or conventions.

The tests the agent wrote weren't wrong. They were just written without the context that makes tests useful.
