---
title: "Before Copying Someone Else's CLAUDE.md, Find the Style That Works for You"
pubDate: 2026-10-25
description: "How naming writing styles, and seeing one passage rewritten in each, helped me write CLAUDE.md instructions for how coding agents communicate with me."
author: "Schalk Neethling"
tags: ["ai"]
---

I was working through how the TypeScript checker narrows types, specifically the flow analysis in `internal/checker/flow.go`, and asked Claude to walk me through an example. The explanation was accurate, but I still had to read it three times. Here is part of it:

> There are three things worth noticing as you step through it. First, the walk from use 1 never touches the merge point or the false branch. Those come later in the code, and a backward walk cannot see anything that comes after the point it starts from. Second, the assignments to `text` sit on the path but do nothing for `value`. The checker passes straight through flow nodes that concern a different name. That is why narrowing is tracked per name rather than per line. Third, at use 2 the narrowing inside the `if` is not “lost” in the sense of something invalidating it. The merge point has two incoming paths, and the union of what arrives on each is simply wider.

Nothing in that passage is wrong. It follows most of the writing rules I had given Claude: full sentences, linking words, no unexplained jargon. The problem was not the content. The problem was that it was written in a style that does not match how I read.

## Borrowed Instructions

Most of us who work with coding agents now maintain some form of standing instructions: a `CLAUDE.md`, an `AGENTS.md`, a rules file for Cursor. Much of what goes into those files is borrowed. We copy a section from a popular repository, adapt a colleague's file, or paste in a list of writing rules from a blog post. That is a reasonable way to start, because someone else has already done the thinking.

The step that often gets skipped is checking whether the output actually works for the person reading it. A rule can be sensible in general and still produce text that one particular reader struggles with. My own `Language and tone` section was a good example. It asked for full sentences, plain language, no invented jargon, and the point before the evidence. Every rule was defensible, and the explanation above followed nearly all of them. None of the rules said anything about _how to explain a mechanism_, which is exactly where the explanation lost me.

I did not have the vocabulary to say what was wrong. I could only say that it was hard to follow, and “make it easier to follow” is not an instruction anyone can act on.

This is a familiar problem from engineering and design. A bug report that says “the layout is broken” gets a slower fix than one that names the stacking context or the containing block. A design brief that asks for something to “feel cleaner” gets guesses. When we can name what we need using terms with well-understood definitions, the results improve, because the other person no longer has to guess what we mean. I had that vocabulary for code and for interfaces. I did not have it for writing styles.

## Naming What Was in Front of Me

I asked a different question instead: what would you call this kind of writing? The broad answer is a _pedagogical expository register_, prose written to teach, in a calm, semi-formal voice. The more useful answer was a set of narrower terms for the specific moves the passage makes.

| Phrase from the excerpt                                          | What it is called                       | What it does                                                        |
| ---------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| “There are three things worth noticing”, “First… Second… Third…” | Frame markers (a kind of metadiscourse) | Announces how the explanation is organized before you are inside it |
| “As you step through it”, “whenever you are”                     | Engagement markers (metadiscourse)      | Addresses the reader directly                                       |
| “That is why narrowing is tracked per name”                      | Code gloss (metadiscourse)              | Stops to spell out what the previous fact implies                   |
| “Not ‘lost’ in the sense of something invalidating it”           | Refutation text                         | Names a likely misconception, then replaces it                      |
| “This is a simplified view of the real graph”                    | Scope disclaimer                        | States which parts are faithful and which were trimmed              |
| “The worksheet is ready whenever you are”                        | Handoff                                 | Passes the work back to the learner                                 |

