---
title: "The First Real Autoresearch Run Was Expensive, Messy, and Extremely Useful"
pubDate: 2026-05-05
description: "I pointed the skills autoresearch harness at a real frontend security project. It cost roughly four dollars, failed before completing a full improvement loop, and taught me more than any of the earlier test runs combined."
author: "Schalk Neethling"
tags: ["ai", "autoresearch"]
---

For a while now I have been exploring an idea I call skills autoresearch. The concept grew out of Andrej Karpathy's [`autoresearch`](https://github.com/karpathy/autoresearch) project, which uses AI agents to automatically run and iterate on research experiments. I wondered whether the same loop could be applied to agent skills themselves: take a skill, run it against evaluation cases, score the output, ask a researcher model to improve the skill based on what it observes, then run the improved skill against the same evaluations and compare. Repeat until the skill improves enough, or you hit a configured limit.

The concept started small. I built an early version of the harness and ran it against a semantic HTML skill, iterating on how an agent writes meaningful markup. More recently I pointed it at a frontend security skill covering topics like XSS detection, CSRF mitigation, and Content Security Policy configuration. Both runs helped me understand the shape of the problem, but both also ran against the limits of the harness I had built from scratch.

Then [Flue](https://flueframework.com/) crossed my radar. It is from the same people behind the Astro framework, but its focus is entirely different: building agent harnesses. That felt serendipitous. After some consideration and discussion, it became clear that Flue might be exactly what I needed to take skills autoresearch to the next level. I spent the last few days working with a coding agent to rebuild the harness on top of Flue, and the result is an alpha tool I am calling [`skills-autoresearch-flue`](https://github.com/schalkneethling/skills-autoresearch-flue).

This week I pointed that alpha harness at something more realistic than the tiny release-notes fixture I had been using during development: a [frontend security autoresearch project](https://github.com/schalkneethling/skills-autoresearch-security). The run reached roughly the four-dollar mark before failing. But it was one of those runs where the system taught me a lot very quickly.

Expensive, yes. Wasteful, no.

## What We Have Built So Far

The harness has three model-backed phases. The **producer** runs the candidate skill against an eval case and writes output files. The **judge** scores the producer output against the eval case and rubric. The **researcher** reads the baseline or previous iteration scores and writes an improved skill.

That separation matters. The producer does the work. The judge evaluates the work. The researcher improves the skill based on the observed failures. It avoids the classic self-grading trap where the same model both answers and decides how good its own answer was.

The alpha config lets you assign different models to each role:

```json
{
  "models": {
    "producer": {
      "provider": "anthropic",
      "name": "claude-haiku-4-5"
    },
    "judge": {
      "provider": "anthropic",
      "name": "claude-sonnet-4-6"
    },
    "researcher": {
      "provider": "anthropic",
      "name": "claude-sonnet-4-6"
    }
  }
}
```

This is not meant to be prescriptive. It is a starting point. The whole point of the harness is to make it possible to experiment with model-role pairings and compare quality, stability, speed, and cost.

The project being researched lives outside the harness. For now, you run commands from a local checkout of `skills-autoresearch-flue`, then pass a `projectRoot` pointing at the autoresearch project:

```bash
npx varlock run -- pnpm exec flue run autoresearch \
  --target node \
  --workspace .flue \
  --id security-audit \
  --payload '{"projectRoot":"../skills-autoresearch-security","runResearch":true,"seedSkillDir":"../skills-autoresearch-security/skills/security-audit","sessionId":"security-audit"}'
```

That is not the interface I want long term. It exposes too much machinery: Flue target, Flue workspace, duplicated run and session IDs, inline JSON, and manual seed skill paths. We have already filed an issue to make this config-driven and much simpler. Eventually, this should feel like:

```bash
skills-autoresearch run --project ../skills-autoresearch-security
```

But alpha tools are where you learn which abstractions are real.

## The First Real Project

The test project was a frontend security skill with two skill responsibilities: `security-audit` and `secure-authoring`. The config looked roughly like this:

```json
{
  "skill_name": "frontend-security",
  "topic_group": "frontend-injection-and-defence",
  "origin_skill": "skills/security-audit",
  "target_score": 0.8,
  "max_iterations": 5,
  "max_concurrency": 1,
  "roles": {
    "judge": "eval-judge",
    "skill_builder": "skill-builder"
  },
  "tracks": [
    {
      "id": "audit",
      "eval_type": "detect-and-fix",
      "role": "task-producer",
      "target_skill": "security-audit"
    },
    {
      "id": "authoring",
      "eval_type": "secure-author",
      "role": "task-producer",
      "target_skill": "secure-authoring"
    }
  ]
}
```

There is an important alpha limitation here: the harness currently improves one seed skill per run. Even if the project has multiple tracks, this run was improving `security-audit` because that was the `seedSkillDir` passed in the payload. Multi-skill improvement is a post-alpha concern.

The run started by generating a fresh baseline. I had cleared the project workspace, so I intentionally did not pass `withBaseline: true`. In this harness, `withBaseline: true` means import an existing baseline, while omitting it means generate a fresh one. That distinction needs clearer naming later, but the behaviour is useful.

## The Good Part: The Scores Were Actually Strong

The baseline completed. That alone was exciting.

To put these scores in context: before rebuilding the harness on Flue, I had already run a baseline against this same security project using the earlier version of the harness. That run provided no agent skill at all — it was a pure test of the model's innate capabilities. When explicitly asked to audit code and fix vulnerabilities, the model scored 2.76 out of 3.0 on detect-and-fix evaluations. Strong. The model clearly has innate knowledge about security vulnerabilities and how to remediate them. But the same run revealed something much more interesting: when the model was simply given an implementation task — a specification to build from, without being explicitly asked to keep an eye on security — the secure-author score dropped to 1.25 out of 3.0. The implementer-only agent did not think about security unless told to. That gap told me exactly where an agent skill was going to be most important.

The Flue-based run confirmed the detect-and-fix side of this picture, with more granularity across a wider set of evaluations. The evals covered React XSS, Twig XSS/CSRF, DOM-based XSS in vanilla JavaScript, CSP configuration, secure React authoring, and a secure embeddable widget. The scores were genuinely promising:

```text
react-xss-detect-and-fix:           4.6/5
twig-xss-csrf-detect-and-fix:       5/5
dom-comment-section-detect-and-fix:  4.9/5
csp-configuration-detect-and-fix:    4/4
react-search-secure-author:          3.65/4
vanilla-widget-secure-author:        3.5/4
```

More importantly, the judge was not just rubber-stamping output. It made nuanced calls.

For the React XSS evaluation, the producer removed an unsafe inline script and stored serialised data in a `data-user` attribute instead. The judge recognised that this was safe from an XSS perspective, but also called out a real behavioural regression: the original code populated `window.__USER__`, and the fix removed that global. Any existing consumer of `window.__USER__` would break silently.

That is exactly the kind of evaluation I want. Not just "is this safer?" but "is this safer without quietly breaking behaviour?"

For the CSP evaluation, the judge noted that `unsafe-inline` and `unsafe-eval` were removed from `script-src`, a nonce-based approach was introduced, `base-uri` and `form-action` were tightened, and `object-src 'none'` along with `frame-ancestors 'self'` were added. Google Analytics and jsDelivr were preserved. And crucially, `style-src 'unsafe-inline'` was retained, avoiding a false positive, while `fonts.gstatic.com` was correctly added for Google Fonts.

That last category matters a lot. Security tools that "fix" things by breaking real integrations are not useful. The judge was showing signs of understanding that distinction.

The researcher then produced a candidate skill. Its summary was unusually clear:

> The previous skill was empty, yielding a strong 0.95 normalised score purely from the base model. The target is 0.8, meaning the skill must not regress good behaviours while fixing the specific gaps identified in scoring.

Remember, there was no skill before this run. The baseline was a pure test of the model's innate capabilities. The researcher observed the scores, identified the specific gaps, and wrote a `RESEARCH.md` summarising what needed to change:

> The previous skill was empty, yielding a strong 0.95 normalized score purely from the base model. The target is 0.8, meaning the skill must not regress good behaviors while fixing the specific gaps identified in scoring: (1) SSR script serialization overcorrection — use Unicode escaping or serialize-javascript rather than removing window.\_\_USER\_\_ entirely; (2) regression avoidance when refactoring public APIs — flag breaking changes explicitly; (3) thumbnail/image src URL validation in authoring tasks; (4) rel=noopener noreferrer on external links; (5) async submit button disable/re-enable correctness in vanilla JS; (6) dead code removal; (7) render clearing logic correctness in vanilla JS. The skill encodes precise guidance for each of these gap areas so the model applies the right fix strategy rather than overcorrecting.

Then it generated a complete `SKILL.md` from scratch. This is worth seeing in full, because it went from nothing to a comprehensive, actionable skill with specific fix strategies, code examples, regression avoidance guidance, and OWASP references — all derived from what the judge observed during baseline scoring:

<details>
<summary>Generated SKILL.md (click to expand)</summary>

```markdown
---
name: frontend-security
description: Audit frontend codebases for security vulnerabilities and bad practices. Use when performing security reviews, auditing code for XSS/CSRF/DOM vulnerabilities, checking Content Security Policy configurations, validating input handling, reviewing file upload security, or examining Node.js/NPM dependencies. Target frameworks include web platform (vanilla HTML/CSS/JS), React, Astro, Twig templates, Node.js, and Bun. Based on OWASP security guidelines.
---

# Frontend Security Skill

Perform security audits and write secure-by-default frontend code across React, vanilla JS, Twig, and Node.js.

## Audit Process

1. Scan for dangerous patterns (innerHTML, dangerouslySetInnerHTML, eval, document.write, |raw)
2. Review postMessage origin validation and target origin usage
3. Check URL/href protocol validation
4. Verify CSP directives and nonce generation
5. Validate input sanitization and API response handling
6. Fix vulnerabilities using the minimum necessary change — do not overcorrect
7. Preserve existing public APIs and flag any breaking changes explicitly in AUDIT.md

## Fix Strategy: Use the Minimum Correct Fix

**Do not overcorrect.** Each fix should eliminate the vulnerability while preserving the existing interface and behavior:

### SSR Script Serialization (React/Node)

When an inline `<script>` embeds JSON-serialized data (e.g., `window.__USER__ = ${JSON.stringify(data)}`), the vulnerability is script-breaking injection via `</script>` in the data. The correct fix is to **escape the data**, not remove the script:

jsx
// CORRECT: Use serialize-javascript to escape </script> injection
import serialize from 'serialize-javascript';

<script
  dangerouslySetInnerHTML={{
    __html: `window.__USER__ = ${serialize(data, { isJSON: true })}`
  }}
/>

// ALSO CORRECT: Unicode-escape the dangerous sequences manually
const safeJson = JSON.stringify(data)
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/&/g, '\\u0026');
<script dangerouslySetInnerHTML={{ __html: `window.__USER__ = ${safeJson}` }} />

// WRONG: Removing the script and using data attributes changes the public API
// and breaks any code that reads window.__USER__


### dangerouslySetInnerHTML with User-Controlled HTML

When content must render as HTML (e.g., server-provided rich text with `<em>`, `<strong>`):

jsx
// CORRECT: Sanitize then render
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p']
}) }} />

// ACCEPTABLE if spec does not require HTML rendering: render as plain text
<div>{content}</div>
// Note in audit: HTML formatting is lost; use DOMPurify if formatting is required


### URL Protocol Validation

Always validate href/src values that come from external data:

jsx
function validateUrl(input) {
  if (!input) return null;
  try {
    const url = new URL(input);
    if (['http:', 'https:', 'mailto:'].includes(url.protocol)) return url.href;
  } catch {}
  return null;
}

// For external links, always add security attributes:
<a href={safeUrl} rel="noopener noreferrer" target="_blank">{text}</a>

// For image src from API responses, validate before use:
const safeThumbnail = validateUrl(result.thumbnail);
{safeThumbnail && <img src={safeThumbnail} alt={result.title} />}


### postMessage Security

javascript
// ALWAYS validate origin before processing any message
window.addEventListener('message', (event) => {
  if (!ALLOWED_ORIGINS.includes(event.origin)) return; // reject silently
  if (!event.data || typeof event.data !== 'object') return;
  // process event.data
});

// ALWAYS use explicit target origin when sending — never '*'
window.parent.postMessage(payload, parentOrigin); // parentOrigin from validated event


### threadId / URL Parameter Validation

javascript
// Allowlist-validate IDs used in URL path segments
function validateThreadId(id) {
  if (!id || typeof id !== 'string') return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;
  return id;
}
// Then additionally encode when building URLs:
const url = `/api/threads/${encodeURIComponent(validatedId)}`;


### DOM APIs vs innerHTML

In vanilla JS, prefer safe DOM APIs over innerHTML for user/server data:

javascript
// CORRECT
const el = document.createElement('div');
el.textContent = userInput; // never parsed as HTML
parent.appendChild(el);

// CORRECT for clearing a container before re-render
container.innerHTML = ''; // safe — no user data involved
// Or:
while (container.firstChild) container.removeChild(container.firstChild);

// WRONG
container.innerHTML += '<div>' + userInput + '</div>'; // XSS


### Async Submit Button Pattern

Disable the button for the full duration of the async operation:

javascript
// CORRECT: disable before await, re-enable in finally
submitBtn.addEventListener('click', async () => {
  submitBtn.disabled = true;
  try {
    await submitComment(author, body);
    // clear form fields on success
    authorInput.value = '';
    bodyInput.value = '';
  } catch (err) {
    showError(err.message);
  } finally {
    submitBtn.disabled = false; // re-enable after async completes
  }
});

// WRONG: re-enables before the promise resolves
submitBtn.disabled = true;
this.submitComment(author, body); // not awaited
submitBtn.disabled = false; // executes immediately, button re-enables instantly


### External Links

All links to external URLs (href validated to http/https) should include:

html
rel="noopener noreferrer"


This prevents the opened page from accessing `window.opener` and leaking the referrer.

## Regression Avoidance

- **Preserve public APIs.** If the original code exposes `window.__USER__`, `deleteComment()` globally, or any other interface, the fix must keep that interface or explicitly document the breaking change in AUDIT.md.
- **Do not remove functionality** to fix a vulnerability if a safe version of the functionality exists.
- **Flag breaking changes** in AUDIT.md: `⚠️ BREAKING CHANGE: This fix changes the data access pattern from window.__USER__ to ...`

## Dead Code

Do not include helper functions that are never called. If you define `escapeHtml()` or `sanitizeUrl()`, use them — or remove them.

## CSP Fixes

When fixing CSP configurations:
- Remove `'unsafe-inline'` and `'unsafe-eval'` from `script-src`
- Generate a unique nonce per request: `crypto.randomBytes(16).toString('base64')`
- Store nonce in `res.locals.nonce` **before** the CSP middleware sets the header
- Add `'strict-dynamic'` alongside the nonce in `script-src`
- Restrict `base-uri 'none'`, `form-action 'self'`, `frame-src 'none'`
- Add `object-src 'none'` and `frame-ancestors 'self'`
- Preserve all legitimate third-party origins (analytics, CDNs, font providers)
- For Google Fonts: include both `fonts.googleapis.com` AND `fonts.gstatic.com` in `font-src`
- Keep `'unsafe-inline'` in `style-src` (it does not enable script execution)

## AUDIT.md Format

For each finding:
- Severity: CRITICAL / HIGH / MEDIUM / LOW
- Location: file:line
- Pattern: exact vulnerable code snippet
- Risk: what an attacker can do
- Fix applied: exact code change made
- Breaking changes: note any API surface changes

## OWASP References

- XSS: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
- DOM XSS: https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html
- CSRF: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- CSP: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
```

</details>

That is a skill generated entirely by the autoresearch loop. It was not hand-written. The researcher read the judge's scores, identified seven specific gap areas, and produced a skill that encodes targeted guidance for each one. The SSR serialisation section alone — distinguishing between escaping the data and removing the script — is exactly the kind of nuance that separates a useful security skill from a blunt "avoid `dangerouslySetInnerHTML`" rule.

That sentence from the RESEARCH.md contains both the promise and the problem. The promise: the loop worked. It generated a baseline, identified quality gaps, and wrote a more targeted skill. The problem: if the baseline was already at 0.95 and the target was 0.8, why did the harness keep going?

## The Bad Part: It Kept Going

The harness currently checks `target_score` after scoring each research iteration. It does not stop immediately after the baseline if the baseline already meets the target.

That means this run paid for the baseline producer calls, the baseline judge calls, the researcher call, and the beginning of candidate evaluation, even though the configured success condition had already been met.

That is a bug. The expected behaviour is clear: if the baseline score is already greater than or equal to `target_score`, stop before research unless the user explicitly asks to force it. This is not just correctness. It is cost control.

## The Expensive Part: Context Overflow

The run eventually failed with:

```text
prompt is too long: 211824 tokens > 200000 maximum
```

That happened after the baseline completed, six baseline evaluations wrote producer and judge transcripts, the researcher generated a candidate skill in `workspace/iterations/1/skill`, and the first iteration evaluation began. No scored improvement iteration completed.

So the system spent roughly four dollars, generated a useful baseline, generated a candidate skill, and then failed before it could tell me whether the candidate actually improved anything.

That is painful, but it is also extremely actionable.

The workspace showed about 1.1MB of baseline artifacts, with producer and judge transcripts around 75 to 90KB each. The model context had grown enough that even Flue's automatic compaction could not save the next prompt.

Flue did recover from one earlier overflow:

```text
[flue:compaction] Overflow detected, compacting and retrying...
[flue:compaction] Summarizing 38 messages, keeping messages from index 38
[flue] compaction:start  reason=overflow tokens=215673
[flue:compaction] Complete — messages: 41 → 4
[flue:compaction] Retrying after overflow recovery...
```

Automatic compaction is exactly the kind of infrastructure you want underneath long-running agent work, and it is genuinely impressive that Flue handles this out of the box. But compaction is not a substitute for bounded prompt design. The harness itself needs to avoid carrying too much transcript and artifact context forward.

After the run failed, I dug into whether Flue supports programmatic compaction — something the harness could call at phase boundaries like "baseline complete" or "researcher complete" rather than waiting for the context to overflow. The answer is: probably, but not quite yet. The installed `@flue/sdk@0.3.10` has a `session.runCompaction(reason, willRetry)` method on the session class, and internally Flue already calls it for both overflow recovery and threshold-based compaction. But it is not exposed on the public `FlueSession` TypeScript interface. Flue also has internal configuration for compaction behaviour, including `reserveTokens` and `keepRecentTokens`, but that is not yet surfaced through the `init()` call shape either.

So there are a few paths forward. The best path is to ask the Flue team to expose a public `session.compact()` API. In the meantime, an alpha hack like `(session as any).runCompaction("threshold", false)` at phase boundaries would work but is not something to build on. The safer harness-level fix is to use separate sessions per phase or per evaluation, so the context never grows large enough to need emergency compaction in the first place.

The important thing is that programmatic compaction at boundaries and scoped sessions are complementary strategies, not alternatives. This failed run showed that waiting for the conversation to get huge is already too late. We have [filed an issue](https://github.com/schalkneethling/skills-autoresearch-flue/issues/23) to explore this further.

Beyond compaction, there are several other fixes worth pursuing: keeping full transcripts on disk but passing compact summaries forward, detecting oversized prompts before sending them to the provider, truncating or summarising large generated files, avoiding exposing unrelated workspace files, and making partial runs resumable.

This is one of the core lessons from this run: an autoresearch harness is not just a loop. It is a context management system.

## The Noisy Part: Logs Need a Product Layer

At the start, the logs were readable:

```text
The eval case provides a React component with multiple XSS vulnerabilities:

1. Line 19: dangerouslySetInnerHTML with user-controlled greeting query parameter
2. Line 20: dangerouslySetInnerHTML with user-supplied bio data
3. Line 21: Unvalidated URL in profile.website
4. Line 23: Unsafe inline script with JSON serialization and user data

[flue] tool:start  write  /tmp/eval_output/UserProfile.jsx
[flue] tool:done   write
```

That is useful. It tells me what is happening.

Then the model emitted full structured output, including entire generated files embedded inside JSON strings, and the terminal became almost unreadable.

This is not just aesthetic. When the terminal is flooded, you lose the ability to answer basic questions. What phase are we in? How many evaluations are complete? Are we in baseline or iteration one? How many iterations remain? Are we respecting `max_iterations`? Why is this still running? How much might this cost?

That last one became real around the three-dollar mark. By the time the run failed, it was expensive enough that I wanted the tool to justify every next call.

The terminal should show a compact heartbeat:

```text
Baseline: eval 4/6 complete
Baseline score: 0.95 / target 0.8
Stopping: baseline target reached
```

Or for an active iteration:

```text
Iteration 1/5: researcher running
Iteration 1/5: producer eval 2/6
Iteration 1/5: judge eval 2/6
Current score: 0.78 / target 0.8
Estimated max remaining calls: 18
```

Full prompts, completions, JSON payloads, and file contents should still be saved to disk. They just should not be sprayed into the default terminal output.

Longer term, a richer feedback interface should make the run state impossible to misunderstand: a timeline of phases, per-evaluation cards, score trends, candidate skill diffs, a transcript viewer, a cost summary, visible stop conditions, and errors with remediation guidance. If a user cannot tell what has happened and what remains, the system is not yet trustworthy.

## The Isolation Problem

The run also revealed a workspace isolation issue. While scoring the external frontend security project, the judge browsed paths like:

```text
/workspace/fixtures/projects/release-notes-alpha
/workspace/fixtures/baseline/frontend-security
/workspace/.flue/roles/eval-judge.md
```

That is not what I want. The judge should score the producer output against the current evaluation case, rubric, and relevant reference material. It should not rummage through unrelated harness fixtures or stale baseline examples.

Even if the final scores looked reasonable, this weakens auditability. It creates the possibility that scores are contaminated by irrelevant context.

The desired shape is clear. The producer sees the evaluation case, input, reference files, and the skill. The judge sees the evaluation case, rubric and reference material, and the producer output. The researcher sees the config, scores, summaries, the previous skill, and relevant evaluation context. Each role should get the narrowest useful workspace. When an agent has filesystem access, the files it can see shape its behaviour just as the prompt text does — the filesystem is part of the prompt.

## The Small Bugs That Matter

The run also shook out several smaller issues that are exactly the kind of thing alpha runs are for.

The docs say `origin_skill` is relative to the project root unless absolute. The implementation currently resolves it relative to the process working directory. That is wrong. Project config paths should be project-local.

An early run failed because the external project config still referenced older role names. The current harness roles are `eval-judge`, `skill-builder`, and `task-producer`, but the config had stale values from an earlier iteration. This should have failed immediately with a clear error, before any model calls.

Generated iteration artifacts are written conservatively, with exclusive file creation. That is safe, but rerunning should not require manual `rm -rf`. A rerun flag that cleans or overwrites generated iterations would make the development loop much tighter.

Writing evaluations in JSON works, but it is not friendly. People should be able to write evaluation cases in a more human-readable format, likely Markdown with structured frontmatter or a directory-per-evaluation layout.

There is also a bigger item hiding among the small ones: the beta must ship a proper CLI so that users do not need a local clone of the harness to run autoresearch. Right now, as shown in the command examples above, you run from a local checkout of `skills-autoresearch-flue`. That is fine for alpha development, but it is not a viable distribution model. The beta needs to be installable as a tool that you point at your autoresearch project and run.

And finally, the real project has more than one skill. The alpha can run multiple tracks, but it improves one seed skill per run. Multi-skill improvement runs are on the roadmap.

All of these have been filed as issues on the [`skills-autoresearch-flue` repository](https://github.com/schalkneethling/skills-autoresearch-flue).

## The Product Shape Is Becoming Clear

Before this run, the harness felt like a technical experiment: can Flue orchestrate producer, judge, and researcher loops in a way that is auditable?

After this run, the product requirements are much clearer. Bound the context, because transcripts and artifacts must never silently grow until the provider rejects the prompt. Show progress, because users need to know what completed, what is running, and what remains. Respect stop conditions early, because if the baseline meets the target, the system should stop. Estimate cost before spending, by showing planned call counts and letting users set caps. Validate config before model calls, because missing roles and bad paths should fail fast. Isolate workspaces, because each role should see only what it needs. Make the CLI humane, because the normal command should be config-driven and minimal. Keep detailed artifacts, but do not dump everything into the terminal. Support real authoring workflows, because human-friendly evaluations and multi-skill projects are not extras — they are the path to real use.

This is a very good outcome for a first real run. The system did not complete a full improvement loop, which is frustrating. But it proved enough of the idea to justify the next round of engineering. Baseline generation worked. Producer and judge separation produced useful scores. The judge made nuanced calls. The researcher generated a targeted skill. The run artifacts were inspectable. And the failure modes were concrete and fixable.

## Why This Still Made Me Smile

It is easy to look at a failed four-dollar run and feel annoyed. I did feel that, briefly.

But the more interesting feeling is that the harness behaved like a real system meeting reality for the first time. It found actual security behaviours, scored them with nuance, generated a skill improvement, then exposed the places where the harness itself is not yet mature enough.

That is not failure. That is contact with the surface.

The next version needs to be cheaper, quieter, more bounded, and more transparent. It needs to stop when it has already won. It needs to show the user what it is doing. It needs to treat context as a budget, not an infinite drawer.

But the core loop is there. And that is super cool.

## Further Reading

- [Andrej Karpathy's `autoresearch`](https://github.com/karpathy/autoresearch) — the project that inspired the skills autoresearch concept
- [Flue Framework](https://flueframework.com/) — the agent harness runtime underneath `skills-autoresearch-flue`
- [`skills-autoresearch-flue`](https://github.com/schalkneethling/skills-autoresearch-flue) — the autoresearch harness (alpha)
- [`skills-autoresearch-security`](https://github.com/schalkneethling/skills-autoresearch-security) — the frontend security autoresearch project used in this run
