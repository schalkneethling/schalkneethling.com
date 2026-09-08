---
title: "Introducing WebDev Bench: A Coding-Agent Benchmark Judged on Web Platform Standards"
pubDate: 2026-09-08
description: WebDev Bench judges coding agents against the web platform's own standards, not visual fidelity or preference votes. Here is what the foundation phase built, what its first pilot found, and what comes next.
author: Schalk Neethling
tags: [agentic-engineering, ai]
standardSite:
  publish: true
---

WebDev Bench is a benchmark I am building to evaluate coding agents on web development tasks when they are constrained to using only web platform features. Topics include semantic markup, ARIA correctness, and WCAG conformance. Judgment is based on the platform's own rules, not a personal preference or a fixed reference implementation. Its first pilot just finished: eighteen of eighteen valid runs, three models, two conditions, three samples of each, spread across two machines over several days.

Two moments in the pilot could have made those eighteen runs impossible to compare fairly. One failure I thought I had already diagnosed turned out to have the wrong cause. Running the harness eighteen times is easy. Making sure the results actually mean what I claim they mean is harder, and that is what this post works through before I interpret any of the numbers.

## Why Judge Agents Against the Platform's Own Rules

The three more common alternatives are comparing output to a fixed reference implementation, scoring visual fidelity against a rendered target, and asking human reviewers to vote on which output they prefer. None of them confirm that an agent's markup and interaction behavior is correct in the way a browser, an assistive technology, and a specification would agree on. A page can match a reference screenshot exactly and still compute the wrong accessible name for an element. A reviewer's preference can still land on an anti-pattern that happens to render well. WebDev Bench replaces all three with the platform's own conformance rules: not what looks right, not what a person picked, but what the standards say is correct.

The benchmark's primary output is the default-quality delta: the gap between what a model produces when a task states its quality requirements explicitly and what the same model produces when those requirements go unstated. Two secondary outputs come out of the same runs. Skill efficacy measures how much of that gap a given agent skill or instruction set closes. Engineering decision data is the operational side: duration, turn count, token usage, and cost for each run. It answers a different question than the delta does — not whether the code was correct, but how much time and money a model or condition actually consumes, independent of the outcome.

## Seven Invariants, Three Worth Knowing

WebDev Bench also has its own specification, distinct from the web platform specs it tests against. This one governs the harness itself, not what counts as correct HTML or ARIA: how a task runs, how a result gets recorded, and how it gets scored. It defines seven invariants that constrain every change to that harness, and three of them matter most for what follows.

The first, I1, separates measurement from interpretation. Nothing that writes a measurement is allowed to apply a threshold, a weight, or a verdict. Scoring happens at read time, against stored facts, not at capture time. This post follows the same rule: it reports what the pilot measured and leaves what those numbers mean for later, once my interpretation layer exists to make that judgment.

The second, I4, requires every scored contract assertion to include a tiered normative provenance: normative, advisory, or empirical. An assertion without that tier is rejected by the build. In practice, a rule like "the button needs an accessible name" cannot enter the scoring criteria without a note on where it comes from and how authoritative it is. That keeps my grading traceable to an actual specification or a documented, weaker source, rather than an assumption.

A third invariant, I6, requires a run's identity to rest on real, code-validated facts, not assumptions about what stayed constant between machines. It matters less during ordinary development, and it is what came closest to failing during this pilot, twice.

## Building the Harness Before Running Anything

I moved through a foundation phase before any model ran against a task: schema first, then the task pipeline, then the runner itself, then pilot preparation. Architecture decision records, written when each decision was made rather than reconstructed afterward, are my record of why the harness looks the way it does. The specification lives in one document, treated as normative; a separate implementation plan tracks where I argued against parts of that specification and why.

A few structural choices from this phase matter later. Run records travel through Git as committed, immutable facts, including the record of a failed run. The artifact tarballs behind those records, however, are ignored by Git and stay local to whichever machine produced them. I consolidate them with a strict verification pass that reports how many records exist, how many were verified, and whether anything is missing or mismatched.

Holdout tasks live in an entirely separate repository and are never committed alongside the harness. That keeps a task's expected answer out of any future model's training data.

## The Pilot: One Task, Three Models, Two Machines

With the foundation in place, my first pilot ran a single task, a checkout shipping page, across a three-by-two-by-three matrix. The three variables were the model (small, mid-sized, or large, referred to here by tier), the condition (stated, when the task spelled out its quality requirements explicitly, or unstated, when it did not), and the sample (three valid runs of each combination). Two batches ran on one machine; a third batch, the six large-model runs, ran on a second machine.

The full pilot cost approximately $123 in API-equivalent usage, all of it billed through a subscription rather than metered API access — a CLI-reported estimate, not an ongoing operating cost. The six large-model runs on the second machine alone accounted for $76.38 of that total. Every run also had configured caps on turns and wall-clock time, and none of the eighteen valid runs came close to hitting them: the highest turn count was 147 against a cap of 350, and the longest run took 50 minutes against a cap of 60.

## What "Memory Pressure" Actually Was

