---
title: "Part 1: Structuring Feature Specifications for AI Agents"
pubDate: 2026-02-13
description: "How to structure a handoff document that enables AI agents to perform gap analysis and implementation planning—with traceable acceptance criteria, UI state inventories, and explicit business logic."
author: "Schalk Neethling"
tags: ["ai", "codingwithai"]
part: 1
---

I have been experimenting with using AI agents, specifically Claude in both the web interface and Claude Code, to assist with implementation planning on client projects. Recently, I needed to tackle a Store Locator feature with a comprehensive product requirements document (PRD), multiple UI states, and intricate business logic around search radii and ranking systems.

The challenge was not whether an AI agent could help, but how to hand off the work in a way that set the agent up for success. Asking an agent to "implement the store locator based on this PRD" would be setting it up for failure. Too much ambiguity, too much scope, too little structure.

What I needed was a handoff document that distilled scattered requirements into a focused, unambiguous specification. Something that would guide the agent's work while also serving as lasting documentation.

This is Part 1 of a three-part series. Here I will cover the structure of the handoff document itself. [Part 2](/posts/part-2-organising-reference-materials-for-ai-agent-sessions/) covers organising reference materials and folder structure, and [Part 3](/posts/part-3-running-an-ai-agent-implementation-planning-session/) covers the session prompt and workflow.

## Start with Explicit Scope

The document starts by defining what is in scope and what is not. This sounds obvious, but it is crucial for keeping an agent focused. My PRD covered multiple features, store locator overview, detail page, and forms, but I only needed the overview implemented.

```markdown
This document covers **Store Locator Overview only**:

- Search functionality (location input, geolocation, autocomplete)
- Map display and interactions
- Store type legend and information overlay
- Search results list (grouping, sorting, store cards)
- Map tooltip interactions

**Explicitly out of scope:**

- Store Locator Detail Page
- Store Locator Forms
- Map styling/colour changes
```

Without this, the agent might spend tokens ("polluting" context) analysing requirements it should ignore or propose implementation work that falls outside the current sprint.

## Traceable Acceptance Criteria

Each user story is broken down into individually-identifiable acceptance criteria. The key here is traceability. Every criterion has an ID that can be referenced throughout the gap analysis and implementation plan:

```markdown
#### US-SEARCH-01: Location-Based Search

> **As a user**, I want to search for stores by entering a city or postal code,
> so that I can quickly find store locations that match my request.

| ID     | Criterion                | Details                                                                |
| ------ | ------------------------ | ---------------------------------------------------------------------- |
| AC-S01 | Autocomplete suggestions | Input field provides location-based autocomplete suggestions only      |
| AC-S02 | Search trigger           | Selecting an autocomplete suggestion triggers the search               |
| AC-S03 | Results display          | Search results show nearest stores based on location and search radius |
| AC-S04 | URL persistence          | Search criteria are added to the URL                                   |
| AC-S05 | Manual search trigger    | Clicking the "Search" button triggers the search                       |
```

When the agent later identifies a gap, it can say "AC-S04 is not implemented" rather than "the URL thing is missing." This precision carries through to the implementation plan, where each phase references the specific criteria it addresses.

I ended up with 47 acceptance criteria across 6 user stories. That might seem like overkill, but each one represents a testable behaviour. When the agent proposes an implementation phase, I can immediately see which criteria it covers and whether the scope is appropriate for a single merge request.

## UI States Inventory

Beyond acceptance criteria, I documented every distinct UI state the feature can be in:

1. **Initial state** — No search performed, map shows Europe
2. **Autocomplete active** — User is typing, suggestions dropdown visible
3. **Search results (relevance)** — Results grouped by store type
4. **Search results (distance)** — Flat list ordered by distance
5. **No results state** — Search completed but nothing found
6. **Map tooltip active** — User has clicked a store marker

For each state, I described the visual characteristics. What elements are visible, what data is displayed, what interactions are available:

```markdown
#### Initial State (No Search)

**Description:** Page loaded, no search performed yet.

**Visual characteristics:**

- Search input empty with placeholder (e.g., "Enter city or postal code")
- "Current Location" button visible
- "Search" button visible
- Store type legend visible (Company, Partners, External)
- "More Information" link visible
- Map shows Europe view
- No results UI state shown
```

This gives the agent a concrete reference for comparing against the current implementation. During gap analysis, it can check whether each state exists and whether the visual characteristics match.

## State Machine Guidance

Rather than prescribing exact state machines, I provided guidance on what to model and let the agent create proper diagrams:

```markdown
#### States

INITIAL
AUTOCOMPLETE_ACTIVE
SEARCHING
RESULTS_RELEVANCE
RESULTS_DISTANCE
NO_RESULTS
ERROR

#### Events/Transitions to Model

| From State          | Event                        | To State            | Side Effects                      |
| ------------------- | ---------------------------- | ------------------- | --------------------------------- |
| INITIAL             | input_focus + typing         | AUTOCOMPLETE_ACTIVE | Fetch autocomplete suggestions    |
| AUTOCOMPLETE_ACTIVE | suggestion_selected          | SEARCHING           | Use selected location coordinates |
| SEARCHING           | results_received (count > 0) | RESULTS_RELEVANCE   | Update URL, centre map            |
```

