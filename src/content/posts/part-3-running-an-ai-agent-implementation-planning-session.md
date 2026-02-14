---
title: "Part 3: Running an AI Agent Implementation Planning Session"
pubDate: 2026-02-14
description: "How to structure an AI agent session with sequential tasks, review checkpoints, and explicit deliverables—turning a handoff document into actionable state machines, gap reports, and implementation plans."
author: "Schalk Neethling"
tags: ["ai", "codingwithai"]
part: 3
---

With a structured handoff document and organised reference materials in place, the final piece is the session itself. How do you prompt the agent to produce useful deliverables while maintaining checkpoints for review and course-correction?

This is Part 3 of a three-part series. [Part 1](/blog/structuring-feature-specifications-for-ai-agents) covered structuring the handoff document, and [Part 2](/blog/organising-reference-materials-for-ai-agents) covered organising reference materials. Here I will cover the session prompt and workflow.

## The Problem with Open-Ended Prompts

You might be tempted to provide the handoff document and say "analyse this and create an implementation plan." This approach has problems.

First, it gives you no checkpoints. If the agent misunderstands something in the specification, that misunderstanding propagates through the entire analysis. You only discover it at the end, after the agent has done substantial work built on flawed assumptions.

Second, it is unclear where outputs should go. Does the agent put everything in one file? Multiple files? What format? You end up with deliverables that are hard to reference later.

Third, it does not leverage the folder structure you set up. The agent might not know to look at the screenshots or might miss that it should save outputs to a specific location.

## Sequential Tasks with Checkpoints

I structured the session as a sequence of tasks with explicit pause points. Each task produces an artifact that informs the next, building toward the final implementation plan:

```markdown
### Your Tasks (In Order)

Work through these tasks sequentially. Pause after each task and share
your output for my review before proceeding to the next.

**Task 1: Review & Orientation**
Read through the handoff document and review all screenshots.
Share a brief summary of your understanding and any questions.

**Task 2: Create State Machine Diagrams**
Create Mermaid diagrams for UI states and data fetching states.
Save as: `outputs/state-machines.md`
_Pause for review._

**Task 3: Gap Analysis**
Compare the specification against the existing implementation.
Save as: `outputs/gap-report.md`
_Pause for review._

**Task 4: Implementation Plan**
Propose a phased, TDD-driven implementation plan.
Save as: `outputs/implementation-plan.md`
```

The explicit "pause for review" points are critical. They create natural checkpoints where you can verify the agent's understanding before it builds on that foundation.

This is particularly important between Task 3 (Gap Analysis) and Task 4 (Implementation Plan). Once confirmed, the gap analysis becomes another artifact that informs the implementation plan alongside the handoff document, screenshots, and state machines. The agent draws on all of these materials when proposing phases, but the gap analysis is the piece that tells it _what work actually needs to be done_.

By signing off on the gap analysis first, you ensure the implementation plan addresses the _actual_ gaps, not a flawed understanding of them.

Task 1 might seem unnecessary. Why have the agent summarise what it read? But this is where you catch misunderstandings early. If the agent's summary reveals it misinterpreted the scope or missed key requirements, you clarify before it creates state machines based on that flawed understanding.

### Why Test-Driven Development (TDD)?

I have found a significant difference in the quality of output if one adopts a test-driven development (TDD) approach to the implementation planning. However, it is critical that the tests are planned through stubs or even a list of proposed tests in the form, `it("should <describe the test>", () => {})`. I ask for these as agents tend to be a little too eager to implement tests and you often end up with unit tests that should be end-to-end tests, tests that test the web platform's functionality, or tests that are simply too granular.

With well defined tests that are not too broad I find the implementation phases to be markedly better.

## Pointing to the Reference Materials

The prompt starts by orienting the agent to the folder structure:

