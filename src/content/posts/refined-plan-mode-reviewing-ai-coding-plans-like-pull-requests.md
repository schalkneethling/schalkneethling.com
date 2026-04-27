---
title: "Refined Plan Mode: Reviewing AI Coding Plans Like Pull Requests"
pubDate: 2026-04-27
description: "A small local web app for reviewing AI-generated coding plans with inline comments, anchored feedback, and structured JSON output, bringing the pull request review experience to plan mode."
author: "Schalk Neethling"
tags: ["ai", "tooling"]
---

Plan mode is core to how I work with coding agents. As soon as a problem is large or the approach is unclear and can go multiple directions, plan mode is my default. Always.

However, as incredibly useful and core as it is to my daily workflow, it is also one of the places where the UX and flow are rather painful. This is especially true in terminal-based coding agents, which is how most people interact with coding agents these days. While I enjoyed plan mode in Cursor, even there the round-trip between plan, feedback, review, feedback, and approve was far from ideal.

In most terminal-based workflows, the plan is streamed as a long Markdown block. If the plan is short, that is fine, but did you really need plan mode? If the plan is detailed, you end up scrolling back and forth in the terminal, mentally collecting feedback — which, let us be honest, is flawed before you even start — or by copying and pasting context from the terminal to a separate note, typing responses, and then copying and pasting everything back into the terminal in a follow-up message. Something like:

> **Component surfacing:** same chrome-banner pattern when viewing a single component, for UX consistency.

Instead of the banner in these instances, I would recommend we add a dedicated section between Information and Files when viewing the component overview. For example: http://localhost:5001/show?file=patterns/application-form

> given a component folder path and config entry, locates `{name}.miyagi.css` and `{name}.miyagi.js` (use the same lookup convention as `lib/state/components.js`

The CSS and JS files for a component will be named as follows: `<component-name>.css` and `<component-name>.js`. It will not contain the word miyagi in the filename.

And that is just two comments from a review with seven.

If you use a more iterative approach, then you know the pain of trying to find where you last left off when reviewing a large, detailed plan. The scrollback is... not ideal. In my mind, this makes the iterative approach essentially a no-op.

Either way, the experience has the same problem code review would have if pull requests were just pasted into a terminal and reviewers had to respond with one unanchored paragraph of feedback.

So I started building **Refined Plan Mode**.

Refined Plan Mode is a small local web app for reviewing AI-generated plans in a more precise, PR-review-style workflow.

The idea is simple:

1. The coding agent writes its plan to a local Markdown file.
2. Refined Plan Mode opens that plan in a browser.
3. I leave comments anchored to specific lines or ranges.
4. The app writes all comments to a structured JSON feedback file.
5. The agent reads that feedback and produces the next version of the plan.

The result is still lightweight, but the interaction feels much more deliberate. Instead of holding seven pieces of feedback in my head while reading a long plan, I can leave each comment exactly where it belongs.

## Why This Exists

The thing I want from plan mode is not just "ask before coding." I want a useful review loop.

A good plan review should let me say that a step is unnecessary, that an assumption is wrong, that a section is too broad, that something should happen later, that a specific file should not be touched, or that a part of the plan is approved. Terminal feedback does not naturally support this. If I want to comment on a specific paragraph, I have to quote it or describe where it appears. If I want to comment on multiple sections, I have to manually assemble those comments into one coherent message.

That creates friction at exactly the wrong moment. Plan mode is supposed to reduce risk. But if reviewing the plan becomes tedious, I am more likely to skim, approve too quickly, or forget feedback I meant to give.

Refined Plan Mode treats the plan as a first-class review artefact. That small shift makes the process feel closer to reviewing a pull request: read, comment inline, submit the review, iterate.

## How The Workflow Works

The current MVP uses a project-local `.plan-review` directory. This can be added to `.gitignore` or kept as artefacts. More on this later.

A coding agent writes the first plan here:

```text
.plan-review/plans/plan-v1.md
```

It also writes the active version to:

```text
.plan-review/.current-version
```

This is a simple text string: `v1`, `v2`, and so on.

Then I start Refined Plan Mode and point it at that directory:

```sh
PLAN_REVIEW_DIR=/path/to/project/.plan-review vp dev --host 127.0.0.1 --port 5173
```

The app loads the current plan and displays it as Markdown source using CodeMirror.

From there I can click a line number to comment on one line or drag across line numbers to comment on a range. All pending comments appear in a sidebar, and lines where I have left comments are highlighted in CodeMirror so I can see at a glance which parts of the plan I have already addressed.

Comments can also be edited or deleted from the sidebar, which turns out to be surprisingly useful. You might start reading the plan, leave a comment, and then find that the agent addressed the topic later. Not a problem: just delete the comment in the sidebar. You might also reconsider an earlier comment as you read more of the plan. Again, not a problem — go back and edit it. These small affordances make the review feel non-committal until you are ready to submit.

When I click **Submit Review**, the app writes structured feedback to:

```text
.plan-review/feedback/plan-v1-feedback.json
```

Here is a truncated example of what that file looks like:

```json
{
  "planFile": ".plan-review/plans/plan-v1.md",
  "version": "v1",
  "timestamp": "2026-04-26T22:44:39.927Z",
  "status": "changes_requested",
  "comments": [
    {
      "anchorType": "line",
      "startLine": 20,
      "endLine": 20,
      "originalText": "- **Component surfacing:** same chrome-banner pattern...",
      "id": "7e11cc76-2444-4e4f-a4f7-97855557c41a",
      "body": "Instead of the banner in these instances, I would recommend we add a dedicated section between Information and Files."
    },
    {
      "anchorType": "line",
      "startLine": 128,
      "endLine": 128,
      "originalText": "- `status` is `\"ok\" | \"warn\" | \"exceed\"` with `WARN_RATIO = 0.8`",
      "id": "f96d7fe5-9e39-4ce1-9474-b37d54f9fef9",
      "body": "Is the warn ratio configurable?"
    },
    {
      "anchorType": "range",
      "startLine": 206,
      "endLine": 210,
      "originalText": "3. **With config**: drop the example config into a fixture project, then...",
      "id": "026e663c-1222-481c-b9b2-40cbf80a4988",
      "body": "Use the Chrome DevTools MCP/CLI for these tests so you can get real visual feedback from the browser."
    }
  ]
}
```

Each comment includes the anchor type, the line or range it refers to, the original text from the plan, and the reviewer's feedback. The agent can read this structure directly and address each comment in the next revision.

Then I tell the agent:

```text
I reviewed your plan. Read the feedback from:

.plan-review/feedback/plan-v1-feedback.json

Address every comment, then, before presenting the plan again for review, write the revised full plan to:

.plan-review/plans/plan-v2.md

Also update:

.plan-review/.current-version

to:

v2

Do not summarize or truncate the plan.
```

The agent revises the plan, writes `plan-v2.md`, and presents the plan again using its normal UI.

That last part turned out to be important. Refined Plan Mode improves the feedback loop, but the agent's own approval mechanism should still have the final say.

When the plan looks good, I click **Approve** in Refined Plan Mode. The app writes the approval status and copies the approved version to:

```text
.plan-review/approved-plan.md
```

Then I can approve execution in the coding agent's own UI.

After a couple of review rounds, the `.plan-review` directory ends up looking something like this:

```text
.plan-review/
├── .current-version
├── approved-plan.md
├── feedback/
│   ├── plan-v1-feedback.json
│   └── plan-v2-feedback.json
└── plans/
    ├── plan-v1.md
    └── plan-v2.md
```

Every version of the plan and every round of feedback is preserved. That history is useful on its own: it gives you a record of how the plan evolved and what was changed in response to which comments.

## What Exists In The MVP

The current version is small, but usable. It includes a local browser-based review UI with CodeMirror-powered Markdown source viewing, versioned plan files, line and range comments with a comment sidebar, draft comment persistence across reloads, JSON feedback output, and both a submit review and approve flow that writes a canonical approved plan.

It is not trying to be a full code review tool. It is deliberately scoped to one thing: reviewing a single AI-generated plan. That constraint is useful. It keeps the tool understandable.

## What Still Needs Work

There are plenty of things I would like to improve. Text-selection comments (where you highlight a specific phrase and attach a comment to it) are not yet implemented but are high on the list. Multi-line selection could feel smoother, and the app could detect new plan versions automatically rather than requiring a manual reload. On the prompting side, slash commands could reduce the manual copy-pasting, and a VS Code wrapper might make sense later.

But the MVP already answers the important question: does this make plan review feel better?

For me, yes. The first real review loop felt noticeably cleaner. I was able to read the plan in a proper browser view, leave comments where they belonged, submit them as a batch, and have the agent produce a revised plan from that structured feedback. That is the core loop. Everything else is polish.

## Why I Like This Pattern

What I like about this approach is that it does not require the coding agent to become smarter in some magical way. It gives the human a better interface.

That matters. A lot of AI coding workflow problems are not model problems. They are interaction problems. The model can produce a decent plan, but the human needs a good way to inspect, shape, and approve it.

Refined Plan Mode is my first pass at that idea. A small local tool, built for my own workflow, that treats the plan as something worth reviewing properly before the code changes begin.

## Appendix: The Prompts

For the first plan:

```text
When you produce your plan, write the full plan as markdown to the following file:

.plan-review/plans/plan-v1.md

Also create .plan-review/.current-version containing:

v1

Create the directories if they do not exist. Do not summarize or truncate the plan. Then, continue to present the plan to the user.
```

For subsequent review loops:

```text
I reviewed your plan. Read the feedback from:

.plan-review/feedback/plan-v1-feedback.json

Address every comment, then, before presenting the plan again for review, write the revised full plan to:

.plan-review/plans/plan-v2.md

Also update:

.plan-review/.current-version

to:

v2

Do not summarize or truncate the plan.
```

These prompts are intentionally manual. The goal of the MVP is to prove the interaction model before adding deeper automation.