I also noted parallel states that should be modelled separately. The map tooltip can be open or closed regardless of whether you are viewing results by relevance or distance.

The agent then creates Mermaid diagrams from this guidance, potentially identifying transitions or edge cases I had not considered. This collaborative aspect is crucial and the agent adds rigour to the specification process.

## Document Business Logic Explicitly

Some requirements cannot be inferred from UI designs. The store locator has country-specific search radii:

```markdown
| Country     | Partners | Company | External | Fallback                            |
| ----------- | -------- | ------- | -------- | ----------------------------------- |
| Italy       | 10 km    | 30 km   | 80 km    | Nearest Company in country          |
| Germany     | 50 km    | 100 km  | 100 km   | Nearest Company in country          |
| Netherlands | 10 km    | 30 km   | 100 km   | Must always include certain studios |
```

It also has a point-based ranking system where stores accumulate points based on certifications and features. Initially, I documented the full scoring logic until I realised the scores were pre-calculated and stored in the Algolia index.

This is an important distinction to make explicit: **what needs implementation versus what just needs consumption**. The agent does not need to implement the scoring algorithm; it needs to use the `sSortIndex` value returned from Algolia for sorting. Being explicit about this avoids wasted effort and confusion.

```markdown
### Ranking Logic (sSortIndex)

When sorting by relevance, stores are ordered by a point-based ranking system.
**The final score is pre-calculated and stored in Algolia**, no client-side
calculation is required.

**Sorting rules (implemented client-side using Algolia data):**

1. Higher `sSortIndex` = listed higher
2. If `sSortIndex` is equal, closer distance = listed higher
3. Primary grouping by store type (Company → Partners → External)
```

## Include Technical Context

The agent needs to know what technologies are in play. I documented the stack and external services:

```markdown
| Component            | Technology               | Notes                              |
| -------------------- | ------------------------ | ---------------------------------- |
| Search/Filtering     | Algolia InstantSearch.js | Index needs updating to production |
| Autocomplete         | Algolia Autocomplete.js  | Location-based suggestions         |
| Map                  | Leaflet + OpenStreetMap  | Via Webgeoservice                  |
| Distance Calculation | Geoapify Routing API     | For road distance calculations     |
```

I also noted configuration issues the agent should flag, like the fact that the Algolia index was still pointing to a development instance with fake data.

## Use Your Base Language

One lesson from this process: my initial document included non-English UI text from the Figma designs. As a result, I need the agent to understand that we can default to English strings for mocking and our base strings as translation strings are handled separately by our i18n system. Here I also took advantage of the LLM's ability to do translations from the UI designs to the default English strings.

```markdown
> **Note on translations:** All UI text is managed through translation strings.
> The implementation uses English as the base language; translations are handled
> separately via the project's i18n system.
```

It was also critical, however, that the agent knew that our base language strings are configured in a `strings` module and then exposed to our templates. By letting it infer how these strings are used by the UI from the `i18n.js` utility and adding it's findings to the relevant `SKILL.md` file, I was able to guide the agent to understand the process and add it to the handoff document.

## The Structure That Emerged

The final handoff document had this structure:

1. **Feature Overview** — Objective, scope, assumptions
2. **User Stories & Acceptance Criteria** — 6 user stories, 47 traceable criteria
3. **UI States & Visual Reference** — 6 states with visual characteristics
4. **State Machine Specification** — Guidance for UI and data fetching state machines
5. **Business Logic & Data Requirements** — Search radii, ranking logic, store types
6. **Technical Context** — Stack, external services, configuration notes
7. **Gap Analysis Instructions** — How the agent should approach the analysis
8. **Implementation Planning Guidelines** — Test-driven development (TDD) approach, phase structure, merge request (MR) guidelines

Appendices included a quick-reference checklist of all acceptance criteria and Figma reference descriptions.

## What Makes This Work

This structure works because it treats the AI agent as a collaborator that needs context, not a magic box that needs instructions.

**Structured input produces structured output.** The traceable acceptance criteria carry through from the handoff document to the gap analysis report to the implementation plan. There is no ambiguity about what "the search feature" means.

**Explicit scope prevents drift.** The agent knows exactly what it should and should not analyse, propose, or implement.

**Business logic documentation prevents hallucination.** The agent does not need to guess country-specific search radii or ranking algorithms. Documenting them explicitly means the agent uses real requirements, not plausible-sounding inventions.

In [Part 2](/posts/part-2-organising-reference-materials-for-ai-agent-sessions/), I will cover how I organised reference materials, screenshots, Figma links, and agent outputs, into a self-contained folder structure the agent can access throughout the session.

## Further Reading

- [Mermaid State Diagram Syntax](https://mermaid.js.org/syntax/stateDiagram.html)
- [XState Documentation](https://xstate.js.org/docs/) — If you want to formalise state machines in code