```markdown
### Context

All reference materials are in: docs/features/store-locator-overview/

This folder contains:

- `handoff.md` — Full specification with user stories and acceptance criteria
- `screenshots/` — Figma UI states showing expected designs
- `outputs/` — Where you will save your generated artifacts

Start by running `view docs/features/store-locator-overview/` to familiarise
yourself with the available materials.
```

This tells the agent exactly where to look and what it will find there. The instruction to `view` the folder first ensures the agent sees the README (an example of this README can be found in the accompanying repository) and understands the structure before diving into the handoff document.

## Specifying Output Locations

Each task that produces an artifact specifies exactly where it should be saved:

```markdown
**Task 2: Create State Machine Diagrams**
Save as: `outputs/state-machines.md`

**Task 3: Gap Analysis**
Save as: `outputs/gap-report.md`

**Task 4: Implementation Plan**
Save as: `outputs/implementation-plan.md`
```

This removes ambiguity and ensures the outputs end up in the right place in your repository. The agent does not need to guess or ask.

## Connecting to Existing Code

The agent needs to know where the current implementation lives:

```markdown
### Existing Implementation

The current store locator implementation can be found in:

- `src/components/store-locator/`
- `src/styles/store-locator/`
- `tests/store-locator/`

Refer to CLAUDE.md and any relevant Agent Skills documents for project
conventions, component architecture, and testing patterns.
```

Replace these paths with your actual folder structure. The reference to project documentation (like CLAUDE.md or similar configuration files) tells the agent to use your established patterns rather than inventing its own.

## Guiding the Gap Analysis

For the gap analysis task, I provided specific structure:

```markdown
**Task 3: Gap Analysis**

Compare the specification and state machine diagrams against the existing
implementation. Produce a structured gap report that includes:

1. **Summary** — High-level overview of implementation completeness
2. **Missing States** — UI or data states not implemented
3. **Missing Transitions** — State transitions not handled
4. **Incomplete Acceptance Criteria** — Reference by ID (e.g., AC-S01)
5. **Missing Tests** — Test coverage gaps
6. **Configuration Issues** — Algolia index, API setup, etc.

For each gap, assign a priority:

- **P0 (Critical):** Core functionality broken or missing
- **P1 (High):** Key user flow impacted
- **P2 (Medium):** Feature incomplete but workaround exists
- **P3 (Low):** Polish/enhancement
```

This structure ensures the gap report is actionable. The priority classifications help you triage what to address first. The requirement to reference acceptance criteria by ID (AC-S01, AC-M05, etc.) maintains traceability from the specification through to the implementation plan.

## Guiding the Implementation Plan

For the implementation plan, I specified the characteristics of good phases and clarified that this task draws on all the materials built up through the session:

```markdown
**Task 4: Implementation Plan**

Using the handoff document, screenshots, state machines, and the **confirmed
gap analysis**, propose a phased TDD implementation plan. Do not proceed
with this task until I have reviewed and signed off on the gap analysis.

Each phase should:

- Be focused and small enough for a single merge request
- Reference specific acceptance criteria being addressed (by ID)
- Include a test plan (unit, integration, visual regression as applicable)
- List implementation steps
- Note dependencies on previous phases
- Avoid disrupting development momentum
- Aim for incremental wins
```

The emphasis on small merge requests is intentional. Large merge requests create review bottlenecks and increase the risk of merge conflicts. Small, focused phases keep momentum going.

I also provided a suggested phase ordering:

```markdown
Suggested phase ordering (adjust based on gap analysis findings):

1. Foundation (state management, URL handling)
2. Search input & autocomplete
3. Results display (list rendering, sorting logic)
4. Map integration (markers, centring)
5. Card interactions (hover effects, map highlighting)
6. Map tooltips
7. Distance calculation
8. Edge cases (no results, errors, fallbacks)
9. Polish (accessibility, performance)
```

This is a starting point, not a prescription. The agent should adjust based on what the gap analysis reveals. If the foundation is already solid, it can skip or minimise that phase.

