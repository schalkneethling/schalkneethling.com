---
title: "The day CSS made me learn algebra again, and I liked it"
pubDate: 2026-05-12
description: "A carousel overlay bug led me to a deep dive into fluid typography, container queries, and understanding clamp()."
author: "Schalk Neethling"
tags: ["css", "frontend-engineering-explained"]
---

## The problem that started it all

I was building a carousel. Each slide had a photo, and on top of the photo, an overlay with a pull-quote and the author's name. The structure was the usual suspect:

```html
<div class="slide-mediaWrapper">
  <img class="slide-media" src="..." />
  <div class="slide-overlay"><!-- quote + author --></div>
</div>
```

The wrapper used `grid`, and the image and overlay were stacked via `grid-area: 1 / 1` — a common technique for overlaying content on media. Clean markup, no absolute positioning.

Then I looked at it in the browser.

The overlay was _overshooting the image_. The overlay's bottom edge was hanging below the photo, and I went through all the usual suspects — `max-content`, `fit-content`, `inline-grid` on the wrapper — chasing the idea that `grid`'s auto tracks were somehow sizing wrong. None of them changed anything. I convinced myself for a while that `grid` was the wrong tool and I'd need to rebuild the overlay with absolute positioning.

Then I inspected the image element. It had a `margin-block-end` on it. The overlay wasn't extending past the image at all — the _image_ had a margin pushing its bounding box out past its rendered content, and the grid cell was sizing to include that margin, so the overlay (sharing the cell) had more room than the image did.

I moved the margin from the `<img>` to the wrapper. The overlay snapped into alignment. No absolute positioning needed. No grid rewrite. A stray margin had masqueraded as a layout problem for the better part of an hour.

**Lesson filed:** when "an element is overflowing its container," always inspect the element _and its immediate siblings_ for margins before reaching for layout rewrites. The reason this caught me out is that grid auto-track sizing uses each item's _intrinsic size contribution_, and the [CSS Box Sizing spec](https://www.w3.org/TR/css-sizing-3/#intrinsic-contribution) is explicit about what that means: "Intrinsic size contributions are based on [the **outer size**](https://www.w3.org/TR/css-sizing-3/#outer-size) of the box; for this purpose auto margins are treated as zero." In other words, non-auto margins are part of the size the item contributes to its track. The `margin-block-end` on the image was being added to the image's contribution, the track grew to fit the image-plus-margin, and the overlay (sharing the cell) inherited that taller cell.

With the block-axis overshoot gone, I noticed a second issue: the image wasn't filling the wrapper's inline size. There was empty space on either side.

I inspected the image's computed styles. It had `max-inline-size: 100%` from the stylesheet reset (the classic responsive-image rule) but no `inline-size`. **That's a ceiling, not a target** — and that's where the gap came from. With `inline-size` (i.e. `width`) at its default `auto`, the [CSS 2.2 spec](https://www.w3.org/TR/CSS22/visudet.html#inline-replaced-width) is explicit about what happens for a replaced element with intrinsic dimensions: "if `'width'` has a computed value of `'auto'`, and the element has an intrinsic width, then that intrinsic width is the used value of `'width'`." So the `<img>` resolved to its file's natural pixel width. That width happened to be smaller than the wrapper, so it sat there at intrinsic, and `max-inline-size: 100%` had nothing to clamp — the ceiling only kicks in when the image is _bigger_ than the container, not when it's smaller.

The fix was a one-liner override, replacing the ceiling with an explicit target:

```css
.slide-media {
  inline-size: 100%; /* was only max-inline-size in the reset */
  block-size: auto;
}
```

With that, the image filled the wrapper and kept its aspect ratio. No cropping needed, so `object-fit` remained unnecessary.

At this point I had a clean slide: image filling the wrapper, overlay bounded to the image. I thought I was done. Then I resized the carousel.

This is where the real story starts.

## Fluid typography, and why viewports are the wrong axis

The existing setup used viewport-driven breakpoints: the font jumped from 2.25rem down to 1.625rem somewhere around mobile width. That works fine in most cases, but it was not the case here.

The change in size of the carousel slides was not really tied to the viewport. It was a box inside a box inside a layout. In one context, the slide was 432px wide; in another, 252px. The viewport told me nothing useful about how much room the overlay actually had.

The right tool here is container queries. Specifically, the `cqi` unit - 1% of the container's inline size. With `container-type: inline-size` on the wrapper, `cqi` lets children scale relative to the slide, not the screen.

