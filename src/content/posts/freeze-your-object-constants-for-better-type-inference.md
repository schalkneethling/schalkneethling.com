---
title: "Freeze Your Object Constants for Better Type Inference"
pubDate: 2026-03-10
description: "How combining JSDoc annotations with Object.freeze gives you literal type inference, runtime immutability, and better IDE support for JavaScript constant objects."
author: "Schalk Neethling"
tags: ["typescript", "javascript"]
---

Constants offer consistent, predictable lookup keys without the brittleness and duplication of passing raw strings around your codebase. A common pattern is to group related constants into an object:

```javascript
export const UI_STATES = {
  INITIAL: "initial",
  LOADING: "loading",
  SEARCHING: "searching",
  RESULTS: "results",
  EMPTY: "empty",
  ERROR: "error",
};
```

This is a solid pattern. It gives you a single source of truth, makes refactoring easier, and provides basic type safety when you reference `UI_STATES.LOADING` instead of typing `"loading"` by hand. But if you hover over `UI_STATES` in your IDE, you will see something like this:

```text
const UI_STATES: {
    INITIAL: string;
    LOADING: string;
    SEARCHING: string;
    RESULTS: string;
    EMPTY: string;
    ERROR: string;
}
```

Every value is typed as `string`. As far as your tooling is concerned, `UI_STATES.INITIAL` and `UI_STATES.ERROR` are interchangeable. There is no distinction between them at the type level, and while `const` prevents reassignment of the binding itself, nothing prevents someone from mutating a property like `UI_STATES.INITIAL = "oops"`.

## Documenting intent with JSDoc

A good first step is making the intent of this object explicit through [JSDoc annotations](https://jsdoc.app/tags-enum):

```javascript
/**
 * Common UI states used across components.
 * Components can destructure only what they need and extend with custom states.
 * @readonly
 * @enum {string}
 */
export const UI_STATES = {
  INITIAL: "initial",
  LOADING: "loading",
  SEARCHING: "searching",
  RESULTS: "results",
  EMPTY: "empty",
  ERROR: "error",
};
```

The `@readonly` tag signals that these values should not be modified, and `@enum {string}` tells tooling this object represents a collection of related constants. Your IDE will now surface the documentation on hover, making the purpose of the object clear to anyone who encounters it.

However, the values are still typed as generic `string`. The JSDoc annotations improve documentation and signal intent, but they do not change how the type checker sees the values. It is also worth noting that while TypeScript does [support `@readonly` in JSDoc](https://github.com/microsoft/TypeScript/pull/35790), as Ryan Cavanaugh from the TypeScript team [clarified](https://github.com/microsoft/TypeScript/issues/41705#issuecomment-738479329), `@readonly` applies to the binding, not as a recursive modifier. In other words, placing it on the object-level comment does not make the individual properties readonly. You would need a separate `/** @readonly */` on each property for the type checker to enforce it, which is verbose and still does not provide runtime protection.

## Freezing for type inference and runtime safety

This is where [`Object.freeze`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) changes the game. Wrap your object in `Object.freeze` and the type inference shifts dramatically:

```javascript
/**
 * Common UI states used across components.
 * Components can destructure only what they need and extend with custom states.
 * @readonly
 * @enum {string}
 */
export const UI_STATES = Object.freeze({
  INITIAL: "initial",
  LOADING: "loading",
  SEARCHING: "searching",
  RESULTS: "results",
  EMPTY: "empty",
  ERROR: "error",
});
```

Now when you hover over `UI_STATES`, you will see:

```text
const UI_STATES: Readonly<{
    INITIAL: "initial";
    LOADING: "loading";
    SEARCHING: "searching";
    RESULTS: "results";
    EMPTY: "empty";
    ERROR: "error";
}>
```

Each value is now a string literal type, not a generic `string`. TypeScript (and your IDE) understands that `UI_STATES.INITIAL` is specifically `"initial"`, not just any string. This matters when you write functions that should only accept valid UI states, or when you use these values in conditional logic where the type checker can narrow possibilities.

Beyond type inference, `Object.freeze` also provides runtime protection. Any attempt to modify a property or add a new one will throw a `TypeError`. Your constants are now truly constant, not just by convention but by enforcement.

## A note on `as const` for TypeScript users

If you are working in TypeScript files rather than JSDoc-typed JavaScript, you can achieve similar literal type narrowing with the `as const` assertion:

```typescript
export const UI_STATES = {
  INITIAL: "initial",
  LOADING: "loading",
} as const;
```

This gives you the same `Readonly` type with literal values. The key difference is that `as const` is a compile-time only assertion. TypeScript will flag mutations during type checking, but `as const` is erased from the emitted JavaScript, so there is no runtime protection if the code is called from untyped JavaScript or if type checking is bypassed. If you want both type-level and runtime immutability, combining `Object.freeze` with `as const` covers both bases.

For JSDoc-typed JavaScript projects, `Object.freeze` is the clear winner since it gives you both benefits in a single, standards-based call.

### Acknowledgments

Thank to [Fynn Ellie Be (/fɪn 'ɛli ˈbiː/)](https://fynn.be) with whom I work at [Factorial.io](https://factorial.io) who sent me down this fun and informative rabbit hole.

## Further reading

- [Object.freeze on MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze)
- [JSDoc @enum tag](https://jsdoc.app/tags-enum)
- [TypeScript JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [TypeScript 3.4: const assertions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions)
- [ECMAScript specification: Object.freeze](https://tc39.es/ecma262/#sec-object.freeze)