## Setting Expectations for Collaboration

The prompt closes by setting expectations for how the session should work:

```markdown
### Working Approach

- **Sequential with checkpoints** — Complete each task fully before moving
  to the next; wait for my feedback
- **Ask questions** — If the specification is ambiguous or you discover
  contradictions, flag them
- **Follow project conventions** — Use existing patterns from the codebase;
  refer to CLAUDE.md
- **Be explicit about assumptions** — Document any assumptions in your outputs
- **Reference by ID** — When discussing acceptance criteria, always use
  the AC-XXX identifiers

### Questions Before Starting?

Before beginning Task 1, do you have any questions about the folder structure,
scope, or any constraints I should clarify?
```

The invitation to ask questions before starting is important. It gives the agent permission to surface confusion rather than making assumptions. Better to spend a few messages clarifying scope than to discover misalignment after three tasks are complete.

## The Complete Session Prompt

Here is the full prompt that ties everything together. Adapt the paths to match your project structure:

```markdown
## Session: [Feature Name] - Gap Analysis & Implementation Planning

### Context

I am handing off a comprehensive specification document for the [Feature Name]
feature. All reference materials and outputs for this work are organised in:

docs/features/[feature-name]/

This folder contains:

- `handoff.md` — Full specification with user stories, acceptance criteria,
  state machine guidance, and implementation guidelines
- `screenshots/` — Figma UI states showing expected designs
- `outputs/` — Where you will save your generated artifacts

Start by running `view docs/features/[feature-name]/` to familiarise yourself
with the available materials. The `README.md` provides an overview and a
screenshot reference table mapping filenames to UI states.

### Existing Implementation

The current implementation can be found in:

- [path/to/components]
- [path/to/styles]
- [path/to/tests]

Refer to CLAUDE.md and any relevant Agent Skills documents for project
conventions, component architecture, and testing patterns.

### Your Tasks (In Order)

Work through these tasks sequentially. Each task builds on the previous ones,
creating artifacts that collectively inform the final implementation plan.
Pause after each task and share your output for my review before proceeding
to the next.

---

**Task 1: Review & Orientation**

1. Read through `docs/features/[feature-name]/handoff.md` completely
2. Review all screenshots in the `screenshots/` folder
3. Explore the existing implementation to understand the current state
4. Note any initial questions or areas needing clarification

Share a brief summary of your understanding and any questions before proceeding.

---

**Task 2: Create State Machine Diagrams**

Based on Section 4 of the handoff document, create Mermaid state machine
diagrams for:

1. **UI State Machine** — All user-facing states and transitions
2. **Data Fetching State Machine** — API/async states
3. **Parallel States** — Any independent state groups (e.g., tooltips, overlays)

Save as: `docs/features/[feature-name]/outputs/state-machines.md`

Include a brief explanation of each diagram and any assumptions you made.

**Pause for review before proceeding to Task 3.**

---

**Task 3: Gap Analysis**

Compare the specification (handoff.md + screenshots) and your state machine
diagrams against the existing implementation.

Produce a structured gap report that includes:

1. **Summary** — High-level overview of implementation completeness
2. **Missing States** — UI or data states not implemented
3. **Missing Transitions** — State transitions not handled
4. **Incomplete Acceptance Criteria** — Reference by ID (e.g., AC-S01) with
   details on what is missing
5. **Missing Tests** — Test coverage gaps
6. **Configuration Issues** — API setup, environment config, etc.

For each gap, assign a priority:

- **P0 (Critical):** Core functionality broken or missing
- **P1 (High):** Key user flow impacted
- **P2 (Medium):** Feature incomplete but workaround exists
- **P3 (Low):** Polish/enhancement

Save as: `docs/features/[feature-name]/outputs/gap-report.md`

**Pause for review before proceeding to Task 4.**

---

**Task 4: Implementation Plan**

Using the handoff document, screenshots, state machines, and the **confirmed
gap analysis from Task 3**, propose a phased TDD implementation plan. The gap
analysis identifies what work needs to be done; the other materials provide the
context for how to do it. Do not proceed with this task until I have reviewed
and signed off on the gap analysis.

Each phase should:

- Be focused and small enough for a single merge request
- Reference specific acceptance criteria being addressed (by ID)
- Include a test plan (unit, integration, visual regression as applicable)
- List implementation steps
- Note dependencies on previous phases
- Avoid disrupting development momentum
- Aim for incremental wins

Follow the phase template structure from Section 8 of the handoff document.

Save as: `docs/features/[feature-name]/outputs/implementation-plan.md`

---

### Working Approach

- **Sequential with checkpoints** — Complete each task fully before moving
  to the next; wait for my feedback
- **Cumulative artifacts** — Each task produces an artifact that informs
  subsequent tasks; the implementation plan draws on all of them
- **Gap analysis sign-off required** — Do not start Task 4 until I confirm
  the gap analysis is accurate
- **Ask questions** — If the specification is ambiguous or you discover
  contradictions, flag them
- **Follow project conventions** — Use existing patterns from the codebase;
  refer to CLAUDE.md
- **Be explicit about assumptions** — Document any assumptions in your outputs
- **Reference by ID** — When discussing acceptance criteria, always use the
  AC-XXX identifiers

### Questions Before Starting?

Before beginning Task 1, do you have any questions about:

- The folder structure or file locations?
- The scope of this work?
- Any constraints or preferences I should clarify?
```

