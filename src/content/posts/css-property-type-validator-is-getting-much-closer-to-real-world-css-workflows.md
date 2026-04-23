---
title: "CSS Property Type Validator Is Getting Much Closer to Real-World CSS Workflows"
pubDate: 2026-04-22
description: "An update on the CSS Property Type Validator, focusing on recent improvements that make it better suited to practical, real-world CSS development workflows."
author: "Schalk Neethling"
tags: ["css", "tooling"]
---

In my last update, I wrote about assignment-site validation for registered custom properties in the [CSS custom proerty validator](https://github.com/schalkneethling/css-property-type-validator). That was an important step, because it meant the validator could start checking whether authored values like `--brand-color: 10px` were compatible with the `@property` registration that defined them.

Since then, the project has grown in a few directions that make it feel much more like a real tool you can point at a CSS codebase, not just a proof of concept.

The biggest changes are:

- stricter, more spec-aligned `@property` validation
- local `@import` traversal for registry assembly
- an explicit registration-only CLI mode

Together, these changes make the validator more trustworthy and much easier to use in real projects.

## Stricter `@property` validation

The first big improvement was tightening how the validator handles `@property` rules themselves.

That matters because the registry is the foundation for everything else. If the tool accepts registrations that the spec would reject, then every downstream compatibility check becomes less reliable.

The validator now does a better job of enforcing the CSS Properties and Values API rules around:

- required descriptors
- valid `syntax` values
- `initial-value` compatibility
- computational independence

In practice, that means invalid registrations are excluded from the registry instead of being treated as valid typed custom properties.

That may sound like a small detail, but it makes a huge difference in confidence. A validator should be strict where correctness matters, and the registry is definitely one of those places.

## Following local `@import` rules

The next improvement was enabling the validator to follow local unconditioned `@import` rules while assembling the registry.

This is a much more natural fit for how many CSS codebases are structured. Shared tokens and registrations often live in separate files, and those files are commonly imported rather than passed around manually.

So instead of requiring every registration file to be listed explicitly, the validator can now discover shared `@property` rules through local import graphs.

That makes this kind of setup much easier to work with:

```css
@import "./tokens.css";

.card {
  color: var(--brand-color);
}
```

This is especially helpful in token-driven projects where registrations live alongside design tokens, rather than inside the same stylesheet that consumes them.

There are still intentional limits here. The validator currently focuses on local, unconditioned imports for registry assembly. Conditioned imports and remote imports remain out of scope for now. That keeps the behavior predictable and avoids pretending to model browser loading rules more fully than it really does.

## Registration-only validation is now explicit

One of the nicest ergonomics improvements in this round was adding an explicit registration-only CLI mode.

Before this, the CLI could already surface registration diagnostics from registry-only sources, but the workflow still felt indirect. You had to treat a registration file like a normal validation input, even when what you really wanted was simply, “check these `@property` rules.”

Now that mode is explicit:

```bash
css-property-type-validator "src/tokens/**/*.css" --registry-only
```

That makes the validator easier to use in a few situations:

- validating design-token packages on their own
- checking registration files in CI
- separating registration validation from normal declaration validation

Validating `@property` rules is part of the validator’s job, so it should be a first-class workflow rather than a side effect.

## What the tool can do now

At this point, the validator can:

- parse CSS with `css-tree`
- build a registry from `@property` rules across multiple files
- validate `syntax` descriptors in those registrations
- check `var()` declaration values against the consuming CSS property
- validate simple fallback branches in `var(--token, fallback)` against the consuming property
- validate authored values assigned directly to registered custom properties
- follow local imports while assembling the registry
- validate registrations on their own with `--registry-only`

That is a lot closer to the shape of a practical CSS validation tool than where this project started.

## What’s next

There is still more work to do.

One of the next core improvements I want to tackle is broader fallback handling in `var()` functions, especially when fallback branches become nested or more complex. That’s important because fallbacks are not just a convenience feature. They are part of how authors express resilient CSS.

Beyond that, there is still deeper spec work to do around computed-value-time behavior and broader import policies.

So the project is in a good place, but it is still moving forward intentionally. The goal has never been to guess at CSS behavior. The goal is to validate it carefully, conservatively, and in a way that developers can trust.
