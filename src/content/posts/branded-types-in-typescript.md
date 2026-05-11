---
title: "Branded Types in TypeScript: Making the Compiler Care About Meaning"
pubDate: 2026-05-10
description: "TypeScript's structural typing means two types with the same shape are interchangeable, but sometimes this is not what you want. Branded types fix that by adding a phantom property the compiler tracks, but that vanishes at runtime. 👻"
author: "Schalk Neethling"
tags: ["typescript"]
---

TypeScript is structurally typed. Two types are compatible if their members, properties, methods, and their respective types match." A structural system says a type is defined by what it contains; a nominal system (think Java, Rust, Swift) says a type is defined by what it is — its declaration is its identity. Most of the time, structural typing is a feature — it makes interop with JavaScript seamless and keeps you out of inheritance hierarchies. But sometimes you need the compiler to understand that two values with the same shape mean fundamentally different things.

That's the problem branded types solve.

## The Problem

Consider two type aliases:

```ts
type CodePoint = number;
type CSSPixel = number;
```

Both resolve to `number`. To the compiler, they are the same type — the alias is documentation for humans, nothing more.

```ts
const cp: CodePoint = 0x41; // 'A'
const px: CSSPixel = cp; // No error. A code point is now a pixel.

function moveRight(distance: CSSPixel) {
  /* … */
}
moveRight(cp); // Still no error.
```

There's no declaration you can write using plain `type X = number` that will make the compiler distinguish them. Structural typing only asks "what properties does this value have?" — and every `number` has the same properties.

