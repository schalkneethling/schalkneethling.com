---
title: "Announcing the CSS Property Type Validator Extension for VSCode"
pubDate: 2026-05-07
description: "A new editor extension that validates your CSS @property registrations and catches incompatible var() usage as you type."
author: "Schalk Neethling"
tags: ["css"]
---

The CSS [`@property`](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) at-rule is one of the most exciting additions to the platform in recent years. It lets you register custom properties with explicit types, inheritance behaviour, and initial values — giving the browser the information it needs to animate custom properties, catch type mismatches, and much more.

But there is a gap in tooling. Consider a design system with tokens like `--surface-primary` registered as `<color>` and `--spacing-primary` registered as `<length>`. A developer scanning a list of tokens grabs the wrong "primary" and writes `gap: var(--surface-primary)`. The CSS is syntactically valid, but semantically broken. The browser silently falls back to the initial value, and you are left debugging a layout issue that has nothing to do with your layout. Seems unlikely, but it happens...

This kind of mistake becomes even more likely as coding agents take on a larger share of the work. An agent working with your token system is pattern-matching on names, not intent. If the naming leaves any room for ambiguity, the agent will reach for the wrong token with complete confidence. What makes this solvable is the type information already sitting in your `@property` registrations; it just needs tooling that actually reads it and provides a tight feedback loop. That feedback loop is valuable for human developers, but it is especially valuable for agents, where these diagnostics can nudge the agent to resolve the error immediately rather than letting it propagate.

That is the essence of the problem the **CSS Property Type Validator** exists to solve, and today I am releasing its first extension for [Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=schalkneethling.css-property-type-validator) and [compatible editors via Open VSX](https://open-vsx.org/extension/schalkneethling/css-property-type-validator).

## What the Extension Does

The extension validates your CSS as you edit. It reports native editor diagnostics, the familiar squiggly underlines, and Problems panel entries, for issues including:

- Invalid `@property` registrations (malformed `syntax` descriptors, missing required descriptors)
- Incompatible `var()` usage where a registered custom property's type does not match the consuming CSS property
- Incompatible direct assignments to registered custom properties
- Unresolved imports referenced in your CSS
- CSS parse failures

In the very next release of the core library, and as a result, the next version of the CLI and extension, it will also flag undefined custom properties that have no fallback value, catching the case where an agent or developer references a token that does not actually exist in the system.

For example, if `--font-weight-bold` is registered with a syntax of `<number>` and you write `font-size: var(--font-weight-bold)`, the extension will flag this — both tokens live in the "font" namespace and autocomplete will happily suggest it, but a `<number>` is not a valid `font-size` value. Similarly, if `--line-height-tight` is registered as `<number>` and you write `gap: var(--line-height-tight)` because "tight" feels like it means small spacing, the diagnostic will catch it immediately.

Unregistered custom properties are left alone. The validator only speaks up when it has type information to work with.

## Shared Registry Files

Most real-world projects define their design tokens in dedicated files that are imported across the codebase. The extension supports this through a workspace setting:

```json
{
  "cssPropertyTypeValidator.registryFiles": [
    "src/tokens/**/*.css",
    "src/theme/**/*.css"
  ]
}
```

Any `@property` registrations found in these files are added to the shared registry and used when validating every open CSS document. This means you define your tokens once and the validator knows about them everywhere. Registry files contribute their `@property` registrations and any registration-level diagnostics, but ordinary declarations in those files are not validated unless the file is also open as a CSS document.

If you add or change token files, the **CSS Property Type Validator: Refresh** command reloads the registry and revalidates all open documents.

## Getting Started

Install from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=schalkneethling.css-property-type-validator) or [Open VSX](https://open-vsx.org/extension/schalkneethling/css-property-type-validator), open a CSS file that contains `@property` registrations, and the diagnostics will appear automatically.

For projects with shared token files, add the `registryFiles` setting to your workspace or folder `.vscode/settings.json`, and you are up and running.

## Known Limits

This is a v1 release, and the scope is intentionally conservative to keep false positives low while the validator matures:

- Only plain CSS files are validated. Embedded `<style>` blocks, SCSS, Less, PostCSS, and framework-specific files (Vue, Svelte, JSX, TSX) are out of scope for this version.
- Only desktop VSCode-compatible editors are supported. Web-based hosts such as vscode.dev and GitHub.dev are not yet supported.
- The extension does not provide autofixes — it reports the problem and leaves the decision to you.
- Declarations with a single `var()` usage are validated, along with simple fallback branches and multiple registered `var()` usages in one value. More complex patterns, such as the space toggle trick, are on the roadmap.

## The Bigger Picture

The extension is a thin integration layer on top of a standalone core package and CLI. The [core validation engine](https://github.com/schalkneethling/css-property-type-validator/tree/main/packages/core) is designed to be consumed in multiple contexts, and the VSCode extension is just the first.

A [Zed](https://zed.dev/) extension is next in line, followed by a [Stylelint](https://stylelint.io/) adapter that will bring the same validation to existing lint pipelines. Beyond that, I plan to propose the validator for inclusion in [Biome](https://biomejs.dev/). Its unified, performance-focused approach to linting and formatting makes it a natural home for this kind of type-aware CSS analysis. More broadly, the goal is to bring this validation to any tool or environment where it would be meaningful to the people, or coding agents, writing CSS. If your editor, linter, or build tool could benefit from type-aware custom property checks, I would love to hear about it.

The roadmap also includes improved remediation guidance in diagnostics, config-file-based registry discovery for the CLI, and — looking further ahead — exploring how [CSS mixins](https://github.com/w3c/csswg-drafts/issues/9350) could strengthen the project's value if they land with typed parameters built on `@property`.

## Your Feedback Matters

This release is as much about getting the tool into your hands as it is about hearing from you. If you encounter a false positive, a missed diagnostic, or have ideas for what the validator should catch next, please [open an issue on GitHub](https://github.com/schalkneethling/css-property-type-validator/issues). Your real-world feedback on real projects is exactly what will shape the next iteration.

## Further Reading

- [MDN: `@property`](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) — The at-rule for registering custom properties with type information
- [MDN: `var()`](https://developer.mozilla.org/en-US/docs/Web/CSS/var) — Using custom properties in CSS values
- [MDN: CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) — A broader guide to custom properties
- [CSS Properties and Values API specification](https://www.w3.org/TR/css-properties-values-api-1/) — The underlying specification
- [CSS Property Type Validator on GitHub](https://github.com/schalkneethling/css-property-type-validator) — Source code, roadmap, and issue tracker