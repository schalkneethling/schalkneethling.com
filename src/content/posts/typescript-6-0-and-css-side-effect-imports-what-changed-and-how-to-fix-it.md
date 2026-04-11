---
title: "TypeScript 6.0 and CSS Side-Effect Imports: What Changed and How to Fix It"
pubDate: 2026-04-11
description: "TypeScript 6.0 enables noUncheckedSideEffectImports by default, which causes a TS2882 error for CSS side-effect imports like import './style.css'. Here is what changed, why, and how to fix it."
author: "Schalk Neethling"
tags: ["typescript"]
---

If you have recently upgraded to TypeScript 6.0 and your build suddenly started failing with an error like this:

```bash
error TS2882: Cannot find module or type declarations for side-effect import of './style.css'.
```

you are not alone. This is a deliberate breaking change introduced in TypeScript 6.0, and understanding why it happens makes the fix straightforward.

## What Changed in TypeScript 6.0

TypeScript 6.0 is a significant transition release — the last version of the compiler written in TypeScript itself before the team moves to a Go-based compiler in TypeScript 7.0. As part of that transition, the team took the opportunity to update a number of default compiler settings to reflect how the ecosystem has evolved.

One of those changed defaults is [`noUncheckedSideEffectImports`](https://www.typescriptlang.org/tsconfig/noUncheckedSideEffectImports.html), which is now `true` by default. You can find the full list of changed defaults in the [TypeScript 6.0 release notes under "Simple Default Changes"](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html#simple-default-changes).

## What is a Side-Effect Import?

A side-effect import is an import statement that does not pull in any named or default exports — it executes a module purely for its side effects. You have almost certainly written one if you have ever worked with a bundler like Vite:

```ts
import "./style.css";
```

This tells the bundler to include the CSS file, but TypeScript itself has no concept of what a `.css` file is. Prior to TypeScript 6.0, TypeScript would silently ignore these imports if it could not resolve them to a source file. That silent behaviour masked potential typos and missing files.

With `noUncheckedSideEffectImports` now enabled by default, TypeScript will error if it cannot find a source file for a side-effect import. This is a good thing for type safety, but it does require projects to be explicit about non-TypeScript asset imports.

## The Fix: Ambient Module Declaration

The solution recommended by the TypeScript documentation itself is to add an ambient module declaration with a wildcard specifier. This tells TypeScript that any import matching the pattern is intentional and valid.

Create a `.d.ts` file in your `src` directory — or add to an existing one — with the following:

```ts
// src/globals.d.ts
declare module "*.css" {}
```

If your project uses other asset types as side-effect imports, you can add declarations for those too:

```ts
declare module "*.css" {}
declare module "*.svg" {}
declare module "*.png" {}
```

## Vite Projects: Use `vite-env.d.ts`

If you are using Vite, there is a more complete fix available. Vite ships its own client types that include ambient module declarations for CSS and other asset types, as well as types for `import.meta.env`, `import.meta.hot`, and more. These are pulled in via a triple-slash directive:

```ts
/// <reference types="vite/client" />
```

The conventional home for this is `src/vite-env.d.ts`, which Vite creates automatically when scaffolding a new project. However, this file may be missing in your project — perhaps it was never generated, or was deleted at some point.

If it is missing, create it:

```ts
// src/vite-env.d.ts
/// <reference types="vite/client" />
```

As long as `src` is listed in the `include` array of your `tsconfig.json`, TypeScript will pick this file up automatically. No other `tsconfig.json` changes are needed. Notably, this works even if you have an explicit `"types": []` entry in your compiler options — triple-slash directives are honoured regardless of that restriction, which means the file alone is sufficient to resolve the error.

## Why Not Just Disable the Option?

You could set `noUncheckedSideEffectImports: false` in your `tsconfig.json` to restore the previous behaviour, but that would be moving backwards. The default change exists because silently ignoring unresolvable imports is genuinely surprising behaviour that can hide real mistakes — for example, a typo in a path that a bundler might not catch either.

The ambient module declaration approach is the right solution: it is explicit, it communicates intent, and it gives TypeScript the information it needs to do its job without disabling a useful safety net.

## Further Reading

- [TypeScript 6.0 Release Notes — Simple Default Changes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html#simple-default-changes)
- [TSConfig Reference: `noUncheckedSideEffectImports`](https://www.typescriptlang.org/tsconfig/noUncheckedSideEffectImports.html)
- [Announcing TypeScript 6.0 — TypeScript Blog](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)
