---
title: "Simplify Command-Line Argument Parsing with Node.js util.parseArgs()"
pubDate: 2026-02-04
description: "Learn how to use Node.js util.parseArgs() to simplify command-line argument parsing in your Node.js CLI utilities."
author: "Schalk Neethling"
tags: ["nodejs"]
---

If you've built command-line utilities with Node.js, you've likely written code that manually slices and loops through `process.argv` to extract flags and options. It works, but it's tedious and error-prone. There's a better way.

Introduced in [Node.js v18.3.0 (released June 2022)](https://nodejs.org/en/blog/release/v18.3.0) and stable since the [release of Node.js v20.0.0](https://nodejs.org/en/blog/release/v20.0.0/), `util.parseArgs()` brings declarative argument parsing directly into the runtime. No dependencies, no manual string manipulation, just clean configuration and structured output.

## The Manual Approach

Here's what parsing arguments traditionally looked like:

```javascript
const args = process.argv.slice(2);
let fixtureType = "all";

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--type" && i + 1 < args.length) {
    fixtureType = args[++i];
  }
}
```

This works, but it is not very declarative. If you need to add another flag or handle short options like `-t`, the complexity grows quickly. Error handling? You're writing that yourself too.

## With util.parseArgs()

With `util.parseArgs()`, the same functionality becomes declarative and easier to understand:

```javascript
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    name: {
      short: "n",
      type: "string",
      default: "all",
    },
  },
});
const fixtureName = values.name;
```

> **Note** We are not passing the `args` argument to the `parseArgs()` function. This is because we want the default of `process.argv` (with `execPath` and `filename` removed).

The difference is striking. Instead of imperatively describing how to parse arguments, we declare what we expect. The configuration object defines our options, in this case a `name` option, with its type, and default value. Node.js handles the parsing logic.

## Practical Benefits

The immediate win is readability. Anyone looking at the configuration object understands the expected arguments at a glance. But there's more.

**Type safety comes built in.** String options stay strings, boolean flags stay booleans. No manual type coercion. Note: The `type` property can only be of type `string` or `boolean`.

**Short options are trivial.** Add `short: "n"` to your configuration and both `--name` and `-n` work automatically.

**Error handling is included.** Invalid arguments or incorrect types throw clear, actionable errors without custom validation code.

## When to Use It

`util.parseArgs()` is ideal for CLI tools where you control the argument structure. It's not a replacement for full-featured libraries like [Commander.js](https://github.com/tj/commander.js) or [yargs](https://github.com/yargs/yargs). These have additional features such as generating help text or handling complex command structures. But for straightforward scripts, build tools, or internal utilities, `util.parseArgs()` is clear and efficient.

## Get Started

Check the [official Node.js documentation](https://nodejs.org/docs/latest/api/util.html#utilparseargsconfig) for complete API details including support for multiple values, positionals, tokens for custom processing, strict mode configuration, and more.
