---
title: "Cutting Across The What And The How: What Building A Polyfill Is Teaching Me About Web Standards"
pubDate: 2026-03-26
description: "What happens when you try to implement two seemingly straightforward CSS features as a JavaScript polyfill? You discover that specifications are simple because they made hard decisions, and the complexity does not disappear; it just moves."
author: "Schalk Neethling"
tags: ["web-standards", "css"]
---

There is a particular kind of humility that comes from trying to implement a web platform feature yourself. In my case, as a polyfill. You read the specification, nod along, think "yes, I understand this", and then sit down to write the code. What follows is a series of moments where you realise that what seemed obvious on the surface is resting on a foundation of careful, hard-won decisions — decisions that live in the gap between what a specification defines and what an implementation must do.

This post is about two such moments, and what they taught me about web standards, about AI-assisted development, and about the gap between reading a spec and understanding one.

## The Starting Point: Conformance-Driven Development

The idea that led me here came from Simon Willison, who writes about a pattern he calls conformance-driven development. The core of it is this: a specification defines what a feature should do, and a conformance test suite (like the [Web Platform Tests](https://web-platform-tests.org/)) that defines what correct behaviour looks like in executable form. If you give both the specification and the tests to an AI coding agent and ask it to write code that makes the tests pass, you get something interesting: implementation correctness becomes verifiable rather than assumed, and reading the code that emerges becomes a genuine learning experience.

For web platform features, the WPT repository is the conformance suite. Every major browser runs against it. Tests that pass in one engine but not another show you where a feature has not yet been implemented. Interoperability issues are a different and subtler problem: two engines have both implemented a feature, both pass the tests, yet their behaviour diverges in ways the author never expected. It is also worth noting that browser vendors do not always implement every part of a specification, and not always because of resources or timeline. Sometimes a particular behaviour is unclear enough that a vendor holds back until it is resolved. Sometimes there are genuine privacy or security concerns about a specific aspect of a feature that make a vendor reluctant to ship it as written. The reasons for divergence are not always purely technical.

You might reasonably assume that WPT would catch this, and increasingly it does. Even though the WPT test suite contains thousands of tests, as in most test suites, gaps still exist. The specification can also sometimes leave room for interpretation. Two vendors can read the same text, implement it differently, and both pass the existing tests simply because nobody wrote a test for that particular edge case yet. Sometimes the divergence only surfaces when a developer hits it in production.

The process of writing tests, discovering divergence, clarifying the specification, and fixing implementations is iterative rather than instantaneous; it requires dedicated, coordinated effort rather than happening on its own. This is partly why the Interop project exists: not just to track what is supported, but, even more critically, to ensure that what is supported actually behaves the same way across engines. And because the tests are written and maintained by browser vendors, specification authors, and contributors from the wider web community, they encode collective intent, including the edge cases and the decisions that do not always make it into the prose.

I wanted to explore this approach by building a polyfill for a CSS feature currently in [Interop 2026](https://wpt.fyi/interop-2026) — something with a stable specification, existing WPT tests, and the opportunity to let authors use the feature today in browsers that do not yet support it at all. The goal was not just to ship a polyfill. It was to use the process as a learning exercise, and to understand what the specification actually means by writing code that must satisfy it.

## First Attempt: The Advanced `attr()` Function

The first candidate was the advanced `attr()` function from CSS Values and Units Level 5. You have probably used `attr()` in its basic form, pulling a string value from an HTML attribute into a `content` property. The Level 5 extension goes further: it adds type conversion, so you can write things like:

```css
.box {
  width: attr(data-size type(<length>));
  background-color: attr(data-color type(<color>), transparent);
}
```

The browser reads the attribute value, parses it as the specified type, and uses it as a CSS value. This seems straightforward. The implementation sketch is clear: scan stylesheets for `attr()` calls, read the corresponding HTML attributes, resolve the types in JavaScript, and write the computed values back into the cascade via custom properties.

The dragons appeared almost immediately.

The first was inheritance. CSS custom properties [inherit by default](https://www.w3.org/TR/css-variables-1/#defining-variables). Consider this markup:

```html
<div data-size="100px">
  <p>This paragraph has no data-size attribute</p>
</div>
```

With a polyfill writing `--polyfill-data-size: 100px` on the `<div>`, the child `<p>` inherits that custom property value even though it has no `data-size` attribute of its own. Given a CSS rule like:

```css
p {
  inline-size: attr(data-size type(<length>));
}
```

The `<p>` should get the fallback value or be invalid — but instead it silently gets `100px` from its parent. The fix is `@property` with `inherits: false`, but `@property` is not available everywhere. And even where it is available, it changes how the polyfill applies resolved values back to the document: whether to use CSS custom properties, inline styles, or a combination of both, each with their own tradeoffs around specificity and cascade correctness.

The second was naming. The same data attribute can theoretically appear in two different CSS rules with two different type arguments, for example one rule reading `data-val` as a `<length>` and another reading it as a `<color>`. In practice this would never produce useful output for both rules simultaneously, since a single attribute value cannot be both a valid length and a valid colour at the same time. But the polyfill architecture must still account for the possibility, and the naming scheme must encode the full `(attribute, type)` pair as the key rather than just the attribute name.

It is also worth noting that CSS fails gracefully rather than loudly: when an attribute value cannot be parsed as the declared type, the browser treats the declaration as [invalid at computed-value time](https://www.bram.us/2024/02/26/css-what-is-iacvt/) and silently falls back to the property's inherited or initial value. No error is thrown, nothing blows up. `@property` does not change this fundamental behaviour, but it does make the fallback more predictable by letting you define an explicit `initial-value`.

Where `@property` could genuinely help the authoring experience is tooling: a CSS linter that understands registered custom property syntax could warn you at author time that the same attribute is being used with incompatible types in different rules, long before the browser silently swallows the invalid value. That linter does not fully exist yet. [`stylelint-csstree-validator`](https://github.com/csstree/stylelint-validator) can validate declaration values against CSS syntax definitions using `css-tree`'s own lexer, and you can extend it with manually declared custom property types. But there is no tool that automatically reads `@property` rules from your stylesheets and validates every custom property usage against the registered syntax; the infrastructure exists, the demand is clearly there (there is an [open Stylelint issue from 2020](https://github.com/stylelint/stylelint/issues/5061) requesting exactly this), but nobody has shipped a complete solution yet. That feels like an opportunity worth exploring.

The third was compound declarations. A rule like:

```css
.box {
  border: attr(data-w type(<length>)) solid attr(data-c type(<color>));
}
```

cannot be written back through a single custom property: `var()` substitution does not allow partial value replacement mid-declaration. You need to resolve all `attr()` calls in the declaration, construct the full value, and write it back as an inline style. But inline styles have high specificity. So the write-back strategy is not uniform; it must adapt to what the declaration looks like.

Then there was the feature detection problem. `CSS.supports(property, value)` validates the property name before evaluating the value. You need a real CSS property that accepts the type you are testing.

> **Note:** Documentation and articles often use `'x'` as a placeholder in examples — almost certainly intending it to be substituted with a real property name, but if you copy it literally, the call returns `false` in every browser, including ones with full Level 5 support.

And the [`type(*)`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/type) wildcard, which seems like it should be a universal detection string, follows the same semantics as [`syntax: "*"`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@property#syntax) in `@property`: it means "any value, resolved against the property receiving it." The resolved type depends on context. There is no single detection call that tells you "this browser supports advanced `attr()`."

At a certain point, we concluded that `attr()` (while fascinating) was not the right first polyfill for this approach. Not because the problems are unsolvable, but because they compound in a way that makes the planning alone a multi-week exercise. We pivoted.

## Second Attempt: CSS Media Pseudo-Classes

The CSS media element pseudo-classes felt like the obviously simpler choice. Seven pseudo-classes — `:playing`, `:paused`, `:seeking`, `:buffering`, `:stalled`, `:muted`, and `:volume-locked` — match `<audio>` and `<video>` elements based on their playback state. Currently at 0% in Chrome and Edge on the [Interop 2026 dashboard](https://wpt.fyi/interop-2026), 100% in Firefox, and 80% in Safari.

The implementation sketch is even clearer than `attr()`. Scan stylesheets for these pseudo-classes, rewrite the selectors to use generated class names, toggle those classes on media elements as their state changes. No cascade write-back, no type resolution, no custom properties. Just class toggling.

The surprises were smaller but they were still there.

**Events do not bubble.** Every relevant `HTMLMediaElement` event (`play`, `pause`, `waiting`, `stalled`, `seeking`, `volumechange`) is documented by MDN as "not cancelable and does not bubble." This means event delegation is simply unavailable. You cannot attach one listener to `document` and catch events from all media elements on the page. Each `<audio>` and `<video>` element needs its own listeners attached directly, which means you need a tracking strategy for those listeners and a cleanup strategy for when elements are removed. A `WeakMap<HTMLMediaElement, EventListenerRecord>` turns out to be the right data structure: it associates listeners with elements without preventing garbage collection when the element is gone.

**The stalled state has no DOM surface.** The HTML spec defines an internal "is currently stalled" boolean per media element. The browser sets it to `true` when about three seconds pass without data arriving during playback, and clears it when data arrives again. But there is no JavaScript property you can read to check this. You have to mirror it yourself by tracking `stalled` events (flag becomes true) and `progress`, `emptied`, and `loadstart` events (flag resets to false). This makes the state computation function not quite pure; it needs the polyfill's own tracked flag as a parameter alongside the element's DOM properties.

**`:muted` is not `volume === 0`.** The spec defines `:muted` as matching when the `muted` IDL attribute is `true`. Setting `volume` to `0` makes the audio silent but does not set the `muted` attribute — the element is silent but not muted. The WPT tests only test `muted` attribute toggling. Including `volume === 0` in the matching condition would produce incorrect matches compared to a native implementation.

**Cascade source order and stylesheet rewriting.** The polyfill must inject a class-based equivalent for every pseudo-class rule it rewrites. The key question is where to inject it, and the answer went through a few iterations before landing somewhere satisfying.

The initial plan called for cloning the entire stylesheet AST, disabling the original, and injecting the full clone with rewritten selectors. Safe, but complex; it carries real overhead for stylesheets with many rules that need no rewriting at all.

A simpler instinct was to extract only the matching rules and append them in a new `<style>` element after the original. But this quickly ran into a problem: any rule inside an `@layer` block that gets extracted and appended outside it no longer participates in the layer order cascade the way the author intended. The `@layer` context is not just a grouping; it determines cascade priority, and moving a rule out of it changes its behaviour in ways that would be very hard to debug.

Working through that constraint led to what feels like the right approach: inject the rewritten rule immediately after its original, inside the same stylesheet context. Given a rule like:

```css
video:playing {
  outline: 0.25rem solid green;
}
```

The polyfill inserts its equivalent directly below:

```css
video:playing {
  outline: 0.25rem solid green;
}

video.media-pseudo-polyfill-playing {
  outline: 0.25rem solid green;
}
```

The browser's own error recovery does the heavy lifting. It silently skips the rule it does not understand, and the polyfill's class-based equivalent is right there immediately after, ready to be applied. The two rules sit together as a natural progressive enhancement pair. When you think about it, that is exactly what a polyfill should look like.

This approach preserves cascade source order relative to all surrounding rules, keeps every rewritten rule inside its original `@layer`, `@media`, or `@supports` block, and requires no stylesheet cloning or disabling. It is simpler than the first plan and more correct than the second.

That said, this is still thinking on paper. Real-world stylesheets have a way of finding edge cases that no amount of planning anticipates. If the implementation surfaces a scenario where this approach falls short, that is not a failure of the planning process. It is just engineering meeting reality, which is how specifications themselves get refined. We will follow the tests.

**URL resolution breaks on external stylesheet injection.** When a `<link>` stylesheet contains `url(../images/bg.png)`, that URL resolves relative to the stylesheet's location. When the polyfill fetches that stylesheet and re-injects its content as a `<style>` element in the document, the same URL now resolves relative to the document's origin instead. For same-origin sheets, this can be avoided entirely by modifying the live stylesheet via the CSSOM rather than fetching and re-injecting — the browser retains the sheet's original URL context and relative URLs continue to resolve correctly. For cross-origin sheets where CSSOM access is blocked, fetching is unavoidable and the URL resolution problem remains. This is a known limitation deferred to a post-v1 release.

**`:volume-locked` is unpolyfillable.** The locked state is determined at the operating system or user agent level (on iOS, for example, hardware volume buttons can lock the volume beyond JavaScript's reach). There is no DOM property or event that exposes this state. The polyfill implements the class-toggling infrastructure for consistency, but the class is never set. This is documented honestly as a known platform limitation.

## What the Specification Is Actually Doing

The thing that strikes me about both of these experiences is that none of the complexity we encountered was hidden carelessly. It was hidden deliberately, because that is what a good specification does.

A specification describes what a feature should do at the right level of abstraction. The `attr()` specification does not say "and by the way, if you implement this in JavaScript, you will need to handle the custom property inheritance problem." The media pseudo-classes specification does not say "note that the stalled flag is internal and has no DOM surface." Those are implementation concerns, not specification concerns. The specification's job is to define the what, not the how.

The complexity does not disappear. It moves to the right place. For browser engine implementers, it lives in the C++ or Rust that processes the cascade. For polyfill authors, it surfaces during planning. For web developers using the feature, ideally it is invisible entirely.

This is actually a success story about how specifications work. The fact that `:playing` is simple to write in CSS — you just write `video:playing { ... }` — is a direct consequence of careful, hard-won decisions at every layer below that abstraction.

## The Value of Multiple Inputs

The planning process for both polyfills benefited from something I want to name explicitly: the value of input from multiple directions simultaneously. Human reasoning, AI reasoning, adversarial review, and direct spec reading each contributed things the others missed.

The `CSS.supports()` property name trap was caught by careful spec reading. The four incorrect DOM conditions in an early draft, including the wrong definition of `:muted`, were caught by an agent cross-referencing the normative WHATWG HTML specification rather than trusting a prose summary. The URL absolutization requirement for `<link>` stylesheets was caught during implementation planning, not during initial design. The broken spec link in the stalled flag section was caught during review.

None of these were caught by any single input. They emerged from the process of multiple perspectives working on the same problem, each bringing something the others missed.

This is, I think, the most transferable lesson from this project: the value of conformance-driven development is not just the tests. It is the rigour that working toward an objective standard imposes on the thinking. The tests force you to be specific. Specificity forces you to encounter the complexity. Encountering the complexity early — in planning, not in production — is what good engineering actually looks like.

After going through this process, I have a proposal. I would like to put forward two new global public holidays for serious consideration.

The first is **Browser Engineer Appreciation Day** — a day to reflect on the fact that the features we write in a single line of CSS are the product of years of careful implementation work across multiple engineering teams, multiple engines, and multiple operating systems. The people who figured out that `readyState` transitions do not always fire an event, and who handled that correctly anyway, deserve a day off. And consider what it takes to implement `:volume-locked`: a browser engineer has to reach past the web platform entirely, query the underlying operating system for its current volume lock state, wire that OS-level signal into the browser's style engine, and keep it in sync as the user's system settings change, all so that a web developer can write a single CSS selector. That work is invisible when it is done well, which is precisely why it deserves to be named.

The second is **Specification Author Appreciation Day** — a day to appreciate that someone sat down and made the hard decisions so that the rest of us do not have to. That `:playing` is simple to write is not an accident. It is the result of deliberate, careful work by people who thought through every edge case so that the abstraction could be clean. The dragons we encountered during implementation are dragons that the specification authors already fought; they just fought them in a meeting room rather than in a code editor.

Both holidays would, of course, be observed by spending the day reading specifications and writing tests. It is the least we can do.

---

## Further Reading

- [CSS Values and Units Module Level 5 — `attr()` notation](https://www.w3.org/TR/css-values-5/#attr-notation)
- [CSS Selectors Level 4 — Resource State Pseudo-Classes](https://drafts.csswg.org/selectors/#resource-pseudos)
- [HTML Standard — Media element pseudo-classes](https://html.spec.whatwg.org/multipage/semantics-other.html#selector-muted)
- [Web Platform Tests — CSS Selectors: Media](https://wpt.fyi/results/css/selectors/media)
- [Interop 2026 Dashboard](https://wpt.fyi/interop-2026)
- [MDN: HTMLMediaElement Events](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement#events)
- [MDN: CSS.supports()](https://developer.mozilla.org/en-US/docs/Web/API/CSS/supports_static)
- [CSS: What is IACVT? — Bramus](https://www.bram.us/2024/02/26/css-what-is-iacvt/)
- [Dynamic CSS Secrets — Lea Verou](https://projects.verou.me/talks/dynamic-css-secrets/)
- [MDN: @supports](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports)
- [CSS Conditional Rules Module Level 4](https://www.w3.org/TR/css-conditional-4/)
