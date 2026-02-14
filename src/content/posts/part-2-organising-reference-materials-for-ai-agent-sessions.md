---
title: "Part 2: Organising Reference Materials for AI Agent Sessions"
pubDate: 2026-02-14
description: "How to structure a self-contained folder of specifications, screenshots, and Figma links that an AI agent can reference throughout an implementation planning session."
author: "Schalk Neethling"
tags: ["ai", "codingwithai"]
part: 2
---

A handoff document alone is not enough. When working with AI agents on implementation planning, the agent needs a self-contained working context it can reference at any point, without relying on conversation history or asking you to re-upload files.

This is Part 2 of a three-part series. [Part 1](/posts/structuring-feature-specifications-for-ai-agents/) covered the structure of the handoff document itself. Here I will cover how to organise reference materials into a folder structure that serves both the agent and your team. [Part 3](/posts/part-3-running-an-ai-agent-implementation-planning-session/) covers the session prompt and workflow.

## The Problem with Conversation-Based Context

In a typical chat session, you might upload a screenshot, discuss it, then upload another. The agent sees these in its context window, but that context has limits. In a long session, earlier uploads might fall out of context. If you start a new session, you need to re-upload everything. You also need to deal with the needle in a haystack problem of searching through the conversation history for specific information, although this is constantly getting better.

More importantly, conversation-based context is ephemeral. Once the session ends, those screenshots and specifications disappear. The next developer (or agent) who works on this feature has no record of what informed the implementation decisions.

## A Self-Contained Feature Folder

I created a dedicated folder in our docs app:

```text/plain
docs/features/store-locator-overview/
├── README.md
├── handoff.md
├── screenshots/
│   ├── 01-initial-state.png
│   ├── 02-autocomplete.png
│   ├── 03-results-relevance.png
│   ├── 04-results-distance.png
│   ├── 05-no-results.png
│   └── 06-map-tooltip.png
└── outputs/
    └── .gitkeep
```

This lives in our monorepo alongside the actual code. The agent can `view docs/features/store-locator-overview/` at any point to see what is available, then drill into specific files as needed.

### Why `features/` as a Top-Level Folder

Our existing docs structure had folders for `backend/`, `frontend/`, `devops/`, `testing/`, and `general/`. These are all "how we build" documentation, technical processes and conventions.

The store locator specification is "what we are building", its feature requirements and implementation decisions. It serves a different purpose and has a different lifecycle.

Rather than restructure the entire docs hierarchy (which would require team buy-in and potentially break existing links), I added `features/` as a new top-level folder:

```text/plain
docs/
├── backend/
├── devops/
├── features/        ← new
│   └── store-locator-overview/
├── frontend/
├── general/
└── testing/
```

This is the lowest-lift change that solves the immediate need while establishing a pattern. If `features/` proves useful over time, it becomes a natural reference point for a future conversation about broader restructuring.

## Naming Screenshots Semantically

I numbered the screenshots to match their order in the handoff document and gave them descriptive names:

```text/plain
01-initial-state.png
02-autocomplete.png
03-results-relevance.png
04-results-distance.png
05-no-results.png
06-map-tooltip.png
```

The README maps these to the corresponding sections in the handoff document:

```markdown
## Screenshot Reference

| File                       | UI State                               | Handoff Section |
| -------------------------- | -------------------------------------- | --------------- |
| `01-initial-state.png`     | Empty search, Europe map view          | 3.1.1           |
| `02-autocomplete.png`      | Search input with suggestions dropdown | 3.1.2           |
| `03-results-relevance.png` | Results grouped by store type          | 3.1.3           |
| `04-results-distance.png`  | Results sorted by distance (flat list) | 3.1.4           |
| `05-no-results.png`        | "No dealers found" state               | 3.1.5           |
| `06-map-tooltip.png`       | Map marker tooltip variations          | 3.1.6           |
```

This cross-referencing reduces ambiguity. When the agent analyses the autocomplete state, it knows exactly which screenshot to examine and which section of the handoff document describes the expected behaviour.

## The Outputs Folder

The `outputs/` folder is where the agent saves its deliverables:

```text/plain
outputs/
├── state-machines.md
├── gap-report.md
└── implementation-plan.md
```

I start with just a `.gitkeep` file so the folder is tracked in git before the agent creates anything. This keeps everything together. The specification, the reference materials, and the generated artifacts all live in one place.

These outputs are not throwaway artifacts. The state machine Mermaid diagrams document the intended behaviour. The gap report captures the state of the implementation at a point in time. The implementation plan records the decisions about how to approach the work. Future developers can reference these to understand why things were built a certain way.

> **Note:** These documents are, for the most part, also living documentation. As the agent works on the feature, it will update the state machines, gap report, and implementation plan with its findings. As you well know, a lot of things become clearer when the implementation starts and one starts to interact with the code and the user interface.

