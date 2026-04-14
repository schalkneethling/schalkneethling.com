---
title: "Introducing masonry-gridlanes-wc: A Native-First Masonry Web Component"
pubDate: 2026-04-14
description: "A light-DOM custom element for CSS masonry layouts that uses display: grid-lanes when available and falls back to a spec-aligned JavaScript placement engine. Version 0.1.0 is ready for real projects."
author: "Schalk Neethling"
tags: ["web-components", "css"]
---

## The problem

Masonry layouts have been a staple of the web for years. Pinterest popularised the pattern, and libraries like [Masonry by David DeSandro](https://masonry.desandro.com) made it accessible to everyone. But the web platform itself has never had a native way to do it. That is changing.

[CSS Grid Level 3](https://drafts.csswg.org/css-grid-3/#grid-lanes-model) introduces `display: grid-lanes`, a new layout mode where one axis follows a strict grid and the other uses a stacking (masonry) algorithm. Items in the following row rise up to fill the gaps left by shorter items above them, producing that characteristic tightly-packed look without the rigid row tracks of regular grid.

<BaselineStatus id="masonry" />

This is exciting. It means the platform is gaining a first-class way to express masonry layouts in CSS. You can read more about how `display: grid-lanes` works, including column and row masonry with spanning items, on [MDN's masonry layout guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Masonry_layout).

The reality, though, is that `display: grid-lanes` is still experimental. It will be some time before most teams can rely on it in production. And that is completely fine — this is how the platform evolves. But what do you use in the meantime?

## A different take

I wanted to try something. Instead of building yet another masonry library that has no connection to what the platform is heading towards, I wanted to build one that is shaped by `grid-lanes` from the start:

- **Native first.** If your browser already supports `display: grid-lanes`, the library steps out of the way and lets the browser do its thing. No JavaScript layout engine, no overhead.
- **Spec-aligned fallback.** When native support is not available, the JavaScript fallback keeps the same mental model as Grid Lanes. You think in columns, `gap`, `min-column-width`, and item spanning — not in an unrelated layout abstraction. An important distinction: when native support does not exist, what the library generates is intentionally close for the core masonry model, but it is not a full polyfill for arbitrary Grid Lanes CSS.
- **Web component.** The whole thing is a light-DOM [custom element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) called `<masonry-grid-lanes>`. Your markup stays semantic. Your children stay in the light DOM.

The result is [`@schalkneethling/masonry-gridlanes-wc`](https://github.com/schalkneethling/masonry-gridlanes-wc), and version `0.1.0` is ready for you to try.

## Getting started

Install it from npm:

```bash
npm install @schalkneethling/masonry-gridlanes-wc
```

Then register the element and adopt its styles:

```javascript
import {
  adoptMasonryGridLanesStyles,
  defineMasonryGridLanes,
} from "@schalkneethling/masonry-gridlanes-wc";

defineMasonryGridLanes();
await adoptMasonryGridLanesStyles(document);
```

And use it in your HTML:

```html
<masonry-grid-lanes min-column-width="240" gap="16">
  <article>One</article>
  <article>Two</article>
  <article>Three</article>
</masonry-grid-lanes>
```

That is it. The element handles column calculation, gap spacing, and the masonry packing algorithm. If you have used CSS Grid's `repeat(auto-fill, minmax(...))` pattern before, this will feel familiar — because that is exactly what it maps to under the hood.

## Pretext for text-heavy layouts

One thing I wanted to explore with this library is what happens when your masonry layout is purely textual. Think a wall of quotes, a stream of posts, or a feed of short notes. In these cases, you do not want the browser to measure every single card on every resize. Each of those measurements can trigger a [forced reflow](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing) — the browser has to synchronously recalculate layout in order to return geometry values like element heights. Doing this repeatedly, especially on resize, is expensive and one of the main causes of laggy, janky experiences on the web. The good news is that when cards are purely textual, their heights can be predicted from text metrics alone.

This is where [Pretext](https://github.com/chenglou/pretext) comes in. Pretext is a library by Cheng Lou that solves exactly this with a precalculate approach — computing text layout dimensions without requiring DOM measurement. If you opt in by adding `text-metrics="pretext"` to your host element, `masonry-gridlanes-wc` uses Pretext to compute card heights. The result is fast, incredibly responsive layouts that skip the usual measure-then-position cycle on resize.

```html
<masonry-grid-lanes min-column-width="280" gap="16" text-metrics="pretext">
  <article>Text-only card</article>
  <article>Another text-only card</article>
</masonry-grid-lanes>
```

This path is best when every card is plain text, the typography and chrome are shared across cards, and resize cost matters more than first-layout cost. For mixed or rich markup cards, the library stays on DOM measurement — and that is fine in most cases.

## Row mode (experimental)

Column masonry is the most common pattern, but `grid-lanes` also supports row-based masonry where items pack sideways instead of downward. Version `0.1.0` includes experimental support for this through `mode="rows"`:

```html
<masonry-grid-lanes mode="rows" row-count="3" min-row-height="176" gap="18">
  <article class="row-card">Compact summary</article>
  <article class="row-card row-card--media">Media + copy</article>
</masonry-grid-lanes>
```

The mental model here is different from column masonry. Items pack across lanes horizontally, and the host element becomes the scroll surface. Cards should have intentional inline-size limits so they stay readable. I will be honest — row mode is still a bit funky at times. It is promising, especially when authors treat the host as the scroll container and give cards explicit width constraints, but it has rough edges that I am actively working on.

## Seven live demos

I have put together a set of demos at [masonry.schalkneethling.com/demos](https://masonry.schalkneethling.com/demos/) that show the component in different scenarios: image masonry with Unsplash photography, a text stream pulling from Bluesky, social cards with link previews, a mixed wall combining images and text, row lanes, a column/row reference switcher, and an interactive playground where you can tune the attributes yourself.

The demos are the best way to get a feel for where the library is today and where it is heading.

## What v0.1.0 is and is not

I want to be clear about what this release represents. The strongest parts today are column masonry, the spec-aligned fallback behaviour, and text-heavy layouts using Pretext. Row mode is experimental and, frankly, still a bit funky at times — but it is there and it is improving. The library is intentionally built around a platform feature that will continue to evolve, and it will evolve with it.

The goal of `0.1.0` is not to claim that every masonry use case is solved. It is to provide a practical, well-tested, native-first foundation that you can use now while the specification and browser support mature. I am already using it myself for the [/projects page on schalkneethling.com](https://schalkneethling.com/projects), so I am eating my own cooking here.

## Where the fallback diverges from a future browser implementation

In the spirit of being upfront about what this is and is not, here are the places where the JavaScript fallback will behave differently from a native `display: grid-lanes` implementation:

The fallback only parses simple placement syntax: `auto`, integer line numbers, and `span N`. It is not a full CSS Grid parser with named lines or the broader grammar. It also does not infer fallback behaviour from arbitrary authored native CSS like custom `grid-template-columns` or other Grid features — it reads a narrower set of inputs and computes absolute positions from those.

Row mode is intentionally opinionated in fallback. It caps unconstrained inline size, keeps the host as the scroll surface, and clamps item height to lane extent for predictability. This is spec-shaped but not identical to a browser engine's full intrinsic sizing behaviour.

Finally, some values are treated numerically in fallback rather than through full CSS unit resolution, so exact parity for every CSS length and unit combination is not guaranteed.

None of this should stop you from using the library. These are the edges where the fallback simplifies in order to stay practical, and they are the edges that disappear entirely once native `grid-lanes` support lands in your target browsers.

## I need your help

This is where you come in. I would love for you to try `masonry-gridlanes-wc` in a project — a side project, a prototype, a real feature if you are feeling adventurous — and tell me what you find. What is broken? What is wrong? What could be better? And if something is great, I would not mind hearing that either.

You can file issues on [GitHub](https://github.com/schalkneethling/masonry-gridlanes-wc/issues). The project is MIT-licensed and contributions are welcome.

## Further reading

- [MDN: Masonry layout (CSS Grid Level 3)](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Masonry_layout)
- [CSS Grid Layout Module Level 3 specification](https://drafts.csswg.org/css-grid-3/#grid-lanes-model)
- [Pretext by Cheng Lou](https://github.com/chenglou/pretext)
- [MDN: Using custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
- [`masonry-gridlanes-wc` on GitHub](https://github.com/schalkneethling/masonry-gridlanes-wc)
- [Live demos](https://masonry.schalkneethling.com/demos/)