And the idiomatic way to make _type_ scale fluidly is `clamp()`:

```css
font-size: clamp(MIN, preferred, MAX);
```

MIN and MAX are easy: those are floors and ceilings from the design system. The hard part is the middle expression — the _preferred_ value. I'd seen this pattern many times:

```css
font-size: clamp(1.625rem, 1.125rem + 2cqi, 2.25rem);
```

And I'd always treated it as a kind of incantation. Slope, interpolation, vibe. If it didn't work, I'd nudge the numbers until it did. This time, I decided it is high time I took the time to understand this incantation, if it is an incantation at all.

## Enter `y = mx + b`

It took me longer than I'd like to admit to see this, but once I did, everything clicked. The middle argument of `clamp()` is a **straight line** — the good old [slope-intercept form from high school algebra](https://www.khanacademy.org/math/algebra-basics/alg-basics-graphing-lines-and-slope/alg-basics-slope-intercept-form/a/introduction-to-slope-intercept-form):

```text
y = m·x + b
```

Where:

- **`y`** = the output (font size)
- **`x`** = the input (container width)
- **`m`** = slope (how fast font grows as container grows)
- **`b`** = intercept (the constant offset that positions the line)

Rewriting `1.125rem + 2cqi` in this frame:

- `1.125rem` is `b` — the fixed offset.
- `2cqi` is `m·x` — the variable part, which grows with the container.

And here's the insight that made the whole thing stop feeling like magic: **`2cqi` is `m × x` fused into a single token.**

The unit `cqi` is defined as "1% of the container's inline size." So when I write `2cqi`, that's really:

```text
2cqi = 2 × (container_width / 100) = 0.02 × container_width
```

The `2` is the coefficient (`m`), and `cqi` carries the container width implicitly (`x`). The multiplication is happening inside the unit.

This is true of every CSS length unit, by the way:

- `2rem` is `2 × root_font_size`
- `2em` is `2 × parent_font_size`
- `2vw` is `2 × (viewport_width / 100)`
- `2cqi` is `2 × (container_inline_size / 100)`

Each unit is a coefficient fused with a contextual lookup. Once you see that, `b + m·cqi` stops being exotic. It's a linear function where one of the operands happens to be resolved at layout time.

## Four knobs, two real choices

A `clamp(MIN, b + m·cqi, MAX)` has four numbers in it, but they're not all independent. Once you've decided MIN, MAX, and the two container widths where those thresholds should engage, `m` and `b` are derivatives.

So the real model is:

- **Design-given (fixed - well, mostly/ideally):** MIN and MAX (from the type scale).
- **Your choice:** `W₁` (the container width where font should equal MIN) and `W₂` (the container width where font should equal MAX).
- **Derived:** `m` and `b`, computed to make the line pass through `(W₁, MIN)` and `(W₂, MAX)`.

This reframing changed how I thought about the tool. The knobs I actually turn are `W₁` and `W₂`. Concrete, intuitive, answerable by looking at the browser. "At what container width should the font stop being small?" I can answer that. "What should the intercept be?" Now that is a different kettle of fish (an awkward, messy, or problematic situation) altogether. Thankfully, you don't have to answer that one; it falls out of the math.

The formulas:

```text
m = (MAX − MIN) / (W₂ − W₁) [in px/px]
b = MIN − m × W₁            [in px]
```

> **Note**: It is critical that you not mix units here.

Then to express the slope as `cqi` (multiplying by 100 because `cqi` is a percentage):

```text
m_cqi = m × 100
```

And the final CSS:

```css
font-size: clamp(MIN, b + m_cqi·cqi, MAX);
```

A worked example with my real numbers:

- MIN = 1.625rem = 26px
- MAX = 2.25rem = 36px
- W₁ = 252px (the smallest a slide will be in the carousel)
- W₂ = 432px (the largest a slide will be)

- Slope: (36 − 26) / (432 − 252) = 10 / 180 ≈ 0.0556 → **5.56cqi**
- Intercept: 26 − 0.0556 × 252 ≈ 12px → **0.75rem**