## Enhancing with Figma Links

Static screenshots work, but they are snapshots in time. If the design updates, your screenshots are outdated. They also only capture what you exported, in this instance I had desktop views, but no mobile.

> **Note:** Since the time of writing I have decided to also include mobile screenshots in the `screenshots/` folder.

If you are using Claude Code or Cursor with the Figma MCP configured, you can include direct links to Figma selections:

```markdown
### Figma Links (Live Reference)

For agents with Figma MCP configured. These link directly to the design source.

| UI State            | Desktop            | Mobile             |
| ------------------- | ------------------ | ------------------ |
| Initial State       | [View](figma-link) | [View](figma-link) |
| Autocomplete        | [View](figma-link) | [View](figma-link) |
| Results (Relevance) | [View](figma-link) | [View](figma-link) |
| Results (Distance)  | [View](figma-link) | [View](figma-link) |
| No Results          | [View](figma-link) | [View](figma-link) |
| Map Tooltip         | [View](figma-link) | [View](figma-link) |

> **Note:** Figma links require the [Figma MCP](https://github.com/figma/mcp-server-guide/) to be configured. If unavailable, use the screenshots in the `screenshots/` folder.
```

This gives the agent access to the source of truth. It can inspect spacing values, colour tokens, component variants, and responsive breakpoints directly from Figma. The desktop and mobile columns surface responsive considerations during gap analysis which the agent can flag if mobile-specific behaviours are missing from the implementation.

> **Note:** The benefit of the Figma MCP is directly correlated to how well it is structured for this use case and, critically, discussions had between design and development to ensure a common vocabulary and understanding of the design system and design tokens. Find links to additional reading material at the end of this post.

Keep the static screenshots as a fallback. They work in any context, are versioned with your docs, and provide a baseline reference even without MCP access.

## The README as Orientation

The README serves as the entry point for both the agent and human developers:

```markdown
# Store Locator Overview

This folder contains specifications, reference materials, and implementation
documentation for the Store Locator Overview feature.

## Contents

| Path           | Description                                                                   |
| -------------- | ----------------------------------------------------------------------------- |
| `handoff.md`   | Full specification: user stories, acceptance criteria, state machine guidance |
| `screenshots/` | Figma UI states showing expected designs                                      |
| `outputs/`     | Generated documentation: state machines, gap report, implementation plan      |

## Scope

This documentation covers the **Store Locator Overview** only:

- Search functionality (location input, geolocation, autocomplete)
- Map display and interactions
- Store type legend and information overlay
- Search results list (grouping, sorting, store cards)
- Map tooltip interactions

**Out of scope:** Store Detail Page, Forms, map styling, Studio Events, Calendly Widget.

## Generated Outputs

After the implementation planning session, the `outputs/` folder will contain:

- `state-machines.md` — Mermaid diagrams for UI and data fetching states
- `gap-report.md` — Analysis of what is missing vs. the specification
- `implementation-plan.md` — Phased, TDD-driven implementation approach
- and other related documents that represents artifacts of the implementation planning and implementation itself
```

When the agent starts a session, it can run `view docs/features/store-locator-overview/` to orient itself. The README tells it what is available and where to find it. This is faster than parsing the folder structure and reduces the chance of the agent missing something.

## Version Control Considerations

A few decisions to make about what gets committed:

**The handoff document and README:** Definitely commit these. They are documentation.

**The screenshots:** Your call. They can be large, but they provide a versioned baseline. If designs change significantly, having the original screenshots alongside the gap report shows what the implementation was targeting at the time.

**The outputs:** Definitely commit these. The state machines, gap report, and implementation plan are valuable documentation. They capture decisions and analysis that inform the implementation. All other related documents that represents artifacts of the implementation planning and implementation itself should also be committed if valuable.

I tend to let these accumulate during the active planning and development phases. Once we commit, merge, and mark the feature as complete, I will than do a cleanup and consolidation with the help of an AI agent.

## The Pattern Is Reusable

This folder structure is not specific to the store locator feature. Any feature with enough complexity to warrant a handoff document can follow the same pattern:

```text/plain
docs/features/{feature-name}/
├── README.md
├── handoff.md
├── screenshots/
└── outputs/
```

Over time, you build a library of feature documentation that serves multiple purposes: guiding AI agent sessions, onboarding new developers, and recording implementation decisions for your future selves.

In [Part 3](/posts/part-3-running-an-ai-agent-implementation-planning-session/), I will cover the session prompt, how to structure tasks with checkpoints, guide the agent through sequential deliverables, and create space for collaborative iteration.

## Further Reading

- [Structure your Figma file for better code](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file/)
- [How to structure Figma files for MCP and AI-powered code generation](https://blog.logrocket.com/ux-design/design-to-code-with-figma-mcp/)
