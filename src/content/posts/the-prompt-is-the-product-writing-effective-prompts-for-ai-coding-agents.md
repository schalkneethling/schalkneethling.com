---
title: "The Prompt is the Product: Writing Effective Prompts for AI Coding Agents"
pubDate: 2026-03-11
description: "How I structure prompts for AI coding agents to get considered implementation plans instead of premature code."
author: "Schalk Neethling"
tags: ["codingwithai"]
---

There is a gap between how most developers interact with AI coding agents and what these tools are actually capable of when given sufficient context. The difference almost always starts with the prompt. Model choice is important, tooling can make a real difference, but the quality and structure of the instructions you provide matters most.

I have been working with AI coding agents daily for some time now, and a pattern has emerged in how I write prompts for feature-level work. These are not one-line requests. They are detailed, considered briefs that treat the agent as a capable collaborator rather than an autocomplete engine. What follows is a breakdown of what goes into one of these prompts, and why each part matters.

## Ground the Agent in Your Codebase

The first thing I do is point the agent to a specific file or component. In a recent prompt, I referenced a concrete form component path and explained the architectural pattern it follows, composable form sections with reusable Zod schemas and validation.

This matters because AI agents do not carry institutional knowledge between sessions (there are tools that are attempting to fill this gap, but for most cases today this still holds true). Every interaction starts from zero. By pointing to a real file and explaining the reasoning behind its structure, you give the agent something tangible to inspect and a mental model to work within. Without this grounding, the agent might invent its own patterns, and they will almost certainly diverge from your codebase conventions.

## Describe the Feature as Behaviour, Not Implementation

Rather than dictating how the feature should be built, describe what it should do from the user's perspective. In my prompt, the requirement was straightforward: editors using the CMS should be able to specify which sections of a form are visible, and the frontend should render accordingly.

This gives the agent room to reason about the problem rather than just executing instructions. You want the agent to think through implications. In this case, that dynamic section visibility also means dynamic schema composition, rather than mechanically following a recipe.

Notice the deliberate phrasing: "this may or may not need some additional consideration and refactoring." This signals to the agent that it should evaluate the current code and make a judgement call, rather than assuming either way.

## Set Architectural Constraints

A good prompt establishes boundaries without being prescriptive. I typically cover three areas: extensibility (this pattern must work for future forms, not just the one at hand), developer ergonomics (the pattern should be intuitive for developers new to the project), and integration boundaries (how the feature connects to other systems — in this case, a PHP backend serving configuration via Twig templates).

These constraints shape the agent's thinking at the design level. Without them, you will get a solution that works for the immediate case but creates maintenance headaches down the line.

## Establish Quality Expectations Upfront

I always include explicit expectations around testing. In this prompt, I specified a test-driven approach, required integration tests covering all configuration variations, and importantly, mandated that existing code coverage gaps be addressed _before_ implementation begins.

I also reference testing guidance that already exists in the codebase. This is a small detail that pays off significantly. It tells the agent that conventions exist and should be followed, rather than inventing its own test patterns.

## Ask for a Plan, Not Code

Perhaps the most important part of the entire prompt is the closing instruction: "Please review the codebase as appropriate to get a clear understanding of the problem and then proceed to propose a considered and detailed implementation plan."

This single sentence changes the nature of the interaction entirely. Instead of generating code immediately, which at this stage would be premature and likely misaligned with your codebase in several ways, the agent first builds understanding and then articulates a plan you can review, challenge, and refine before a single line of production code is written.

## The Prompt in Full

This is a typical length for the feature-level prompts I write. Sometimes they are shorter, sometimes a little longer, but this represents a good baseline. Every sentence serves a purpose, and that is the real takeaway. Specificity and context are what separate a productive AI interaction from a frustrating one.

Here is the full prompt:

```markdown
Please refer to the following form component
@apps/component-library/src/components/patterns/forms/event-registration-form

As you will notice, it is built up out of form sections.
This is a pattern we recently adopted and will continue going forward.
There are several benefits, such as:

- The obvious. Reusable sections
- Composable forms
- Reusable and composable Zod schemas and validation
- Ease of maintenance

We need to introduce something new that will lean on this new architecture for forms.
For right now, we need to do this for the event registration form, but when we plan
the implementation, we must think ahead so that this same pattern will work for
existing forms in @apps/component-library/src/components/patterns/forms and forms
we build in the future. The implementation should also ensure that the pattern is
clear and intuitive, so it is easy to use for all developers on the code base,
whether they have historical knowledge or are new to the project.

The new feature will allow editors using the CMS to specify which sections of a
form they want to show. The backend will then provide a form configuration object
to the frontend, and based on this, we will only render the appropriate sections.
However, this also means that we must ensure that the Zod schemas and validation
are composed accordingly, so this may or may not need some additional consideration
and refactoring.

As always, we will follow a test-driven approach. As such, we must also ensure that
we cover all possible variations through integration tests. One test per variation
that confirms that only the relevant sections are included, and that validation
works as expected, and the correct payload is sent to the server during submission.

As this will also include refactoring existing code, we must ensure that all
relevant tests pass before and after these changes. If a specific code path does
not yet have code coverage, we need to address this BEFORE starting implementation.

With all tests, please follow the appropriate guidance that is provided in the
codebase.

We will define what a configuration object will look like using the relevant schema
file for the form at hand (the event-registration-form in this case), and also then
mock variations using the relevant mocks file. It is critical that this will work
well for the backend team as an integration point, inside the Twig file, but can
also be exposed to JavaScript via a JSON string object inside a script element,
and used there with only minor transformation. One transformation that is pretty
much always needed is transforming the snake case variable syntax from PHP to
camel case in JavaScript. This has historically been handled in the relevant Twig
file as part of defining the object that will then be exposed to JavaScript as
mentioned earlier.

Please review the codebase as appropriate to get a clear understanding of the
problem and then proceed to propose a considered and detailed implementation plan.
Thank you.
```

The prompt is not clever. It is not short. It is thorough, intentional, and structured in a way that gives the agent everything it needs to do meaningful work. Treat your prompts with the same care you would treat a technical brief for a colleague, and the results will reflect that investment.

## Further Reading

- [Part 1: Structuring Feature Specifications for AI Agents](posts/structuring-feature-specifications-for-ai-agents/) — The first in a three-part series covering how to structure handoff documents, organise reference materials, and run implementation planning sessions with AI agents. If this post covered the prompt, the series covers everything that happens before you write one.
- [Here is how I use LLMs to help me write code](https://simonwillison.net/2025/Mar/11/using-llms-for-code/) — Simon Willison's detailed account of his own patterns and hard-won intuitions for working with LLMs on code, including why context management matters so much.
- [Prompt engineering overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) — Anthropic's official guide to writing effective prompts, covering techniques like being specific, providing examples, and structuring complex instructions.
