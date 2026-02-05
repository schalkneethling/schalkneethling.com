---
title: "Using TypeScript Triple-Slash Directives with JSDoc"
pubDate: 2026-02-05
description: "How to use TypeScript’s triple-slash reference directives to load type definitions when type-checking JavaScript with JSDoc."
author: "Schalk Neethling"
tags: ["javascript", "jsdoc", "typescript"]
---

If you have been using JSDoc with `// @ts-check` to add type checking to your JavaScript files, you may have come across a comment like this near the top of a file:

```js
/// <reference types="node" />
```

It looks like an ordinary comment because syntactically it is one. But it carries a specific meaning for the TypeScript compiler and, by extension, for the type checking that powers your editor. This is a [triple-slash reference directive](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html), and once you understand what it does, it becomes a genuinely useful tool in a JSDoc workflow.

## What is a triple-slash directive?

A triple-slash directive is a single-line comment containing an XML-like tag. The type checker recognises these tags and uses them to adjust how types are resolved for that file. They have no effect at runtime whatsoever, they are purely a tooling concern.

Let me be clear, despite often appearing in JSDoc workflows, this is not a JSDoc feature. It is a TypeScript compiler directive that happens to work in `.js` files when type checking is enabled (through the `// @ts-check` directive).

There is one important rule: triple-slash directives must appear at the very top of the file. They can be preceded by other comments (including other directives), but the moment a statement or declaration appears before them, they lose their special meaning and become ordinary comments.

In fact, as of TypeScript 5.5, the compiler no longer generates reference directives, nor does it emit hand written directives to output. If you wish to retain these in output, must set `preserve=true` as part of your directive:

```js
/// <reference types="node" preserve="true" />
```

## The `types` directive

The variant of these directives you will reach for in a JSDoc workflow is `/// <reference types="..." />`. This directive declares a dependency on a package. These are resolved the same way as module names in an `import` statement.

Here is the scenario. You are working on a Node.js script in plain JavaScript, and you want accurate type information without setting up a `tsconfig.json` or `jsconfig.json`. You install the type definitions:

```sh
npm install --save-dev @types/node
```

Then you add the directive at the top of your file:

```js
// @ts-check
/// <reference types="node" />

import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    name: {
      type: "string",
      default: "all",
    },
  },
});
```

The type checker will now resolve `parseArgs` and the rest of the Node.js API against the declarations shipped with `@types/node`. Your editor will offer accurate autocompletion and surface type errors, all on a per-file basis, with no project-wide configuration required.

## When a config file is the better choice

If you are already using a `jsconfig.json` or `tsconfig.json`, you can declare type dependencies there using the `types` compiler option, and the type checker will apply them project-wide. There is no need to add triple-slash directives to every file in that case.

The directives shine in two situations: standalone scripts where a config file would be overkill, and published libraries where you want type information to travel with individual files — useful when consumers deep-import specific modules without your project configuration alongside them.

## What about `path`?

You might encounter this in older codebases.

```js
/// <reference path="./types/global.d.ts" />
```

This manually includes another file’s declarations. It predates modern module systems and is mostly unnecessary today. In modern projects, prefer including files via `tsconfig`/`jsconfig` or importing types explicitly:

```js
/** @typedef {import('./types').User} User */
```

If you feel the need for `path`, it usually means your project configuration needs adjustment. Consider it legacy.

### Rule of thumb

Use this decision guide:

- Whole project needs types → config file
- Single file needs types → `/// <reference types="..." />`
- Considering `path` → rethink your setup

### Further Reading

- [Triple-Slash Directives — TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html)
- [JSDoc Reference — TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [Type Checking JavaScript Files — TypeScript Docs](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)
