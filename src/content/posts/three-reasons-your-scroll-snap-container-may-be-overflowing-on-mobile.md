---
title: "Three Reasons Your scroll-snap Container May Be Overflowing on Mobile"
pubDate: 2026-02-27
description: "Take a fieldset, pour some radio buttons and visually hidden labels into it, wrap it in scroll-snap, and you have a clean, semantic horizontal scroller on mobile. What could go wrong? Well... there is nuance we need to talk about."
author: "Schalk Neethling"
tags: ["html", "css", "frontend-engineering-explained"]
---

Every browser ships with what is known as a [user agent stylesheet](https://developer.mozilla.org/en-US/docs/Glossary/User_agent) that sets some defaults for HTML elements. To see the effect of these defaults, [open this CodeSandbox](https://codesandbox.io/p/sandbox/y647rf) and uncomment the following line at the top of the stylesheet:

```css
* {
  all: unset;
}
```

Everything collapses. No spacing, no font hierarchy, no visible form controls, no list markers. It is a stark reminder of how much the browser is quietly doing for you. Most of these defaults are sensible and helpful. But occasionally one of them interacts unexpectedly with your own styles in a way that is genuinely hard to trace.

One of these defaults can be especially problematic when you have a `fieldset` as the parent container for a list of radio button elements that is then turned into a horizontal scrolling container with `scroll-snap`. The HTML structure for this kind of component looks roughly like this:

```html
<fieldset class="NewsroomFilter">
  <legend class="visually-hidden">Filter by category</legend>
  <label class="NewsroomFilter-label" for="newsroom-category-all">
    <input
      class="visually-hidden"
      type="radio"
      name="newsroom-category"
      id="newsroom-category-all"
      value="all"
      checked
    />
    <span>All</span>
  </label>
  <!-- wrapper exists to give JavaScript a target for dynamically injecting additional labels -->
  <div class="NewsroomFilter-categories">
    <label class="NewsroomFilter-label" for="newsroom-category-interviews">
      <input
        class="visually-hidden"
        type="radio"
        name="newsroom-category"
        id="newsroom-category-interviews"
        value="interviews"
      />
      <span>Interviews</span>
    </label>
    <!-- more labels injected dynamically -->
  </div>
</fieldset>
```

The idea is that below, say, `48rem`, the container should stretch only as wide as its parent, and any overflow should scroll. The CSS looks like this:

```css
.NewsroomFilter {
  display: flex;
  gap: var(--slider-track-gap);
  overflow-x: auto;
  /* Prevent accidental history navigation when swiping. */
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
}

.NewsroomFilter-categories {
  display: contents;
}
```

The layout was blowing out on mobile. Everything stretching to around `1180px`, the entire page falling apart. At this point it seemed reasonable to try constraining the container explicitly:

```css
.NewsroomFilter {
  inline-size: 100vw;
  inline-size: 100dvi;
}
```

That did not help. Neither did a fixed value like `inline-size: 400px`, nor `max-inline-size`. There are three separate things conspiring against us here.

## Cause one: `min-inline-size` on `fieldset`

The UA stylesheet sets the following on `fieldset`:

```css
fieldset {
  min-inline-size: min-content;
}
```

The [`min-inline-size`](https://developer.mozilla.org/en-US/docs/Web/CSS/min-inline-size) property sets the minimum size of an element along the inline axis (horizontal in left-to-right writing modes). The [`min-content`](https://developer.mozilla.org/en-US/docs/Web/CSS/min-content) value means the element will be at least as wide as its widest non-wrappable content.

Because `display: flex` defaults to `flex-wrap: nowrap`, which is what wwe want, all the items in the row are explicitly prevented from wrapping. The `fieldset` has to be wide enough to contain all of them in a single row, and that sum becomes the `min-content` size it refuses to shrink below. As [MDN confirms for the `width` property](https://developer.mozilla.org/en-US/docs/Web/CSS/width) — and the same constraint applies to the logical equivalents — if the value for `inline-size` is less than the value for `min-inline-size`, then `min-inline-size` overrides it. It does not matter whether `inline-size` is set to `100vw`, a fixed `400px`, or `max-inline-size` — if `min-inline-size: min-content` resolves to something larger, the element will be that larger size.

### A detour: vw, dvi, and viewport units

The two `inline-size` declarations we tried are worth understanding a little better, since they are easy to reach for and easy to misunderstand.

The `vw` unit is `1%` of the viewport width. The `dvi` unit is from the family of [dynamic viewport units](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length#dynamic_viewport_units). The `vi` part maps to the viewport's inline axis (horizontal in left-to-right writing modes), and the `d` prefix means it responds to dynamic browser UI changes like the address bar appearing and disappearing on mobile scroll. Using `100dvi` as a progressive enhancement over `100vw` (for browsers that support it) might seem reasonable, but there are two things worth knowing before reaching for it.

First, `dvi` is not a stand-in for `100%`. As MDN explains, [percentage values are relative to the parent element's size](https://developer.mozilla.org/en-US/docs/Web/CSS/percentage), whereas [viewport-percentage lengths like `dvi` are always relative to the viewport itself](https://developer.mozilla.org/en-US/docs/Web/CSS/length#viewport-percentage_lengths) — so if the container sits inside a parent with padding or a constrained width, `100dvi` will still reach all the way to the viewport edge and can itself introduce overflow.

Second, and perhaps more importantly, MDN includes this note on dynamic viewport units: "using viewport-percentage units based on the dynamic viewport size can cause the content to resize while a user is scrolling a page. This can lead to degradation of the user interface and cause a performance hit." The static `vi` unit or a percentage-based approach is generally the safer choice.

As it turned out, none of these sizing approaches were needed once the real causes were addressed. Not that they were helping us to begin with.

### The fix

```css
.NewsroomFilter {
  min-inline-size: unset;
}
```

Setting `min-inline-size` to [`unset`](https://developer.mozilla.org/en-US/docs/Web/CSS/unset) removes the UA stylesheet value, allowing the `fieldset` to shrink freely. At this point the `fieldset` itself was correctly constrained and scrolling. But the page was still overflowing.

## A detour: display contents

With the first fix in place, attention turned to the inner wrapper `div` carrying `display: contents`. It was there for a practical reason: giving JavaScript a stable DOM target to append dynamically injected labels into, while having those labels participate directly in the flex layout of the `fieldset` as if the wrapper were not there.

[`display: contents`](https://developer.mozilla.org/en-US/docs/Web/CSS/display#box) removes an element's own box from the formatting context entirely. The element itself ceases to participate in layout, and its children are hoisted up to participate in the parent's layout directly. It is a useful tool when you need a grouping element in the HTML but do not want it to interfere with a flex or grid layout.

However, with the page still overflowing after the first fix, the `display: contents` wrapper became a suspect. My concern was that removing an element's box from the formatting context might be influencing the behaviour of flex or `scroll-snap` in some unexpected way. Removing it and appending the dynamically injected labels directly to the `fieldset` eliminated it as a variable. As it turned out, it was a red herring, but ruling it out was a worthwhile step in narrowing down the real cause.

It is also worth knowing that `display: contents` has had a patchy accessibility history. Because the element's box is removed, some browsers have historically also removed it from the accessibility tree, meaning semantic elements like `fieldset` or `article` with `display: contents` could become invisible to assistive technology. Support has improved in modern browsers, but it is worth treating with caution on semantically meaningful elements.

## Cause two: the visually hidden input escaping its containing block

With the `fieldset` correctly constrained and the `display: contents` wrapper removed, the page was still overflowing. This standard overflow diagnostic snippet returned nothing:

```javascript
document.querySelectorAll("*").forEach((element) => {
  if (element.offsetWidth > document.documentElement.offsetWidth) {
    console.log(element, element.offsetWidth);
  }
});
```

This snippet works by comparing each element's `offsetWidth` against the document's own width. It is a reliable first pass for finding elements that are wider than the viewport, but it only measures layout size. Absolutely positioned elements that are rendered outside the viewport do not necessarily inflate their parent's `offsetWidth`, so they slip through undetected.

The extended version uses [`getBoundingClientRect()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect) instead, which reports the actual rendered position and dimensions of an element on screen — accounting for transforms, scroll position, and absolute positioning:

```javascript
document.querySelectorAll("*").forEach((element) => {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);

  if (rect.right > window.innerWidth) {
    console.log("Extends past right edge:", element, rect.right);
  }

  if (style.transform !== "none") {
    console.log("Has transform:", element, style.transform);
  }

  const marginLeft = parseFloat(style.marginLeft);
  const marginRight = parseFloat(style.marginRight);
  if (marginLeft < 0 || marginRight < 0) {
    console.log("Has negative margin:", element, { marginLeft, marginRight });
  }
});
```

This immediately surfaced the culprit: Some of the visually hidden radio `input` elements were rendering over 1100px to the right of the viewport. Here is the visually-hidden utility class in question:

```css
.visually-hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(100%);
  white-space: nowrap;
}
```

An absolutely positioned element is placed relative to its nearest [positioned ancestor](https://developer.mozilla.org/en-US/docs/Web/CSS/position) — the nearest ancestor with a `position` value other than `static`. If no positioned ancestor is found nearby, the browser climbs the DOM tree until it finds one. In this case, the wrapping `label` had no `position` set, so the input was anchored to a positioned ancestor much further up the page, placing it far outside the scroll container and well beyond the right edge of the viewport.

### The second fix

Adding `position: relative` to the label makes it the containing block for the absolutely positioned input:

```css
.NewsroomFilter-label {
  position: relative;
}
```

With this in place, the input stays tucked inside its own label, within the scroll container, and no longer bleeds out across the page.

## The result

With both fixes applied, the explicit `inline-size` declarations could be removed. The container sized itself correctly without them:

```css
.NewsroomFilter {
  display: flex;
  gap: var(--slider-track-gap);
  min-inline-size: unset;
  overflow-x: scroll;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
}

.NewsroomFilter-label {
  position: relative;
}
```

## How we got here: the full progression

For anyone who wants the condensed version — or for future me when I have forgotten all of this:

- Started with a `fieldset` as a flex scroll-snap container — layout was blowing out on mobile to ~1180px
- Tried `inline-size: 100vw` and `100dvi` to constrain it — no effect
- Tried a fixed `inline-size: 400px` — still no effect
- Tried `max-inline-size` — still no effect
- Discovered that hiding the `fieldset` entirely made the layout resolve — confirmed the `fieldset` was the overflow source
- Identified the UA stylesheet default of `min-inline-size: min-content` on `fieldset` — applied `min-inline-size: unset` ✓
- The `fieldset` was now correctly constrained and scrolling, but the page was still overflowing
- Switched from `fieldset` to a `div` and removed the `legend` to rule out element-specific behaviour — problem persisted
- Tried appending dynamically injected labels directly to the `fieldset` instead of a nested `div` with `display: contents` — problem persisted
- Ran the standard `offsetWidth` diagnostic snippet — returned nothing, no culprit found
- Switched to `getBoundingClientRect()` diagnostic — revealed the visually hidden radio `input` was rendering over 1100px to the right of the viewport
- Identified the cause: no `position: relative` on the wrapping `label`, so the absolutely positioned input was escaping up the DOM to a distant containing block
- Added `position: relative` to the label ✓
- With both fixes in place, the explicit `inline-size` was no longer needed and was removed — the container sized itself correctly without it ✓

Two small fixes, a lot of detective work. Hopefully this saves you some of that time.

## Further Reading

- [MDN: `width` (and the min/max constraint model)](https://developer.mozilla.org/en-US/docs/Web/CSS/width)
- [MDN: `min-inline-size`](https://developer.mozilla.org/en-US/docs/Web/CSS/min-inline-size)
- [MDN: `min-content`](https://developer.mozilla.org/en-US/docs/Web/CSS/min-content)
- [MDN: `unset`](https://developer.mozilla.org/en-US/docs/Web/CSS/unset)
- [MDN: `position`](https://developer.mozilla.org/en-US/docs/Web/CSS/position)
- [MDN: `display: contents`](https://developer.mozilla.org/en-US/docs/Web/CSS/display#box)
- [MDN: Dynamic viewport-percentage lengths (`dvi`, `dvw`, etc.)](https://developer.mozilla.org/en-US/docs/Web/CSS/length#dynamic_viewport-percentage_lengths)
- [MDN: `fieldset` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset)
- [MDN: `getBoundingClientRect()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)
- [CSS Box Sizing Module Level 4 — W3C](https://www.w3.org/TR/css-sizing-4/)