_Metadiscourse_ is the term that unlocked the rest. [Ken Hyland uses it](https://linguistlist.org/issues/17/116/) for language that talks about the text and the reader, rather than about the subject. The excerpt has a lot of it, and that turned out to be the issue for me. Each frame marker asks me to hold a slot open (“there will be three things”) and then fill it with an abstract observation. By the time the third observation arrives, I am holding three abstract statements and have not yet mapped any of them onto the code.

Having names did not fix anything by itself. It did give me a way to ask for less of one thing and more of another.

## One Passage, Seven Ways

The next step was the one that made the difference. I asked for alternative styles, each named, and for the same excerpt rewritten in every one of them. The rewrites used a small example (inferred from the excerpt, since the original example code was not part of it):

```ts
function describe(value: string | number) {
  let text = "";
  if (typeof value === "string") {
    text = "string: ";
    console.log(value.length); // use 1
  } else {
    text = "number: ";
  }
  console.log(value); // use 2
}
```

These were the seven styles:

1. **Concrete-first** shows the specific case, then names the general rule.
2. **Analogy-driven** maps the mechanism onto a familiar physical experience.
3. **Question and answer** delivers each idea as the answer to a question you might be asking.
4. **Annotated trace** lays the walk out as a table you can follow line by line.
5. **Rule-first** states the whole mechanism up front, then applies it.
6. **Conversational** reads like a colleague explaining at a whiteboard.
7. **Minimal notes** reduces everything to terse, scannable claims.

Seeing the same content in each style is what made the comparison possible. With a single explanation, I can only judge whether it works. With seven explanations of identical content, the only thing that changes is the style, so my reaction is a reaction to the style. Two of them stood out immediately. Here is the analogy-driven version:

> Think of the code as a network of hiking trails, and the checker as someone who can only walk backward toward the trailhead. At use 1, the hiker retraces their steps. They pass a signpost about a different trail (`text = ...`) and ignore it. Then they reach a gate labeled “only strings past this point.” That settles it: `value` is a string.

And here is the minimal notes version, which I found much harder despite being far shorter:

> - Direction: backward from the use.
> - Use 1 → skips `text =` (other name) → hits true side of `typeof` → `string`.
> - Use 2 → hits join → `string | number`. Not “lost,” just merged.

The notes version is excellent for reviewing something I already understand. For learning it, every arrow is a step I have to reconstruct.

## Choosing a Direction, Then Refining It

Analogy-driven was the strongest fit, and the conversational style had potential. Both come with a risk I wanted to guard against: they drift into verbosity, and an analogy forced onto a mechanism that has no physical equivalent costs more attention than it saves. The combined voice therefore came with a condition. Use an analogy only when the mechanism has a real structure that maps onto something physical (direction, flow, merging, layering), and only when the analogy predicts correct behavior. If nothing fits, use concrete code instead.

The trail analogy passes that test because “backward” and “merge” are literally how the algorithm works. That is the difference between an analogy that explains and one that decorates.

Two smaller refinements came from reading the combined version closely.

### Name Both Sides of a Contrast

One sentence read: “it passes `text = "string: "` and ignores it, because that line is about `text`.” That tells me why the line was skipped, but not what it was skipped _in favor of_. Adding the other side removes a step:

> …and ignores it, because that line assigns to `text`, not `value`.

Every implied comparison is a small piece of work the reader does silently, and those pieces add up.

### Show Narrowing and Widening as a Pair

I also wanted the explanation to show the movement: the type narrows going into a branch and widens again after it. My first phrasing was that it “returns to the initial definition” outside the branch. That is accurate in this instance, but only by chance. In the example above, the widened type happens to equal the declared type, but only because both branches reach the merge point. Change one branch so it exits early, and the result is narrower than the declaration:

```ts
function describe(value: string | number) {
  if (typeof value === "string") {
    return;
  }
  console.log(value); // number, not string | number
}
```

The checker widens to the union of the paths that reach the merge, not back to the declared type. A small diagram makes the normal case easier to see:

```text
typeof value === "string"
  ├─ true branch  → value: string
  └─ else branch  → value: number
          ↓
       merge      → value: string | number
```

With both refinements in place, the middle of the explanation read like this:

> From use 2, the first thing behind it is where the two branches rejoin. Inside the `if`, `value` was narrowed to `string`; inside the `else`, to `number`. At the merge, the checker widens again by combining what each branch brings: `string | number`. Here that matches the declared type, but only because both branches reach the merge. If the true branch returned early, only `number` would arrive, and `value` would stay `number` after the `if` rather than widening to `string | number`.

That is still a careful, precise explanation. The difference is that each abstract claim now comes with a line of code or a concrete case that shows it, instead of leaving me to map it onto the code myself.

## From Preference to Instructions

By this point, the exercise had grown beyond explanations into how agents communicate with me in general, from chat replies to pull request descriptions. The last step was turning all of this into instructions for my global `CLAUDE.md`, which Claude Code loads at the start of every session.

My existing `Language and tone` section stayed, with a few edits. Acronyms, abbreviations, and ID codes are now defined on first use with the short form in parentheses, the same convention I follow for accessibility, rather than spelled out every time. A rule asking Claude to describe what a thing does instead of naming it became a judgment call: use the common name when most engineers would recognize it. And a new rule asks for both sides of every contrast to be named.

The bigger change was a new section for explaining mechanisms, because that is the gap the original excerpt fell into. A few of its rules:

```markdown
- Anchor every abstract claim to concrete code or a specific case, right before
  or right after stating it. Never stack abstract observations in a row and
  leave me to map them onto the code.
- Use an analogy only when the mechanism has a real structure that maps onto
  something physical (direction, flow, merging, layering) and the analogy
  predicts correct behavior. If nothing fits, use concrete code instead.
- Show how state moves, not just where it ends up.
- If a simple phrasing would plant a misconception, state the precise rule and
  give a short counterexample.
```

I follow visuals more easily than long text, so a third section asks for a table, diagram, or annotated code whenever the content has a real structure, such as a flow, a sequence, or a comparison. It also includes a test for lists that will be familiar to anyone who writes HTML: use a list only when the items are parallel and could be reordered without losing meaning. Almost anything could be an unordered list, in the same way that almost anything could be a `<ul>`. That does not mean it should be.

Two things about how the instructions are written made a noticeable difference. Each rule includes its reason, so Claude can apply it sensibly in cases the rule does not cover. And the explanation section ends with a short example of the target voice, including the diagram, because a model imitates an example more closely than it follows a list of rules.

The instructions are a hypothesis, not a result. The way to test them is to open a fresh session and ask for an explanation of something you already understand well, then judge the output the same way I judged the original excerpt.

## Wrapping Up

The idea worth taking from this is that instructions for an agent are like any other code: they should be judged by their output, and the person judging should be the person reading it. Borrowed guidance is a fine starting point. It is not a finished configuration.

The process that worked for me had four parts. Name what you are reading, so you can ask for less of it. See the same content rewritten in several named styles, so your reaction is to the style and not the subject. Pick the one or two that come closest, and refine them against real passages. Then write the result down with reasons and an example, and test it in a fresh session.

## Further Reading

- [Claude Code memory documentation](https://docs.claude.com/en/docs/claude-code/memory), which explains where a user-level `CLAUDE.md` lives and how it is loaded alongside project files.
- [Prompt engineering overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview), Anthropic's guidance on clear instructions and examples, which is the reasoning behind giving each rule a reason and ending with an example.
- [Review of Hyland's _Metadiscourse: Exploring Interaction in Writing_ (2005)](https://linguistlist.org/issues/17/116/), a chapter-by-chapter summary that lists the interactive resources (frame markers, code glosses) and interactional resources (engagement markers, hedges) named in this post.
- [_A meta-analysis of refutation text research_](https://pmc.ncbi.nlm.nih.gov/articles/PMC8784251), an open-access summary of the research on texts that name a misconception before correcting it.
