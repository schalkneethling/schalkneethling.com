---
title: "You Might Not Need chalk Anymore"
pubDate: 2026-07-02
description: "Node.js now ships with util.styleText(), a built-in alternative to chalk for terminal text styling. Here is what it can do, when it is enough, and when you might still reach for a dependency."
author: "Schalk Neethling"
tags: ["nodejs", "frontend-engineering-explained"]
---

If you have been writing CLI tools or Node.js scripts of any kind, there is a good chance you have `chalk` in your `package.json`. For years it has been the go-to way to add colour and emphasis to terminal output. But Node.js itself has been quietly closing that gap, and for many projects the built-in `util.styleText()` is now all you need.

## What is `util.styleText()`?

Introduced in Node.js 21.7.0 and available from v20.12.0, [`styleText`](https://nodejs.org/api/util.html#utilstyletextformat-text-options) is a function on the `node:util` module that wraps a string in ANSI escape codes. It became stable in Node.js v22.13.0.

```js
import { styleText } from "node:util";

console.log(styleText("green", "All tests passed."));
console.error(styleText("red", "Something went wrong."));
```

That is the entire API for basic use. No install step, no dependency, no bundling cost.

## Combining styles

From v20.13.0 onwards, `styleText` accepts an array as its first argument, letting you combine multiple formats in a single call:

```js
console.log(styleText(["bold", "underline"], "Important notice"));
console.error(styleText(["red", "bold"], "Critical error"));
console.warn(styleText(["black", "bgYellow"], "Warning: check your config"));
```

One thing to be aware of: formats in the array are applied from left to right, which means a value on the right will overwrite a conflicting value on the left. Combining `bold` with `red` works as expected because they target different aspects of the output. But `styleText(["red", "green"], "text")` results in green text — the second foreground colour wins.

The full set of available modifiers mirrors what you will find on `util.inspect.colors`: the standard 16 foreground and background colours, plus modifiers like `bold`, `italic`, `underline`, `strikethrough`, `dim`, and `inverse`.

## Hex colour support

As of Node.js v26.1.0, `styleText` also supports hex colours in `#RGB` and `#RRGGBB` form:

```js
console.log(styleText("#ff5733", "Orange text"));
console.log(styleText("#f00", "Red shorthand"));
```

This closes one of the bigger gaps that previously sent people straight to chalk.

## Two modifiers worth knowing

Among the available modifiers, `inverse` and `blink` stand out for very different reasons.

### `inverse` (aliases: `swapcolors`, `swapColors`)

The `inverse` modifier applies [SGR 7 (reverse video — recommended quick read)](https://en.wikipedia.org/wiki/Reverse_video), which swaps the terminal's foreground and background colours. Used on its own, this is a handy way to create visually distinct, high-contrast text that adapts to the user's terminal theme without you needing to know whether they are running a dark or light colour scheme:

```js
console.log(styleText("inverse", "ALERT: check your configuration"));
```

On a dark terminal (light text on a dark background), this produces dark text on a light background. On a light terminal, the opposite. The contrast is always there because you are working with the user's own colour choices rather than fighting against them.

One caveat: if you combine `inverse` with a specific colour — `styleText(["green", "inverse"], "text")` — then green becomes the background and the terminal's default background colour becomes the foreground text. Whether that remains readable depends on the theme, so you lose some of that automatic adaptability. For the safest cross-theme results, use `inverse` on its own.

### `blink`

If you have been around the web long enough, you will remember the `<blink>` element. Born from [a late-night bar conversation](https://en.wikipedia.org/wiki/Blink_element) involving Netscape engineer Lou Montulli, it was never standardised and was eventually removed from Firefox — the last browser to support it — in version 23 back in 2013. The [WCAG guidelines](https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html) rightly flagged it as problematic for users with cognitive disabilities and photosensitive epilepsy.

The ANSI `blink` modifier (SGR 5) actually predates the HTML tag and lives on in the terminal world. With `styleText`, you can bring it back:

```js
console.log(styleText("blink", "Node.js brought the blink tag back"));
```

That said, many modern terminal emulators disable or ignore blink entirely, and for good reason. This is more of a fun piece of terminal history than something you would want to ship in a production CLI tool.

## Environment-aware by default

In Node.js v20.18.0+ and v22.8.0+, `styleText` respects the `NO_COLOR`, `NODE_DISABLE_COLORS`, and `FORCE_COLOR` environment variables. If a user or CI environment opts out of colour, your output gracefully falls back to plain text without any conditional logic on your part. You can also pass a `stream` option to validate against a specific output stream such as `process.stderr`.
## The official codemod

The Node.js project has published an [official codemod to help with migration](https://nodejs.org/en/blog/migrations/chalk-to-styletext): `@nodejs/chalk-to-util-styletext`. It handles basic colours, bright colours, background colours, text modifiers, and style chaining via the array syntax. It will also remove `chalk` from your `package.json` for you.

```bash
npx codemod @nodejs/chalk-to-util-styletext
```

## When you might still need a dependency

For a straightforward CLI tool that uses named colours and a handful of modifiers, `styleText` has you covered. That said, there are a few scenarios where a library like chalk or the lighter [ansis](https://github.com/webdiscus/ansis) still earns its place:

The first is **RGB and 256-colour palette support**. While hex colours landed in v26.1.0, `styleText` does not yet support `rgb()` values or the ANSI 256-colour palette. If your tool needs precise colour control beyond hex, you will need a library.

The second is **ergonomics for complex nesting**. Chalk's chainable, composable API — `chalk.red.bold("text")` — and its support for nested template literals make heavily styled output more readable than deeply nested `styleText` calls. When you are building something like a rich log formatter with multiple inline style changes per line, the ergonomic difference is real.

The third is **performance in hot paths**. [Benchmarks from the ansis project](https://github.com/webdiscus/ansis/blob/master/docs/benchmarks.md) consistently show `styleText` at roughly 0.5 million operations per second, compared to around 47–60 million for chalk and ansis. For the vast majority of CLI output this is entirely irrelevant — you are not styling millions of strings per second. But if you are doing something unusual like styling inside a tight loop that processes high-volume log streams, it is worth knowing.

## Wrapping up

Like the web platform, the Node.js platform keeps absorbing functionality that used to require third-party packages. `util.styleText()` will not cover every edge case, but for the common pattern of "highlight a few log messages in colour," it does the job with zero dependencies. The next time you reach for `chalk` in a new project, it is worth asking whether `styleText` is enough. Chances are, it is.

### Further reading

- [Node.js `util.styleText` documentation](https://nodejs.org/api/util.html#utilstyletextformat-text-options)
- [Chalk to Node.js `util.styleText` — official migration guide](https://nodejs.org/en/blog/migrations/chalk-to-styletext)
- [e18e — Replacements for chalk](https://e18e.dev/docs/replacements/chalk)