This isn't hypothetical. In 1999, [NASA's Mars Climate Orbiter](https://science.nasa.gov/mission/mars-climate-orbiter/) was lost because one team's software produced [thruster data in pound-force seconds while another team's software expected newton-seconds](https://llis.nasa.gov/llis_lib/pdf/1009464main1_0641-mr.pdf). Both were just numbers, `double` to be exact. The values had the same type but different meanings, and the mismatch sent the spacecraft too close to Mars, where it burned up in the atmosphere. A $125 million mission, lost to a unit mix-up.

## The Idea

If structural typing checks _shape_, make the shapes _different_. Add a phantom property that exists only at the type level — one that the compiler tracks but that vanishes entirely when TypeScript is compiled to JavaScript.

```ts
type PositiveNumber = number & { __brand: "PositiveNumber" };
```

Now a bare `number` can't be assigned where a `PositiveNumber` is expected:

```ts
const raw: number = 5; // 5 is of type number
const p: PositiveNumber = raw;
//    ^ Error: Type 'number' is not assignable to type 'PositiveNumber'.
//      Type 'number' is not assignable to type '{ __brand: "PositiveNumber" }'.
```

The compiler sees that `number` lacks the `__brand` property and rejects the assignment. At runtime, the value is still just `5` — no wrapper, no property, no overhead.

### What "Phantom" Means

The property `__brand` is "phantom" because no runtime value ever actually has it. Real JavaScript numbers don't carry a `__brand` property. The intersection `number & { __brand: "PositiveNumber" }` is a type-level fiction — the compiler tracks it, but it's fully erased at compile time. The emitted JavaScript is just:

```js
const p = 5; // That's it.
```

### What the Intersection (`&`) Is Doing

An [intersection type](https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types) `A & B` means "a value that satisfies both A and B simultaneously." So a `PositiveNumber` must be a `number` (you can do arithmetic on it) _and_ must have a `__brand` property of type `"PositiveNumber"`. The compiler checks both constraints to determine whether there is a structural type match. At runtime, the value is just a plain number.

## Making It Robust: `unique symbol`

The `__brand` string approach works, but the double-underscore prefix is just a convention. The \_\_ is MC Hammer asking you not to touch it. The unique symbol is MC Hammer actually locking the door. One is a polite request; the other is a structural guarantee enforced by the compiler.

And even then, `as` is the lockpick that opens any door. So the full picture is: \_\_ asks nicely, the unique symbol locks the door, and the skeleton key is the one that bypasses everything. A `unique symbol` is structurally impossible to collide with:

```ts
declare const __brand: unique symbol;
```

Three things are happening in this one line:

1. **`declare`** — this is for the type level only; no JavaScript is emitted.
2. [**`unique symbol`**](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#unique-symbol) — creates a type that is only equal to itself. No other symbol, even one with the same description, will match.
3. **Not exported** — no external module can reference this symbol type, so the brand cannot be forged from outside the module.

A string key `"__brand"` and a symbol key `[__brand]` are fundamentally different property keys in JavaScript. Even if some object had a string property called `__brand`, it would occupy a completely separate slot. This isn't collision-resistant; it's collision-proof by design.

## The Generic Brand Type

Rather than repeating the intersection pattern for every branded type, wrap it in a generic:

```ts
// brand.ts
declare const __brand: unique symbol;

export type Brand<T, K extends string> = T & { readonly [__brand]: K };
```

Now creating a branded type is a one-liner:

```ts
type PositiveNumber = Brand<number, "PositiveNumber">;
type NonEmptyString = Brand<string, "NonEmptyString">;
type UserId = Brand<number, "UserId">;
type OrderId = Brand<number, "OrderId">;
```

`T` constrains the underlying primitive. `K` distinguishes one brand from another. Hover over `PositiveNumber` in your editor, and you'll see `number & { readonly [__brand]: "PositiveNumber" }` — clean at the surface, transparent when you dig.

## The Unsafe Constructor

The brand exists only at the type level. To create a branded value, you need exactly one place where you perform an `as` cast — and that place should make you uncomfortable.

```ts
export function unsafeBrand<B extends Brand<unknown, string>>(
  value: unknown,
): B {
  return value as B;
}
```

This function does nothing at runtime. It simply returns the value unchanged. The `as B` cast is an unchecked lie to the compiler. The name `unsafeBrand` is deliberate, borrowing the same philosophy as React's `dangerouslySetInnerHTML`: the API works, but the name creates friction. When someone sees it in a code review, the immediate question is "Why are you calling the unsafe version?"

### Why a Single Generic?

An earlier version of this function used two generics:

```ts
export function unsafeBrand<T, K extends string>(
  value: T,
  _kind: K,
): Brand<T, K> {
  return value as Brand<T, K>;
}

// Usage: verbose, and carries a dead parameter
const p = unsafeBrand(42, "PositiveNumber");
```

This has several problems. The `_kind` parameter exists only for type inference; it's dead code at runtime. The call site can't use the `PositiveNumber` alias; you have to decompose it back into its parts. And TypeScript infers the literal type of the first argument, so `unsafeBrand(42, "PositiveNumber")` gives you `Brand<42, "PositiveNumber">` instead of `Brand<number, "PositiveNumber">`.

The single-generic version avoids all of this:

```ts
const p = unsafeBrand<PositiveNumber>(42);
```

You specify the brand type directly. The return type is `PositiveNumber`. No dead parameters, no decomposition, no inference surprises.

## The Full `brand.ts`

```ts
declare const __brand: unique symbol;

export type Brand<T, K extends string> = T & { readonly [__brand]: K };

export function unsafeBrand<B extends Brand<unknown, string>>(
  value: unknown,
): B {
  return value as B;
}
```

Three lines of real code. Zero runtime cost. The foundation for every branded type in your project.

## Making It Safe: Validated Constructors

`unsafeBrand` is a building block, not something you call directly in application code. It exists so your validated constructors don't each need their own `as` cast. The layering is: application code calls a validated constructor, which calls `unsafeBrand`, which does the cast.

There are three patterns for building that validation layer, each suited to a different situation.

### Pattern 1: Return a Branded Value

Use this when you need to produce a branded value that will be stored, passed around, or returned from a function.

```ts
type PositiveNumber = Brand<number, "PositiveNumber">;

function toPositiveNumber(value: number): PositiveNumber {
  if (value <= 0) {
    throw new RangeError(`${value} is not a positive number`);
  }
  return unsafeBrand<PositiveNumber>(value);
}

// Usage:
const seconds = toPositiveNumber(5);
waitForSeconds(seconds); // ✓ — branded, validated, portable.
```

The constructor validates, brands, and returns. The branded value can flow through any number of function signatures without re-validation — the type carries the guarantee with it.

### Pattern 2: Type Predicate

Use this when invalid input is a normal case you want to branch on, not an exception.

```ts
function isPositiveNumber(value: number): value is PositiveNumber {
  return value > 0;
}

// Usage:
const input: number = getUserInput();

if (isPositiveNumber(input)) {
  // TypeScript knows input is PositiveNumber in here.
  waitForSeconds(input); // ✓
}

// Out here, input is still just `number`.
waitForSeconds(input); // ✗ Error
```

The compiler narrows the variable's type within the `if` block. No cast, no construction, the brand is attached by control flow analysis. This is useful when you want to handle both the valid and invalid cases without throwing.

### Pattern 3: Assertion Function

Use this when invalid input should halt execution. It either passes or the program stops.

```ts
function assertPositiveNumber(value: number): asserts value is PositiveNumber {
  if (value <= 0) {
    throw new RangeError(`${value} is not a positive number`);
  }
}

// Usage:
const input: number = getUserInput();

assertPositiveNumber(input);
// From this line onward, TypeScript knows input is PositiveNumber.
waitForSeconds(input); // ✓
```

The compiler narrows the variable's type from the assertion point forward. If execution continues past the call, the value must be valid. Unlike the [type predicate](https://www.learningtypescript.com/articles/branded-types#type-predicates), there's no branching, it's linear code with a hard stop on failure.

### How They Differ

The key distinction: type predicates and [assertion functions](https://www.learningtypescript.com/articles/branded-types#assertion-functions) narrow an existing variable _in the current scope_. The constructor pattern (`toPositiveNumber`) produces a new branded value you can _store and pass elsewhere_. Neither the predicate nor the assertion calls `unsafeBrand` — they don't need to, because the compiler handles the narrowing.

| Pattern                                     | Returns a value?      | Throws on failure? | Use when…                                        |
| ------------------------------------------- | --------------------- | ------------------ | ------------------------------------------------ |
| Constructor (`toPositiveNumber`)            | Yes — a branded value | Yes                | You need a branded value to return or store      |
| Type predicate (`isPositiveNumber`)         | No — narrows in place | No                 | Invalid input is expected; you want to branch    |
| Assertion function (`assertPositiveNumber`) | No — narrows in place | Yes                | Invalid input is exceptional; halt if it happens |

Choose based on what your code needs to do with the result.

## The Social Contract

Everything above works well, but there's a gap the compiler can't close. Nothing stops someone from writing:

```ts
const fake = -1 as unknown as PositiveNumber; // Compiles. The value is a lie.
```

TypeScript has no concept of a type that can only be constructed by a specific function. You're relying on the team to agree: the only legitimate call to `unsafeBrand` is inside a validated constructor.

This can be reinforced with code review, ESLint rules (though the built-in `@typescript-eslint/consistent-type-assertions` is all-or-nothing, it can ban every as cast, but not target specific types without a custom rule), or by keeping unsafeBrand in a module that only your constructors import. But ultimately, it's a convention. The compiler stops bare numbers from flowing in, but enforcement of how the `Brand` is derived is on you and your team.

When working with coding agents, you should also consider adding a `PostToolUse` hook like the following that informs the agent to check its work and ensure no unsafe casts are happening:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Review the code that was just written or edited. Check whether any branded types (types using the Brand<T, K> pattern) were cast to using 'as'. Branded types must only be produced through type predicates ('value is X'), assertion functions ('asserts value is X'), or validated constructor functions that call unsafeBrand internally after validation. Direct 'as BrandedType' casts in application code are not allowed — only the unsafeBrand utility may use 'as', and it should only be called inside a validated constructor. If you find a violation, explain which line and why it's unsafe."
          }
        ]
      }
    ]
  }
}
```

## How This Compares to Rust

Rust solves the same problem more directly with its [newtype pattern](https://doc.rust-lang.org/rust-by-example/generics/new_types.html):

```rust
struct PositiveNumber(u32);
```

Two structs with the same fields are different types by definition; that's nominal typing. The compiler rejects `PositiveNumber` where `CSSPixel` is expected without any phantom properties or symbol tricks. If the fields are private (which they are by default), the type literally cannot be constructed outside its module. The compiler enforces the single-constructor rule, not a convention.

The tradeoff: Rust's newtype is a real runtime wrapper. You have to unwrap with `.0` to get the inner value, and you lose all the inner type's methods unless you delegate them. In practice, the compiler optimizes single-field structs to have the same layout as the inner type, so it's typically zero-cost, but it's a guarantee from the optimizer, not the language.

TypeScript's branded types are zero-cost by construction; the brand is erased, the value is always a bare primitive. The downside is the `as` cast escape hatch. Rust says "types are different unless you prove they're the same." TypeScript says "types are the same unless you make them look different." Branded types are the trick that makes them look different, and it works well in practice, but it's always swimming against the current of the language's design.

## When to Reach for Branded Types

Branded types aren't common in everyday TypeScript code. They add friction, and the friction isn't always worth it. But they shine in specific situations:

**Preventing ID mixups.** `UserId`, `OrderId`, and `ProductId` are all `string` or `number` under the hood. Branding stops you from passing a user ID where an order ID is expected.

**Distinguishing units.** `Milliseconds` vs `Seconds`, `Celsius` vs `Fahrenheit`, `Bytes` vs `Kilobytes`. If the Mars Climate Orbiter had branded types, the pounds-vs-newtons bug would have been a compile error. Probably...

**Marking validated data.** A `SanitizedHTML` brand on a string means it's already been cleaned. A `ValidEmail` brand means the string passed validation, although this is likely too fine-grained. The brand records that a process has been applied.

**Spec-compliant parsers.** If you're implementing the WHATWG HTML tokenizer, for instance, Unicode code points and Unicode scalar values are both numbers, but the spec distinguishes them carefully. Branding makes that distinction compile-time checked.

The common thread isn't "constrained primitives", it's any situation where structurally identical values have different semantic meaning, and confusing them is a bug you want caught at compile time.

## The Complete Pattern

```ts
// brand.ts
declare const __brand: unique symbol;

