---
title: "Type Safety and Runtime Validation in JavaScript with Zod and JSDoc"
pubDate: 2026-01-26
description: "Combining Zod's runtime validation with JSDoc's type annotations to achieve type safety in JavaScript without TypeScript."
author: "Schalk Neethling"
tags: ["javascript", "typescript", "zod"]
---

If you're using [Zod](https://zod.dev) for runtime validation in JavaScript, you might think you need to maintain your [JSDoc](https://jsdoc.app) type definitions separately from your Zod schemas. After all, Zod schemas validate at runtime, while JSDoc provides editor hints. Two different systems serving different purposes.

But here's what you might not know: `z.infer` and `z.input` work with JSDoc exactly the same way they work in TypeScript. You can define your Zod schema once and infer the JSDoc type directly from it.

## The Traditional Approach

Typically, you'd write your JSDoc types manually, then separately define your Zod schemas for runtime validation:

```js
// JSDoc type definition
/**
 * @typedef Location
 * @property {number} lat
 * @property {number} lng
 */

// Zod schema for validation
const LocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});
```

This works, but you're maintaining the same type information in two places. When your data structure changes, you need to update both definitions.

## Using Zod as Your Single Source of Truth

Instead, you can define your Zod schema once and infer the JSDoc type from it:

```js
// Define your Zod schema
const LocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

/**
 * @typedef {z.infer<typeof LocationSchema>} Location
 */
```

That's it. The `z.infer<typeof LocationSchema>` syntax extracts the type from your Zod schema and makes it available to JSDoc. Now you have a single source of truth that provides both runtime validation and editor type hints.

## What You Get

Add `// @ts-check` at the top of your file and you unlock three layers of safety:

1. **Editor hints** - VS Code shows you the shape of your data as you code
2. **Compile-time checking** - Red squiggles appear when types don't match
3. **Runtime validation** - Zod validates your data when the code runs

All of this in plain JavaScript files, no build step required. The code you write runs directly in the browser or Node.js.

## A Practical Example

Here's how it looks in practice:

```js
// @ts-check
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(["admin", "user"]),
});

/** @typedef {z.infer<typeof UserSchema>} User */

/** @type {User} */
const user = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "user@example.com",
  role: "admin",
};

// Runtime validation
const result = UserSchema.safeParse(user);
if (result.success) {
  console.log("Valid user:", result.data);
}
```

Your editor knows about the `User` type throughout your codebase. You can import it across files just like any JSDoc type. And when data comes in from an API or user input, Zod validates it at runtime.

## Importing Types Across Files

Once you've defined your Zod schemas and inferred types, you can import them across your project using JSDoc's import syntax:

```js
// search-handler.js
export const SearchResultSuccessSchema = z.object({
  locations: z.array(LocationSchema),
  total: z.number(),
});

/** @typedef {z.infer<typeof SearchResultSuccessSchema>} SearchResultSuccess */
```

Then in another file:

```js
// results-display.js
/**
 * @property {import('./search-handler.js').SearchResultSuccess} result - Search results
 */
```

This works for both `z.infer` and `z.input` types (what ou are importing is the `@typedef`), allowing you to share your Zod-derived types throughout your codebase without duplication.

## When to Use `z.input` Instead of `z.infer`

There's an important distinction between `z.infer` and `z.input` that matters when your schemas include defaults or transformations.

- `z.infer<Schema>` gives you the **output type** (after defaults and transformations are applied)
- `z.input<Schema>` gives you the **input type** (before defaults and transformations are applied)

This matters most for function parameter types. Consider a schema with a default value:

```js
const DistanceMatrixOptionsSchema = z.object({
  mode: z.enum(["drive", "walk", "bike"]).default("drive"),
  units: z.enum(["metric", "imperial"]),
});

/** @typedef {z.input<typeof DistanceMatrixOptionsSchema>} DistanceMatrixOptions */

/**
 * @param {DistanceMatrixOptions} options
 */
function calculateDistance(options) {
  const validated = DistanceMatrixOptionsSchema.parse(options);
  // validated.mode is guaranteed to exist (from default)
}

// This works because mode is optional in the input type
calculateDistance({ units: "metric" });
```

If you used `z.infer` instead of `z.input` for the function parameter, TypeScript would complain that `mode` is required, even though Zod will provide the default value at runtime.

Use `z.input` for function parameters and API inputs where callers can omit fields with defaults. Use `z.infer` for variables holding already-validated data where all defaults have been applied.

## Bonus: TypeScript Utility Types Work Too

JSDoc supports TypeScript's utility types, which means you can combine them with your imported Zod-inferred types:

```js
/**
 * @param {Partial<import('./search-handler.js').StoreLocation>} overrides
 */
function updateLocation(overrides) {
  // overrides can contain any subset of StoreLocation properties
}
```

This is particularly useful for update functions where callers only need to provide the fields they want to change. Other utility types like `Pick`, `Omit`, and `Required` work the same way, giving you a lot of flexibility without leaving JavaScript.

## Credit Where Due

I discovered this technique in an unexpected way. Claude Haiku 4.5 wrote some code using `z.infer<typeof Schema>` in a JSDoc typedef, and I wasn't sure if what I was seeing could actually work. ESLint wasn't complaining, but it seemed too good to be true. A quick search led me to [Jim Nielsen's excellent post on the topic](https://blog.jim-nielsen.com/2023/types-in-jsdoc-with-zod/), which confirmed this approach is not only valid but quite powerful. Jim covers additional use cases and explains how this works particularly well for static site generators where you want both build-time type checking and nice editor hints without TypeScript tooling overhead.

## Getting Started

All you need is Zod installed in your project (`npm install zod`) and a modern code editor like VS Code (which has native support for TypeScript). The rest is just JavaScript.

## Related Reading

- [Types in JavaScript With Zod and JSDoc](https://blog.jim-nielsen.com/2023/types-in-jsdoc-with-zod/) by Jim Nielsen
- [JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html) - TypeScript's official documentation on JSDoc support
- [Zod Documentation](https://zod.dev/) - Official Zod schema validation library documentation
