---
title: Do we no longer care about the code?
pubDate: 2026-07-28
description: "We do. We care about it differently. The attention that used to go into reading the code now goes into the specification, and into the deterministic checks that make non-deterministic tools dependable."
author: Schalk Neethling
tags: [frontend-engineering-explained, ai]
---

I read [The Machine Kept the Code](https://stephanmaximilianhuber.com/posts/the-machine-kept-the-code) by Stephan Huber, and watched Kent C. Dodds on why we should [stop reviewing diffs and start reviewing systems](https://www.youtube.com/watch?v=Xs-U7SY2uNE), and between them they finally convinced me of what I have been toying with in my head. It is not that we do not care about the code anymore; we care about it differently. The system, the end-user experience, and the product are now taking center stage.

As engineers, we are moving up one level, or zooming out, depending on which you prefer, to consider the system that delivers the product that solves a real user problem. We also get to collaborate more closely than ever with the rest of the team on that experience, from product owners and designers to UX practitioners and stakeholders. Many teams have worked this way for years. What changes is the depth, because the specification is now the thing being handed over, and it is a document everyone can read and correct.

We spend our time on the specification, we sweat the details, we ensure we clearly define both success and failure, and then we hand it over to the agent to implement. Once shipped to a testing environment, we test to ensure our expectations are met on every front: performance, accessibility, user experience, the features we introduced or improved, the business goals, and our definitions of success and failure.

The standard we hold ourselves to should rise accordingly, and it should rise across the whole of what we make. A great deal of what we used to accept was accepted because the effort was real and the time was short. When implementation is no longer the expensive part, that defense weakens everywhere at once.

Accessibility and performance are two of the pillars, and they are necessary, but they are not sufficient. Each piece can be accessible and fast and the end result still useless to the person trying to get something done. A product can meet every success criterion and still offer an experience nobody wants to return to. The higher standard has to cover whether the thing is worth using at all, which means it covers the research, the design, the copy, the error states, and the decision about what to build in the first place.

## The Two Questions

When we encounter problems at any point during this new software development lifecycle, we start by asking two familiar questions:

How did this happen?

How can we prevent this from happening again?

We have had to ask and answer them many times during postmortems in our careers. What has changed is where these problems originate and when we catch them. Problems will still reach production. The goal is to catch more of them earlier each time, and to let each one strengthen the checks that come before it.

## When The Answer Is The Specification

If the answer points at the specification, we need to understand where it came up short or where we were too ambiguous. Ambiguity is what really bites when working with AI agents. We must be clear in our language, ensure there is a common understanding, and provide a clear statement of what success and failure mean.

Defining failure deserves as much attention as defining success, and it covers two different things. There are the behaviors that would be wrong: the states the system must not enter, the inputs it must reject, what is explicitly out of scope. Then there are the failure modes: what happens when a request times out, when the network is unavailable, when the data is malformed, and what the user sees in each case. A specification that describes only the desired outcome leaves the agent to invent both, and it will invent them plausibly, which is more difficult to catch than inventing them badly.

State diagrams are one of the most direct ways to remove this kind of ambiguity. Enumerating the states the system can occupy, and the transitions that are legal between them, turns a set of assumptions into a document. Every transition that is not drawn is a transition that should not happen, which converts an unstated boundary into a stated one. Written in a text format such as [Mermaid](https://mermaid.js.org/), the diagram lives in the repository next to the specification, which means the same artifact is readable by the team, by the client, and by the agent implementing against it. It also gives the tests something concrete to assert against, because an illegal transition is a testable condition rather than a matter of judgment. A test that asserts an illegal transition cannot occur is a clear example of the deterministic checks we must build into our systems.

## When The Answer Is The Implementation

The state diagram is a small example of a larger pattern. If the problem is the implementation rather than the specification, we must clearly document the defects, and from there we define the deterministic guardrails and tooling that catch the same defect the next time it appears and report it to the agent in terms it can act on, preventing it from ever reaching `main`.

This is where a fair objection arrives. If we are not reading every line of the code, how do we avoid these problems at all? The answer is that we move the reading. Instead of reading the output, we encode what we know into tools that read the output for us, every time, without getting tired and without skipping the parts that look familiar.

The discipline is to treat every defect as a candidate for a guardrail rather than only as something to fix.

## Where The Investment Goes

### Linting, Including The Rules Only We Need

Linting deserves real investment, and not only the rules that already exist in the ecosystem. The valuable part is identifying what this particular codebase needs that no general-purpose rule set knows about. A one-off custom lint rule, a small command line tool that checks one specific thing, a hook that runs before the agent completes a task: the effort involved in building these used to be difficult to justify for a single project. It is easy to justify now, because each one closes a category of failure permanently.

There is a question worth asking every time we write a piece of guidance for an agent, and everything that follows in this section is an application of it. Could this be a check instead? Guidance asks the model to remember something. A check does not ask. When a skill or a prompt keeps instructing the agent to avoid a particular pattern, that instruction is a lint rule that has not been written yet, and writing it moves the concern out of the probabilistic layer and into the deterministic one.

Not everything can make that move. Taste cannot, and neither can most judgments about whether a design serves the person using it. But a great deal more can than we tend to assume, and the habit of asking is where much of the leverage lives.

### Tests, Well Beyond Unit Tests

Unit tests remain the foundation, but they are the beginning rather than the whole. End-to-end tests with [Playwright](https://playwright.dev/) exercise the flows a user actually performs, using both a mouse and a keyboard. Stress testing belongs in the set where the system has load characteristics worth defending. Accessibility testing through [axe](https://github.com/dequelabs/axe-core-npm) catches the violations that automated inspection can catch.

Automated inspection cannot catch everything in accessibility, which is why I am working on getting the ARIA and Assistive Technologies project running, even if for now that means only on my local machine. The goal is a test suite where the tests drive VoiceOver in Safari and assert on what the screen reader actually announces. The ARIA-AT community group has been building toward exactly this, and the AT Driver standard is the protocol that makes the automation possible. Guidepup is one practical path to running this locally today.

### Scenarios That Describe User Flows

Cucumber scenarios, written in [Gherkin](https://cucumber.io/docs/gherkin/reference/), describe a user flow in language that a non-engineer can read and validate. The scenario becomes both the specification and the test. With computer use, the agent can walk through these flows in a real browser rather than against a set of mocked interactions.

### Continuous Integration

Everything that runs locally should run again in continuous integration, and continuous integration should also run the things that are too slow to justify on every local change. The expensive accessibility sweep, the full visual regression suite, the stress test: these are important enough to run and slow enough that requiring them locally would discourage people from running anything at all.

### Code Review By Agents

Code review by other agents is now part of the pipeline rather than a novelty, and a single reviewer is not the best arrangement. We run a general reviewer that considers the change as a whole, and alongside it a set of reviewers with narrower remits: one for semantics and accessibility, one for best practices, one for security. Narrow remits produce sharper reviews, because a reviewer asked to weigh everything at once tends to report the problems that are easiest to name and pass over the ones that need sustained attention.

The important part is the feedback loop. When something slips past the review, we do not simply fix it. We update the guidance the review tooling works from, so that the same category of problem is caught next time.

### Application And Supply Chain Security

Security is introduced through skills, so that the agent builds with it in mind rather than having it applied afterward. That mechanism is not deterministic, and it is worth being honest about the limit. Guidance in a skill shapes what the agent is likely to do; it does not guarantee what the agent does. The guidance therefore has to be paired with checks that hold regardless of what the agent decided.

[zizmor](https://zizmor.sh/) scans GitHub Actions workflows for the misconfigurations that have driven several real supply chain compromises. [CodeQL](https://github.com/github/codeql) scans the application code. [Knip](https://knip.dev/) reports unused files, dependencies, and exports, and every dependency removed is one fewer package to trust. [publint](https://www.npmjs.com/package/publint) catches packaging errors before a release reaches the people who consume it. [Socket](https://socket.dev/) runs in continuous integration and examines dependencies for malicious behavior rather than only for known vulnerabilities, which matters because a package published an hour ago with a payload in its install script has no advisory attached to it yet. However, dependency configuration should use cooldown periods to begin with, so that a freshly published version is not installable until it has existed long enough for the ecosystem to notice a problem. The two work together: the cooldown buys the time, and behavioral analysis is part of what does the noticing. Most package managers now support cooldowns directly, and the analysis behind the practice is worth reading: of ten prominent supply chain attacks examined, eight had windows of opportunity shorter than a week.

The skills themselves are a supply chain surface in their own right, and a newer one. They are installed from marketplaces and repositories, they run with implicit trust, and they combine natural language instructions, metadata, declared permissions, dependencies, and executable helper code in a single bundle. [SkillSpector](https://github.com/NVIDIA/SkillSpector) exists to scan them before installation, and the figures its authors cite are worth serious consideration: research they point to found vulnerabilities in roughly a quarter of the skills examined, and likely malicious intent in about one in twenty. That is a measure of how thorough these checks now have to become.

### Staging Environments

Staging is where everything comes together and where people, rather than tools, form a judgment. Internal users, a QA department, the client: these are all places where the expectations set out in the specification are checked against the thing that was actually built.

### Production

Learning about and implementing external monitoring such as [Sentry](https://docs.sentry.io/) is critical now, along with real user metrics where they are relevant to the project. Production is the final test environment, and the errors it surfaces are the highest-quality inputs we have. Each one is a candidate for the next lint rule, the next scenario, the next line in a skill. The loop only closes if we are watching.

## What We Will Not Catch

We will not catch everything. We never caught everything before AI either. The hope is that as we improve our tooling, as we invest in it, as the models get better, and as our understanding of how to work with them becomes more effective, the output keeps improving. More importantly, the actual experience of the user, the features we are landing, and the value the users receive keep improving.

## The Maintenance Work That Is New

There is a maintenance responsibility here that we did not really think about before, and it applies to context documents and especially to skills.

As new models are released, we do not necessarily need everything that is currently in our skills. A model that has innate knowledge of a pattern does not need to be told about it, and the instruction that helped one model can add noise for the next. This is a form of decay, and it needs active attention.

The response is the same as everywhere else: invest in tooling, and make the loop measurable rather than impressionistic. Establish a baseline by running a skill's evaluation cases against the new model with no skill loaded at all, which tells you what the model already knows. Run them again with the skill in place. Where the two scores are the same, the skill is carrying instructions the model no longer needs, and those parts can go. Then version the skill and publish it, whether that means a single skill or the whole set.

This is worth dwelling on, because it runs in the opposite direction to everything else here. Deterministic guardrails accumulate. Skills need to shrink.

This is the thinking behind [skills-autoresearch-flue](https://github.com/schalkneethling/skills-autoresearch-flue), an alpha harness I am building on Flue. It evaluates a skill against project fixtures, asks a researcher model to improve it, and reruns the evaluations against the candidate. An improvement sometimes means removing the skill altogether, because a skill that no longer does better than the baseline is not worth loading.

The part [still in planning](https://github.com/schalkneethling/skills-autoresearch-flue/issues) is the one I am most interested in, and it is the question from the linting section made systematic: which parts of a skill would be better served by a deterministic check? Asking that by hand is slow and easy to skip, which means it mostly does not happen. Having the harness surface the candidates would make it routine, and every candidate it finds is one more concern moved out of the layer that only shapes probabilities.

Stephan puts the underlying point well. If the prose is now the artifact that humans read, then the prose is where poor quality does its damage. A specification written carelessly, a decision record nobody revisits, a memory file nobody prunes: these are the things that rot, and they rot in the layer we depend on. The care we used to give to the code has to go somewhere, and this is where it goes.

This is not an unfamiliar problem, which is some comfort. Mermaid exists because of it. The stated goal of the project is to describe diagrams in plain text kept under version control, so that documentation keeps pace with development rather than falling behind it. That is the same decay we now have to manage in our skills and context documents, and the same answer applies: keep the artifact in the repository, keep it under review, and give yourself the tooling to notice when it no longer matches reality.

## Does This Mean You Stop Learning?

One might ask whether any of this means we no longer need to learn. That is the furthest thing from the truth. I would say you should learn more than ever, because it makes the system and the implementation better and, more importantly, it makes the products we deliver better.

A focus on the web platform, on the frameworks and tools you use, and on expanding your knowledge into systems and systems thinking is critical.

Consider a simple example. A few years ago, building a modal or a popover meant writing a considerable amount of HTML, CSS, and JavaScript, and still ending up with something that was not quite accessible and somewhat fragile. Focus management, inert backgrounds, escape key handling, z-index coordination, and the correct semantics for assistive technology were all left to the author. Today the native [`dialog` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) and the Popover API give better results with far less code. The `dialog` element has been available across browsers since March 2022 and is Baseline Widely available; the Popover API reached Baseline Newly available in 2024, with the light-dismiss behavior on iOS and iPadOS resolved in Safari 18.3.

This is the point worth holding on to. Knowing the platform is what allows you to recognize that the correct output is less code. An agent that does not know the Popover API exists will produce a competent-looking implementation of focus trapping, and it will pass review by someone who also does not know. Platform knowledge is what makes a person able to reject work that looks correct.

But if you do not read the code, how will you ever know? As with most things, it is nuanced, and it is not about reading every line. It is again about encoding our knowledge in the skills and the deterministic checks, and it is about paying close attention to implementation details. A guardrail only helps if the person defining it knows what correct behavior looks like, and a specification only removes ambiguity if the person writing it knows where the ambiguity is.

One does not have to read every line of code to answer the question: How was this dialog implemented?

## So, Do We No Longer Care?

No. What we care about now is what is shipped to our users. Not that we did not care before, but this has become our core focus, and it is our responsibility to deliver experiences, services, and products that really start to deliver on the promises made by technology.

## Further Reading

- [The Machine Kept the Code](https://stephanmaximilianhuber.com/posts/the-machine-kept-the-code) by Stephan Huber
- ["Stop reviewing diffs. Start reviewing systems."](https://www.youtube.com/watch?v=Xs-U7SY2uNE) by Kent C. Dodds
- [skills-autoresearch-flue](https://github.com/schalkneethling/skills-autoresearch-flue)
- [Mermaid](https://mermaid.js.org/) and the [mermaid repository](https://github.com/mermaid-js/mermaid)
- [`<dialog>`: The Dialog element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) on MDN Web Docs
- [`HTMLDialogElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement) on MDN Web Docs
- [`::backdrop`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::backdrop) on MDN Web Docs
- [The Popover API is now Baseline Newly available](https://web.dev/blog/popover-baseline) on web.dev
- [`<dialog>` and popover: Baseline layered UI patterns](https://web.dev/articles/baseline-in-action-dialog-popover) on web.dev
- [ARIA and Assistive Technologies (ARIA-AT)](https://w3c.github.io/aria-at/) and the [aria-at repository](https://github.com/w3c/aria-at)
- [AT Driver and ARIA-AT automation](https://github.com/w3c/aria-at-automation)
- [Guidepup ARIA-AT tests](https://github.com/guidepup/aria-at-tests)
- [zizmor](https://zizmor.sh/) and the [zizmor documentation](https://docs.zizmor.sh/)
- [SkillSpector](https://github.com/NVIDIA/SkillSpector)
- [Knip](https://knip.dev/)
- [publint](https://www.npmjs.com/package/publint)
- [Socket](https://socket.dev/)
- [Dependency cooldowns](https://cooldowns.dev/)
- [The case for dependency cooldowns in a post-axios world](https://securitylabs.datadoghq.com/articles/dependency-cooldowns/) from Datadog Security Labs
- [Package managers need to cool down](https://nesbitt.io/2026/03/04/package-managers-need-to-cool-down.html) by Andrew Nesbitt
- [Playwright](https://playwright.dev/) and the [playwright repository](https://github.com/microsoft/playwright)
- [axe-core Playwright integration](https://github.com/dequelabs/axe-core-npm) from Deque
- [Sentry documentation](https://docs.sentry.io/)
- [web-vitals](https://github.com/GoogleChrome/web-vitals) from the Google Chrome team
- [Gherkin reference](https://cucumber.io/docs/gherkin/reference/) from Cucumber
- [CodeQL](https://github.com/github/codeql) and the [CodeQL action](https://github.com/github/codeql-action)
