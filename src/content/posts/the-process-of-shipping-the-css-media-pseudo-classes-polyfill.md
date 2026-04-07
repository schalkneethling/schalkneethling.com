---
title: "The Process of Shipping The CSS Media Pseudo Classes Polyfill"
pubDate: 2026-04-07
description: The CSS Media Pseudo Classes Polyfill is now available on npm. This post covers what shipped, what I learned about the CSSOM and unsupported CSS, how you can try it, and what comes next."
author: "Schalk Neethling"
tags: ["css", "web-standards"]
---

A few weeks ago I published a post called [Cutting Across The What And The How](https://schalkneethling.com/posts/cutting-across-the-what-and-the-how-what-building-a-polyfill-is-teaching-me-about-web-standards/) about what happens when you try to plan a polyfill by reading specifications closely and thinking through the architecture before writing code. That post was about the planning — what the specification defines, what the architecture should look like, and what happens when you think through a problem carefully before writing code. This post is about what happened when that plan met a real browser. The polyfill shipped. Most of the plan held. One part of it did not, and the reason it did not is one of the most interesting things I learned during the entire project.

The [css-media-pseudo-polyfill](https://github.com/schalkneethling/css-media-pseudo-polyfill) is now available on npm. It polyfills six of the seven CSS media element pseudo-classes — `:playing`, `:paused`, `:seeking`, `:buffering`, `:stalled`, and `:muted` — for browsers that do not yet support them. These pseudo-classes are defined in the [WHATWG HTML specification](https://html.spec.whatwg.org/multipage/semantics-other.html#selector-playing) and are part of [Interop 2026](https://wpt.fyi/interop-2026). If you want the background on why this polyfill exists, what `:volume-locked` is, why it cannot be polyfilled, and how the architecture was planned, the companion post covers all of that.

## What Shipped

The polyfill runs in four stages. First, it tests each pseudo-class individually using `CSS.supports('selector(:name)')` and only polyfills the ones the browser does not recognise. Second, it rewrites inline `<style>` elements by parsing the CSS with [css-tree](https://github.com/nicolo-ribaudo/css-tree) and injecting a class-based equivalent rule immediately after each original rule that uses a target pseudo-class. For example, given:

```css
video:playing {
  outline: 0.25rem solid green;
}
```

The polyfill produces:

```css
video:playing {
  outline: 0.25rem solid green;
}
video.media-pseudo-polyfill-playing {
  outline: 0.25rem solid green;
}
```

The browser skips the rule it does not understand, and the class-based equivalent is right there as the fallback. Because both `PseudoClassSelector` and `ClassSelector` carry specificity `(0,1,0)`, this substitution is specificity-neutral — no `:where()` wrapping is needed, and the replacement behaves correctly inside `:is()`, `:where()`, `:not()`, and `:has()`. Third, it rewrites same-origin `<link rel="stylesheet">` elements using a fetch-based approach. Fourth, it discovers and tracks media elements. A `MutationObserver` on `document.documentElement` with `{ childList: true, subtree: true }` watches for DOM changes in both directions.

When nodes are added, the observer checks whether each node is itself an `<audio>` or `<video>` element. If it is not, it also runs `querySelectorAll("audio, video")` on the new node to catch nested media elements. It then attaches event listeners to each relevant new node as appropriate. When nodes are removed, listeners are detached and the corresponding `WeakMap` entry is cleaned up. A guard against double-binding ensures that rapidly reparented elements — where the observer reports the same element in both `removedNodes` and `addedNodes` in a single batch — do not end up with duplicate listeners.

A second `MutationObserver` in a separate module handles dynamic stylesheets. If a `<style>` or `<link rel="stylesheet">` element is added to the DOM after initial load, or if the content of an existing `<style>` element is mutated, the polyfill re-processes it. So both dynamic media elements and dynamic stylesheets are covered.

The polyfill ships two entry points: a default export that auto-applies on `DOMContentLoaded`, and a `"./fn"` export that gives you the `polyfill()` function for manual invocation. The manual entry point is there to address the flash of unstyled content (FOUC) window — if you call the polyfill from a synchronous `<script>` in `<head>`, you can minimise the gap between first paint and polyfill initialisation.

## The Discovery That Changed the Plan

The planning post laid out a deliberate strategy for handling `<link>` stylesheets. The plan was to use the CSSOM API — walk the stylesheet's `cssRules`, find the rules containing target pseudo-classes, and insert rewritten equivalents via `insertRule()`. This would avoid fetching the stylesheet a second time, and it would preserve the browser's URL resolution context so that relative `url()` references in the CSS would continue to work correctly.

It was a sound plan. It was also, perhaps, a little naive.

The moment I tried it, the rules were not there. The CSSOM was missing every rule that contained a pseudo-class the browser did not recognise. They were simply absent, as if they had never been part of the stylesheet.

This turns out to be correct browser behaviour, and why we can ship progressive enhancements and all our little CSS mishaps without blowing up the entire design. When a CSS parser encounters a selector it does not understand, it drops the entire rule during parsing. By the time the stylesheet is exposed through the CSSOM, the rules the polyfill needs to rewrite have already been discarded. The browser is doing exactly what the CSS specification says it should do: unknown selectors make a rule invalid, and invalid rules are not represented in the object model.

This is a fundamental constraint, not a bug. And it means that any CSS polyfill targeting unrecognised selectors cannot use the CSSOM as its source of truth for linked stylesheets. The rules it needs are gone before it ever gets to look at them.

The fix was straightforward once the problem was understood: fetch the raw CSS text via the Fetch API before the browser parses it, run it through the same `rewriteCss()` function used for inline styles, and inject the rewritten output as a `<style>` element immediately after the original `<link>`, which is then disabled. This does mean an additional network request per same-origin stylesheet, though the browser's HTTP cache should serve the response from memory in most cases since the stylesheet was already fetched for the original `<link>`.

The URL resolution concern that the planning post anticipated — relative `url()` paths breaking when CSS is re-injected from a different context — became an immediate concern and was addressed as part of the switch to fetch. The polyfill now rewrites relative URLs to absolute paths during the fetch-based rewriting step, skipping those that are already absolute, root-relative, or base64-encoded. The CSSOM being empty was the bigger surprise, but the URL problem needed solving too.

## The Approach That Held

The immediate-sibling injection strategy for cascade preservation, which the planning post worked through in detail, held up in practice. Rules stay inside their `@layer`, `@media`, and `@supports` blocks, source order is preserved, and the browser skips the rule it does not understand while the class-based fallback sits right next to it. It works the way a polyfill should.

## Known Limitations

This is a v1 release with limitations worth knowing about.

`:volume-locked` cannot be polyfilled. The locked state lives at the operating system or user agent level with no DOM surface. The polyfill handles `:volume-locked` selectors gracefully in rewritten stylesheets — pruning them from selector lists, removing rules where they are the sole selector — but it never sets the corresponding class.

Cross-origin `<link>` stylesheets are not touched. The fetch-based approach requires same-origin access to the CSS text. Stylesheets served from external CDNs are detected via origin comparison and skipped.

And there is the FOUC window. Stylesheet rewriting runs when the polyfill is invoked. If you use the default entry point, that is `DOMContentLoaded`. There will be a gap between first paint and polyfill initialisation where pseudo-class-based styles are not applied. The `"./fn"` entry point exists specifically to narrow that gap.

One thing worth being aware of that is not a limitation: the polyfill uses namespaced class names like `.media-pseudo-polyfill-playing` rather than simply `.playing`. The polyfill only ever toggles these classes on `<audio>` and `<video>` elements, and the verbose prefix makes accidental collisions with author-defined classes unlikely.

## Try It

The polyfill is available on [npm](https://www.npmjs.com/package/@schalkneethling/css-media-pseudo-polyfill) and the source is on [GitHub](https://github.com/schalkneethling/css-media-pseudo-polyfill). The README covers installation, both entry points, and the full list of design decisions. There is also a [live demo page](https://media-pseudo-classes-polyfill.schalkneethling.com) where you can see the polyfill in action.

If you run into something unexpected, please [open an issue](https://github.com/schalkneethling/css-media-pseudo-polyfill/issues). Bug reports from real-world usage are exactly what a v1 needs.

## What Comes Next

The project has nine open issues, and I think they tell a useful story about where a v1 ends and a v2 begins. They fall roughly into three categories.

The testing gaps are the most immediately actionable. The current end-to-end tests run in Chromium only. Adding Firefox and WebKit to the Playwright configuration is tracked, as are dedicated tests for dynamically inserted media elements, dynamically added stylesheets, and partial native support scenarios where some pseudo-classes are natively supported and others are not.

The enhancement ideas are more exploratory. Investigating whether cross-origin stylesheets can be supported (perhaps via a CORS-enabled fetch or a build-time preprocessing step), evaluating the bundle cost of css-tree and whether a lighter alternative exists, and adding performance benchmarks to catch regressions are all open questions.

These issues are an invitation. If any of them interest you, the repository is at [github.com/schalkneethling/css-media-pseudo-polyfill](https://github.com/schalkneethling/css-media-pseudo-polyfill).

## What This Taught Me

The planning post argued that the value of conformance-driven development is not just the tests — it is the rigour that working toward an objective standard imposes on the thinking. I still believe that. But the implementation added a corollary: sometimes you only discover what you got wrong when the code runs in the browser.

The CSSOM dropping unrecognised selectors is not obscure knowledge. Philip Walton wrote about this exact problem in [The Dark Side of Polyfilling CSS](https://philipwalton.com/articles/the-dark-side-of-polyfilling-css/) years ago. The container query polyfill team at Google encountered it. It is well-documented. And yet, during planning, I did not connect it to my own architecture. The planning post even used the phrase "modifying the live stylesheet via the CSSOM" as though it were a settled solution. It took running the code and seeing an empty `cssRules` collection to make the constraint real.

This is not a failure of the planning process, it is simply a reality of software engineering. The planning post caught real problems — the stalled flag's lack of DOM surface, the `:muted` versus `volume === 0` distinction, the cascade implications of the three rewriting approaches. The implementation caught this one. Together they produced something I am genuinely satisfied with.

---

## Further Reading

- [css-media-pseudo-polyfill on GitHub](https://github.com/schalkneethling/css-media-pseudo-polyfill)
- [Cutting Across The What And The How — the planning post](https://schalkneethling.com/posts/cutting-across-the-what-and-the-how-what-building-a-polyfill-is-teaching-me-about-web-standards/)
- [HTML Standard — Media element pseudo-classes](https://html.spec.whatwg.org/multipage/semantics-other.html#selector-playing)
- [CSS Selectors Level 4 — Resource State Pseudo-Classes](https://drafts.csswg.org/selectors/#resource-pseudos)
- [Interop 2026 Dashboard](https://wpt.fyi/interop-2026)
- [The Dark Side of Polyfilling CSS — Philip Walton](https://philipwalton.com/articles/the-dark-side-of-polyfilling-css/)
- [Inside the Container Query Polyfill — Chrome for Developers](https://developer.chrome.com/blog/inside-the-container-query-polyfill)
- [MDN: HTMLMediaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement)
- [Web Platform Tests — CSS Selectors: Media](https://wpt.fyi/results/css/selectors/media)