export type Brand<T, K extends string> = T & { readonly [__brand]: K };

export function unsafeBrand<B extends Brand<unknown, string>>(
  value: unknown,
): B {
  return value as B;
}
```

```ts
// positive-number.ts
import { Brand, unsafeBrand } from "./brand";

export type PositiveNumber = Brand<number, "PositiveNumber">;

export function toPositiveNumber(value: number): PositiveNumber {
  if (value <= 0) {
    throw new RangeError(`${value} is not a positive number`);
  }
  return unsafeBrand<PositiveNumber>(value);
}

export function isPositiveNumber(value: number): value is PositiveNumber {
  return value > 0;
}

export function assertPositiveNumber(
  value: number,
): asserts value is PositiveNumber {
  if (value <= 0) {
    throw new RangeError(`${value} is not a positive number`);
  }
}
```

```ts
// app.ts
import {
  PositiveNumber,
  toPositiveNumber,
  isPositiveNumber,
  assertPositiveNumber,
} from "./positive-number";

declare function waitForSeconds(seconds: PositiveNumber): Promise<void>;

// Pattern 1: Construct and pass around
const seconds = toPositiveNumber(5);
waitForSeconds(seconds); // ✓

// Pattern 2: Branch on validity
const input = getUserInput();
if (isPositiveNumber(input)) {
  waitForSeconds(input); // ✓ — narrowed inside the block
}

// Pattern 3: Assert and continue
const raw = parseFloat(process.argv[2]);
assertPositiveNumber(raw);
waitForSeconds(raw); // ✓ — narrowed from this point on

// All of these fail:
waitForSeconds(42); // ✗ — bare number, no brand
waitForSeconds(-1); // ✗ — bare number, no brand
```

Three lines of foundation. One alias per concept. One validated constructor per brand. Zero runtime cost. The compiler catches the mistakes; the constructors enforce the invariants; the naming conventions keep the team honest.
