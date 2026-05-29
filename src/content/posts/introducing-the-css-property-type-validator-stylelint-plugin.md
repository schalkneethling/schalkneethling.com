---
title: "Introducing the CSS Property Type Validator Stylelint Plugin"
pubDate: 2026-05-29
description: "The first beta of the Stylelint plugin for CSS Property Type Validator brings typed custom property validation directly into your existing CSS linting workflow."
author: "Schalk Neethling"
tags: ["css", "frontend-engineering-explained"]
---

Today I am publishing the first beta of the Stylelint plugin for CSS Property Type Validator:

```bash
npm install -D @schalkneethling/stylelint-plugin-css-property-type-validator@beta
```

This brings typed custom property validation directly into one of the most common CSS linting workflows.

CSS Property Type Validator already powers validation in the CLI and editor tooling. The Stylelint plugin adds another entry point using the same underlying validation engine, so teams can catch type mismatches as part of the lint checks they already run.

Consider a custom property registered as a colour:

```css
@property --brand-color {
  syntax: "<color>";
  inherits: false;
  initial-value: rebeccapurple;
}
```

If that property is then used where an image or color gradient is expected, Stylelint can now report it:

```css
.card {
  background-image: var(--brand-color);
}
```

The goal is straightforward: Find problems in your workflow, not in production.

## Why Stylelint?

[Stylelint](https://stylelint.io/) is already where many projects enforce CSS correctness, consistency, and project-level rules. Adding this plugin means typed custom property validation happens alongside the checks developers already run in CI, editors, and pre-commit workflows. There is no need to introduce a separate tool or an additional step in the pipeline.

This first beta intentionally stays focused. It exposes a single rule:

```js
"css-property-type-validator/valid-property-types"
```

A basic configuration looks like this:

```js
export default {
  plugins: ["@schalkneethling/stylelint-plugin-css-property-type-validator"],
  rules: {
    "css-property-type-validator/valid-property-types": [true, {
      registryFiles: ["src/tokens/**/*.css"],
      checkUnknownCustomProperties: false,
      tokenFiles: []
    }]
  }
};
```

The `registryFiles` option provides contextual `@property` definitions for the files being linted. They are not lint targets themselves; Stylelint still controls which source files are linted.

Unknown custom property checks are off by default, matching the behaviour of the CLI and editor tooling. If you want to enable them, provide `tokenFiles` so the plugin understands project-wide custom properties:

```js
{
  checkUnknownCustomProperties: true,
  tokenFiles: ["src/tokens/**/*.css"]
}
```

## What Is Included in the Beta

This beta supports:

- Validating `@property` registrations
- Checking custom property assignments against registered syntax
- Checking `var()` usage compatibility
- Loading contextual registry files
- Optional unknown custom property checks
- Token files for known custom properties
- Local CSS import resolution when Stylelint provides a real file path
- Clear warnings when configuration or path-less input would otherwise be confusing

There is no autofix behaviour yet, no custom severity mapping, no fail-fast mode, and no Stylelint-specific registry-only workflow. Those are tracked as post-beta follow-up issues so they can be evaluated against real user needs.

## Install

```bash
npm install -D stylelint @schalkneethling/stylelint-plugin-css-property-type-validator@beta
```

Or with pnpm:

```bash
pnpm add -D stylelint @schalkneethling/stylelint-plugin-css-property-type-validator@beta
```

Then add the plugin to your Stylelint configuration:

```js
export default {
  plugins: ["@schalkneethling/stylelint-plugin-css-property-type-validator"],
  rules: {
    "css-property-type-validator/valid-property-types": true
  }
};
```

## Try It

If your project already uses [`@property`](https://developer.mozilla.org/en-US/docs/Web/CSS/@property), this should be a small addition to your existing Stylelint setup. If your design tokens live in separate CSS files, configure `registryFiles` so the plugin can validate source files in the context of those registrations.

This is still a beta, so feedback is especially useful around:

- How registry files are discovered
- How the rule fits into existing Stylelint configurations
- Whether unknown custom property checks feel helpful or noisy
- Import resolution edge cases
- CSS syntax beyond plain `.css` files

Issues and feedback are welcome on [GitHub](https://github.com/schalkneethling/css-property-type-validator).

## Further Reading

- [MDN: @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property)
- [MDN: Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [CSS Properties and Values API specification](https://drafts.css-houdini.org/css-properties-values-api/)
- [Stylelint: Getting started](https://stylelint.io/user-guide/get-started)
- [CSS Property Type Validator on GitHub](https://github.com/schalkneethling/css-property-type-validator)