(Depending on the inputs, b can come out negative — that's fine. clamp() floors the final value at MIN, so users never see the negative extrapolation.)

```css
font-size: clamp(1.625rem, 0.75rem + 5.56cqi, 2.25rem);
```

So, at a 252px container:

`0.75rem + 5.56cqi` = `12 + (5.56 × 2.52)` = `12 + 14.01` = `26.01px` → hits MIN cleanly.

And at our 432px container:

`12 + (5.56 × 4.32)` = `12 + 24.02` = `36.02px` → hits MAX cleanly.

The `clamp()` handles anything outside this range. A simplifying assumption is hiding inside that "cleanly," and it's worth naming now, even though I'll come back to it at the end: this math only lands exactly on MIN and MAX if the **content box** of the container matches what you measured. If the wrapper has any padding or border of its own, `cqi` resolves against the smaller content box while devtools shows you the outer box, and the line will quietly fall short at one or both bounds in proportion to that gap. For the example above, assume a wrapper with no padding or border on itself (padding lives on inner elements).

## The two failure modes

Even with the math right, fluid type has two classic failure modes, and I ended up experiencing both:

**1. MIN not MIN enough.** The text overshoots even when the font has bottomed out at its smallest allowed size. When this happens, set the container below W₁ and check if the text fits. If not, MIN itself is too large for the smallest container and it time for a compromise conversation with your UX designer.

**2. Never reaches MAX.** The font stops climbing before it hits the upper bound. Diagnosis: W₂ is set higher than the largest container that actually exists in your layout. The line is still climbing at the largest real container width, but it never gets enough runway to reach MAX.

> **Note**: Remember the note a bit earlier about the content box? This will play a role here as well.

The meta-lesson: **fluid typography is only as good as the accuracy of your inputs.**

## German typography, hyphens, and a subtlety

Somewhere along the way, my overlay was still overshooting at the small end even with the math correct. The text had long German compound words ("Barrierefreiheit") that browsers wouldn't break by default, forcing the container wider than the image.

[`hyphens: auto`](https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens) solves this — but only if two conditions are met:

1. The element (or an ancestor) has a [`lang` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/lang) matching the content. Hyphenation is dictionary-based; the browser needs to know what language the text is in. MDN states this explicitly on the `hyphens` page: "You must specify a language using the `lang` HTML attribute to guarantee that automatic hyphenation is applied." `<html lang="de">` is enough for a German page.
2. The text is actually allowed to wrap. [`white-space: nowrap`](https://developer.mozilla.org/en-US/docs/Web/CSS/white-space) "suppresses line breaks (text wrapping) within the source" — and no line breaks means no hyphenation opportunities. Same effect if something upstream forces the box to its [`max-content`](https://developer.mozilla.org/en-US/docs/Web/CSS/max-content) inline size, since `max-content` is by definition the size the box would have _without_ any wrapping.
   This isn't directly about `clamp()`, but it interacts: hyphenation can relieve enough overshoot pressure that you don't need to reach for a smaller MIN. Worth trying before changing design tokens.

## Fluid padding is the companion technique

Once the font was fluid, the padding started looking wrong. At small container widths, the static padding ate a disproportionate share of the box, squeezing the text. At large widths, the same padding looked too narrow. The content had grown around fixed whitespace.

The fix is the same recipe:

```css
padding: clamp(MIN_PAD, b_pad + m_pad·cqi, MAX_PAD);
```

Or, if you don't need the floor/ceiling, just `padding: 6cqi`. Padding's endpoints are less critical than font size's, so you can often skip the `clamp()` entirely.

One subtle thing: **font-size and padding are coupled.** The text's available width is `container − 2 × padding`, and if both are fluid, both sides of that equation scale together. When I made padding fluid, the text's available width at the small end _increased_ (because padding shrank), which gave me more room to raise MIN back up. When tuning, do padding first, then re-tune font size.

## The workflow that finally worked

After all this, the workflow I converged on:

1. **Measure real container widths.** Open devtools, find the smallest and largest instances of the component. Write down `W₁` and `W₂`.
2. **Get MIN and MAX from the design system.** Don't negotiate them at first — start with what's given.
3. **Compute `m` and `b`.** Plug the four numbers into the formulas. Express slope as `cqi` by multiplying by 100.
4. **Write the clamp.** Paste in MIN, the `b + m·cqi` expression, and MAX.
5. **Test at both extremes plus a middle width.** If it fits everywhere, done.
6. **If it overshoots at the small end,** lower MIN (design conversation) or add `hyphens: auto` (if language allows).
7. **If it never reaches MAX,** recheck W₂ against reality. It's almost always too large.
8. **Make padding fluid too.** Use the same formula or a simple `Ncqi` value.
9. **Re-tune font if padding changes meaningfully shift available text width.**

In code, you can capture this entire formula once and parameterize it with CSS custom properties so the four knobs are the only things you actually edit:

```css
.CarouselSliderSlide-overlay-text {
  --min: 1.5; /* rem */
  --max: 2.25; /* rem */
  --w1: 252; /* px */
  --w2: 432; /* px */

  /* rem of font per 1% of container width */
  --slope-per-cqi: calc(
    (var(--max) - var(--min)) / (var(--w2) - var(--w1)) * 100
  );
  --intercept: calc(var(--min) - var(--slope-per-cqi) * var(--w1) / 100);

  font-size: clamp(
    calc(var(--min) * 1rem),
    calc(var(--intercept) * 1rem + var(--slope-per-cqi) * 1cqi),
    calc(var(--max) * 1rem)
  );
}
```

This is the formula made executable. The slope and intercept derive themselves from the four inputs at the top, so to retune a component you change one or two numbers and let CSS recompute everything. If your team adopts a convention like this, every fluid-typography rule in the codebase becomes a four-line config block that anyone can read and change with confidence.

Once you've internalized the math, you don't have to do it by hand for entire type scales. [Utopia](https://utopia.fyi) is the de facto tool in this space: you give it your min and max viewport widths, your min and max base font sizes, and a type scale ratio, and it generates fluid `clamp()` expressions for every step in your scale — body, headings, the lot.

## What I wish I'd known at the start

- `clamp(MIN, preferred, MAX)` is `y = mx + b` with bounds. Nothing more.
- CSS length units with coefficients (like `2cqi`) are `m × x` in one token.
- You don't tune `m` and `b` directly. You tune the container widths and let the math derive them.
- Overshoot diagnoses should start with layout, not math: check for stray margins, missing explicit `inline-size`, and padding eating text space before questioning your clamp values. Only once layout is clean does "does the text fit at MIN? at MAX?" become the right next question.
- Container queries + fluid type + fluid padding compose beautifully once you stop treating them as independent systems.

## And one more thing: the container is the _content box_

There's a subtlety I only spotted late in testing, and it's worth knowing because it can quietly throw off the bound-hitting math even when everything else is right.

The [CSS Containment spec](https://www.w3.org/TR/css-contain-3/#inline-size) is precise about which box `cqi` resolves against: "The inline-size container feature queries the size of the query container's **content box** in the query container's **inline axis**." Container query length units inherit that definition, `cqi` is 1% of the container's **content box** inline size. This inline size excludes any padding or borders added to the container.

When you inspect the container in the developer tools, the inline size you will see is the total size which is a combination of the size of the content box, padding, and borders. If the container measures at 432px and you use that as W₂, you may find that you never quite reach the minimum or maximum defined in your `clamp` rule. The miss is due to this subtle difference in what the container query is measuring against, and the value you had intended.

The cleanest workaround is to keep the **query container itself** free of padding and borders and apply those to a child instead.

A second, related effect — not strictly about `cqi`, but it produces similar symptoms — is that **fluid padding on the overlay eats text space at the high end of the range**. Even if the font hits MAX exactly when intended, the available text width is `wrapper − 2 × overlay-padding`. If both grow, the text can still wrap or overshoot at the largest container, because the box it lives in has stayed proportionally squeezed. If this causes a problem, slow down the padding's clamp slope so it doesn't grow as aggressively, or accept earlier line wraps.

So when the math feels right but the numbers don't quite land, the first thing to check is which boxes you're measuring against. Spec-wise, the container is the content box; layout-wise, the text lives in whatever's left after the overlay's own padding takes its share. Both shape what "hitting the bounds cleanly" actually means in practice.

The whole journey took me from "paste a clamp and tweak numbers" to genuinely understanding what the browser was computing on my behalf. It turns out CSS didn't invent a new thing here — it wrapped a linear equation in a more convenient syntax. The more convenient syntax made the math feel alien; naming the math made the CSS feel ordinary.

I'd rather have ordinary CSS than alien CSS, every time. 👽

---

_There's a [companion tool, a fluid type playground](https://fluidtype.schalkneethling.com), that lets you plug in MIN, MAX, W₁, and W₂ and watch the line, the clamp output, and a live preview all respond together. Worth playing with if any of the above still feels abstract._
