---
title: "CSS Property Type Validator: Assignment-Site Validation"
pubDate: 2026-04-13
description: "The CSS property type validator now catches type mismatches at the point of assignment, not just at var() usage."
author: "Schalk Neethling"
tags: ["css", "devtools"]
---

The validator already catches type mismatches where a registered custom property is consumed via `var()`. Now it catches the other half: the assignment itself. If `--brand-spacing` is registered as `<length>` and you write `--brand-spacing: red`, that is flagged.

```css
@property --brand-spacing {
  syntax: "<length>";
  inherits: false;
  initial-value: 1rem;
}

/* ✗ flagged: "red" is not a <length> */
:root {
  --brand-spacing: red;
}

/* ✓ valid */
:root {
  --brand-spacing: 1.5rem;
}
```

This matters because [`@property`](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) gives custom properties a type contract, and the browser enforces it silently. When an assigned value violates the registered syntax, [the property becomes invalid at computed-value time](https://www.w3.org/TR/css-properties-values-api-1/#determining-registration). The CSS Cascading and Inheritance spec then resolves the missing value through defaulting — meaning the [inherited value](https://www.w3.org/TR/css-cascade-5/#inherited) kicks in for inherited properties, and the [initial value](https://www.w3.org/TR/css-cascade-5/#initial-values) is used for non-inherited ones. No error, no warning, just a silent change in rendered output. That makes type errors at assignment sites surprisingly easy to miss, especially when refactoring token names across multiple files.

## Conservative by design

The validator skips assignments it cannot resolve confidently: whitespace-only values (a technique used intentionally for the [space toggle hack](https://lea.verou.me/blog/2020/10/the-var-space-hack-to-toggle-multiple-values-with-one-custom-property/)) and anything containing an unresolved `var()` reference are left alone rather than flagged. The JSON output includes a `skippedDeclarations` count alongside `validatedDeclarations` so you always know what was and was not checked.

Fallback value validation inside `var()` is tracked separately and will follow in a future release.

## Try it

```bash
node packages/cli/dist/cli.js "your/styles/**/*.css"
node packages/cli/dist/cli.js "your/styles/**/*.css" --format json
```

The full source is at [schalkneethling/css-property-type-validator](https://github.com/schalkneethling/css-property-type-validator).

## Further reading

- [`@property` — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/@property)
- [CSS Properties and Values API — W3C specification](https://www.w3.org/TR/css-properties-values-api-1/)
- [Using CSS custom properties — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
