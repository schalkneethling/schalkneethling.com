---
title: "Targeting SVG Images with CSS Attribute Selectors and filter: invert()"
pubDate: 2026-04-22
description: "When you cannot inline an SVG or use it as a mask-image, a combination of the ends-with attribute selector and filter: invert() offers a clean, CSS-only solution for adapting icon colours across themes."
author: "Schalk Neethling"
tags: ["css"]
---

How did we get here? Here is the scenario.

You have a component that renders some text alongside an icon. The icon is loaded via an `img` element, but it is not always an SVG, it could also be a raster format such as a PNG or WebP. The component also supports theming, with around seven different theme colours, some of which are dark.

The SVG icons are single-colour and render as dark by default. On a dark theme, they disappear. You need to invert the colour of the SVG, and _only_ the SVG, without affecting the raster images.

Normally you might rethink the implementation and inline the SVG. You could then rely on setting `currentColor` on the SVG and have it inherit its color. You can then also style it with `fill`, or you can use it as a `mask-image` on a pseudo-element and control the colour via `background-color`.

All of these are valid options, but sometimes, our options are limited.

In this case, the icon arrives as the `src` on an `img` element and the component renders multiple image formats through the same markup. Neither inlining nor `mask-image` is an option.

## The Solution

Combine the [ends-with attribute selector (`$=`)](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Attribute_selectors#attrvalue_4) with the [`filter: invert()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/filter-function/invert) function.

```css
.CarouselSliderSlide-media[src$=".svg"] {
  filter: invert(1);
}
```

The `$=` selector matches any element whose `src` attribute value _ends with_ the string `.svg`. Because PNGs end with `.png` and WebPs end with `.webp`, they are left untouched. The `invert(1)` filter then flips the colour samples of the matched image, turning a dark icon light (or vice versa).

That is it. Two lines of CSS. Magic.

## Handling Edge Cases

In the example above, I have control over the `src` values, so I know the path will always end cleanly with the file extension. If you are working with URLs that might include query parameters, fragment identifiers, or data URIs, you will want a more defensive selector:

```css
:is(
  img[src$=".svg" i],
  img[src*=".svg?" i],
  img[src*=".svg#" i],
  img[src^="data:image/svg" i]
) {
  filter: invert(1);
}
```

This uses [`:is()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:is) to group four selectors into one rule. The first matches clean paths ending in `.svg`. The second catches URLs with query strings (`icon.svg?v=2`). The third handles fragment identifiers (`icon.svg#logo`). The fourth covers inline data URIs. The `i` flag before each closing bracket makes the match case-insensitive, so `.SVG` and `.Svg` are also covered.

Why `:is()`? From the MDN documentation:

> The :is() CSS pseudo-class function takes a selector list as its argument, and selects any element that can be selected by one of the selectors in that list. This is useful for writing large selectors in a more compact form.

### The Three Substring Match Operators

If the combination of `$=`, `*=`, and `^=` in that snippet looks unfamiliar, here is a quick reference. All three are substring-matching attribute selectors, but they match at different positions in the attribute value.

`[attr$="value"]` — **ends with**. Matches when the attribute value ends with the given string. This is what the simple version of the selector uses: `[src$=".svg"]` matches `icons/arrow.svg` but not `icons/arrow.svg?v=2`.

`[attr*="value"]` — **contains**. Matches when the given string appears _anywhere_ in the attribute value. `[src*=".svg?"]` matches `icons/arrow.svg?v=2` but also, inadvertently, something like `assets/mysvg?cache=1` — so be precise with what you pass as the value.

`[attr^="value"]` — **starts with**. Matches when the attribute value begins with the given string. `[src^="data:image/svg"]` matches only data URIs whose MIME type is `image/svg`, which is exactly what you want when excluding raster data URIs from the rule.

Together, they cover the full surface of a `src` attribute that could reference an SVG in the wild.

### The Case Sensitivity Modifiers

You may also have noticed the `i` flag tucked inside each selector, just before the closing bracket. That is the case-insensitive modifier, and it is worth understanding what it, and irs counterpart, does.

> A little secret: I had no idea you could do this 🙈

`[attr$=".svg" i]` — the `i` modifier tells the browser to match the value regardless of letter case. Without it, `[src$=".svg"]` would not match a `src` ending in `.SVG` or `.Svg`. Adding `i` makes the match case-insensitive within the ASCII range. Browser support for `i` is excellent across all modern browsers, so it is safe to use without hesitation.

`[attr$=".svg" s]` — the `s` modifier does the opposite: it forces a case-sensitive match. This is useful in specific edge cases, such as matching against `data-*` attributes or custom attributes where case carries meaning. However, as of April 2026, `s` is only supported in Firefox, so it is not yet a practical option for production use across the board.

## Worth Noting

According to MDN, `invert()` "inverts the color samples in the input image." In practice, each colour channel is replaced by its complement; black becomes white, white becomes black. For single-colour icons this is exactly what you want. If your SVGs use multiple colours, it is worth testing the result before shipping, as every colour in the image will be inverted.

There is also a subtler consequence to be aware of: applying a `filter` value other than `none` to an element [creates a new stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context), in the same way that `opacity` with a value less that `1` does. This means any `z-index` values on descendants of the filtered element are scoped to that context rather than the document root. If you notice elements mysteriously disappearing behind other content after adding the filter, this is the likely cause. MDN's page on the [`filter` property](https://developer.mozilla.org/en-US/docs/Web/CSS/filter) also demonstrates that the filter is applied to the element as a whole, borders and other box decorations included.

## Further Reading

- [Attribute selectors on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/Attribute_selectors)
- [`filter` property on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/filter)
- [`invert()` filter function on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/filter-function/invert)
- [`:is()` pseudo-class on MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/:is)
- [Selectors Level 4 specification](https://drafts.csswg.org/selectors-4/#attribute-selectors)