Before this pilot, an earlier attempt had lost four large-model runs on the first machine. At the time, it looked like the operating system reclaiming memory under pressure: the harness process was simply dead, the underlying container was still running, with nothing left to record its output, and somewhere between $20 and $40 of usage was spent without producing a record. That explanation is why I brought in a second machine — with more RAM, a better GPU, and more disk space — to avoid repeating the problem.

The same failure happened again, on the second machine, about thirty-five minutes into one of the large-model runs. This time, I checked the operating system's logs directly: no memory-pressure event appeared for that window. The launcher's own log had no exit line either. The process had not died on its own or been killed for memory; something outside the process had terminated it, ending the entire process tree at once.

The actual cause was more specific than memory pressure: every one of the lost runs had been launched as a background task inside a coding-agent session, and that session later reaped the task. That is documented behavior for an idle or terminated task, and it takes the entire process tree with it. The container running inside Docker kept working, because its child processes live inside the Docker virtual machine rather than inside the session that started them. That produces the exact signature I saw: the container survives, but whatever was watching it and writing its record does not. All four of the original losses matched this pattern once I checked.

The pilot launcher script now starts from a plain terminal, not as a background task inside a coding-agent session, so it is never part of that session's process tree in the first place. `nohup` keeps it running even if the terminal that launched it closes, and `disown` drops it from that shell's job table, so the shell can no longer signal it either. A session may still watch the script's log, but it has no process left to reap. Six runs launched this way after the fix produced zero losses.

The same kind of coding-agent session that caused the failure was also the one that diagnosed it, and reaching that diagnosis meant no longer treating the earlier "memory pressure" explanation as settled. The problem was never memory. It was how that session managed the process it launched.

## The Run Key Almost Broke Twice

Every run record carries an identity key, and I6 requires that key to reflect real, code-validated facts, not assumptions about what stayed constant. One of its fields is a fingerprint (its content digest) of the exact agent container image. Two records with different digests cannot be safely compared for any delta the benchmark reports.

This nearly went wrong before a single pilot run started. My original plan for the second machine was to rebuild the agent image locally, which would have produced a different digest and made every comparison involving the large model uncomparable to the runs on the first machine. I caught this in review rather than in a run. The fix was to save the image from the first machine and load that exact file on the second, and I verified afterward that it produced a byte-identical digest against the fifteen records that already existed.

The second near-miss surfaced three separate times, always caught by a check that runs before a container is created. The Docker image store I was using intermittently reported "no such image" when asked to inspect the agent image by tag, even while listing images and running containers from that same tag both worked. In that state, the harness would have fallen back silently to the tag itself as the run's fingerprint. The run would have completed cleanly, but the result would be one I could never honestly compare to anything else, with no note in the record explaining why. The harness now resolves the image's content digest before creating a container at all, attempts an automatic re-tag if the digest cannot be found, and refuses to run rather than fall back to the tag.

> **Note**: This matters beyond the intermittent bug above. Loading the exact same image file into OrbStack, which uses the overlay2 storage driver, assigns it a different internal `.Id` and leaves `RepoDigests` empty — there is no content digest to read at all. Swapping container runtimes would not just risk that kind of flakiness; it could remove the fingerprint entirely, which is why the specific image store in use is a hard requirement, not an implementation detail.

The lesson from both near-misses is the same. An invariant enforced only as a rule in a specification is not the same as an invariant enforced in code. I6 had already been written as validated logic for every delta the benchmark calculates, but one of its inputs had not been validated and could silently substitute a less specific value without tripping any check. My preflight check is what found that gap during the pilot.

## The Numbers, Before I Interpret Them

All twenty-one records from the pilot, the eighteen valid runs plus three I deliberately kept as failures, share an identical harness version and an identical Claude Code CLI version. That uniformity is what I6 exists to guarantee, and after the fixes described above, it held.

Within the large-model runs, the unstated condition produced per-run costs of $9.79, $21.44, and $18.23, taking between 38 and 50 minutes and between 66 and 147 turns. The stated condition, for the same model, produced $8.21, $11.47, and $7.24, taking between 28 and 35 minutes and between 47 and 79 turns. In each of the three pairs, the stated condition was shorter, cheaper, and used fewer turns than the unstated condition, with mean differences of roughly 32 minutes against 45, $8.97 against $16.49, and 59 turns against 115. The mid-sized model, across the same two conditions, showed roughly equal figures instead of a consistent gap in either direction.

Why stating quality requirements would make an agent faster and cheaper, why the effect shows up for one model and not the other, and what it says about either model's default behavior are all questions for the interpretation layer, which does not exist yet. None of the judged quality findings have been produced for any record yet, so the pilot cannot yet compare the models on the quality of what they built, only on how long and how expensive it was to get there.

## What Comes Next

The next phase is to build the result schema, the storage layer for judged findings, delta validation, and the interpretation layer itself: the only place in the system where these numbers get interpreted. A second post will cover that phase once it lands, including my first attempt at answering the question this post deliberately leaves open: what the gap between stated and unstated quality requirements represents, and whether it holds up once judged findings exist to check it against.
