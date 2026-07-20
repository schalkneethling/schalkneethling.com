# Pull request guidance

Pull requests should be small enough that a reviewer can understand the whole
change without switching into scanning mode. Review quality matters more than
maximizing the amount of work included in one PR.

## Before starting work

- Read this document when scoping an issue, planning a task, or starting a new
  implementation.
- Identify the smallest coherent change that answers one primary review
  question.
- Split work along independently mergeable behavior boundaries, not arbitrary
  file or line counts.
- Sequence dependent PRs so each merge leaves `main` working, testable, and not
  misleading.
- Write or refine issues around those same reviewable slices. Avoid acceptance
  criteria that quietly combine policy, schema, generation, remote writes, and
  UI work when those can land safely in sequence.

## Size and scope

The recent Standard.site configuration and verification PRs are good reference
sizes. A PR up to roughly twice that size is generally comfortable. Treat
anything larger as a mandatory checkpoint: either split it or explain why it is
still one coherent review unit.

Size is about cognitive load, not only changed lines. Tests and required
documentation belong with the behavior they support, but they still contribute
to the amount a reviewer must understand.

A useful heuristic is:

> One PR should answer one primary review question.

Examples include:

- Is this configuration correct?
- Does this endpoint behave correctly?
- Does this schema represent the permitted states?
- Does this generator produce the correct dry-run plan?
- Are authenticated writes adequately protected?

## Keep the diff focused

- Do not bundle opportunistic refactors, formatting churn, dependency updates,
  or unrelated cleanup.
- Keep policy decisions, configuration, schemas, generation, synchronization,
  and reader-facing UI separate when they can be merged safely in sequence.
- Include the tests and operational documentation needed to validate and use
  the change.
- Make the purpose of every changed file clear from the PR description.
- Prefer a follow-up issue over expanding the current PR beyond its review
  question.

## Reassess during implementation

Stop and re-scope when:

- the implementation grows beyond the original acceptance criteria;
- the PR starts answering multiple independent review questions;
- the description needs several unrelated sections to explain the change;
- reviewing the diff requires holding multiple workflows in mind; or
- a safe, independently testable seam becomes apparent.

If splitting would leave a PR broken, misleading, or impossible to validate,
keep the necessary pieces together and explain that constraint in the PR.

## Before requesting review

- Confirm the diff still matches the issue and stated review question.
- Remove unrelated changes and generated noise.
- Validate the change in proportion to its risk.
- Summarize what changed, how it was tested, and what was deliberately deferred.
- Create follow-up issues for deferred work that might otherwise be forgotten.