Replace the bracketed placeholders with your actual feature name and paths. The prompt is deliberately generic so you can reuse it across features, only the paths and feature name will change.

## What This Produces

Following this workflow, you end up with three artifacts in your `outputs/` folder. Together with the handoff document and screenshots, these form a complete picture that informs the implementation:

**state-machines.md** contains Mermaid diagrams documenting the intended UI states and transitions. These are useful beyond the implementation session. They help future developers understand the expected behaviour and serve as a reference for testing.

**gap-report.md** captures the delta between specification and implementation at a point in time. It documents what was missing, what was incomplete, and what was misconfigured. This is the artifact that tells you _what work needs to be done_.

**implementation-plan.md** draws on all the previous materials—handoff document, screenshots, state machines, and confirmed gap analysis—to break the work into phases with clear acceptance criteria, test plans, and dependencies. This becomes your roadmap for the actual implementation work, with each phase sized for a single merge request.

## Iterating on Deliverables

The checkpoint pauses are not just for catching errors, they are opportunities to refine the outputs.

After reviewing the state machines, you might say "this is missing the error recovery flow. Please add transitions for retry behaviour?" The agent updates the diagrams before proceeding to gap analysis.

After reviewing the gap report, you might say "AC-M05 is actually implemented, it just uses a different component name" and the agent adjusts its findings.

After reviewing the implementation plan, you might say "phase 3 is too large for a single MR, please split it into two or more smaller phases?" and the agent restructures.

This iterative refinement produces better outputs than a single pass would. And because each artifact is saved to a file, you have a record of the final agreed version.

## Conclusion

The combination of a structured handoff document, organised reference materials, and a sequential prompt with checkpoints transforms AI agent sessions from unpredictable experiments into reliable workflows.

The agent has everything it needs in one place. You have checkpoints to verify understanding and refine outputs. The deliverables persist as documentation that outlives the session.

The investment in this setup pays off across multiple dimensions: the quality of the agent's analysis, the documentation that remains, the pattern you can reuse for future features, and the agent's actual implementation work.

There is a lot of details discussed in this three part series. I have [create an accompanying repository](https://github.com/schalkneethling/agent-handoff-templates) that you can use that contains several example documents and templates which you can use as a starting point for your own projects.

## Further Reading

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code) — For using Claude as a coding agent
- [Cursor Documentation](https://cursor.sh/docs) — Another option for AI-assisted development
