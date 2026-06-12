---
title: "Overriding a vi.doMock Factory in Vitest 4"
pubDate: 2026-06-25
description: "Why re-calling vi.doMock for the same specifier stopped working in Vitest 4, and how to override mock behaviour per test with vi.mocked().mockImplementation()."
author: "Schalk Neethling"
tags: ["testing", "javascript", "vitest"]
---

# Overriding a `vi.doMock` factory in Vitest 4

After upgrading to Vitest 4 (commit `b18ce372d`), one test in
`apps/component-library/src/js/utils/algolia/client.test.js` started failing:

```
FAIL  src/js/utils/algolia/client.test.js > client > initAlgolia > should throw and clear state on error
AssertionError: promise resolved "undefined" instead of rejecting
```

This note explains what the test looked like before, why the Vitest 4 upgrade
broke it, and how it was fixed.

## How it was coded before

The suite uses a `beforeEach` to register a "happy path" mock of
`./client-utils` so that `getAlgoliaCredentials()` returns a valid config:

```js
beforeEach(() => {
    vi.resetModules();
    vi.doMock("algoliasearch/lite", () => ({ /* ... */ }));
    vi.doMock("instantsearch.js", () => ({ /* ... */ }));
    vi.doMock("./client-utils", () => ({
        getAlgoliaCredentials: vi.fn(() => ({
            applicationId: "test_app_id",
            apiKey: "test_api_key",
            indexName: "test_index",
            langCode: "en",
        })),
        getFilters: vi.fn(() => "search_api_language:en"),
    }));
});
```

For the one error-path test, the original implementation re-called
`vi.doMock("./client-utils", ...)` with a **throwing** factory:

```js
it("should throw and clear state on error", async () => {
    vi.doMock("./client-utils", () => ({
        getAlgoliaCredentials: vi.fn(() => {
            throw new Error("Config not found");
        }),
    }));

    const { initAlgolia } = await import("./client");

    await expect(initAlgolia()).rejects.toThrow("Error initializing Algolia");
});
```

The assumption: the second `vi.doMock` for the same specifier replaces the
first, so when `./client` is dynamically imported it gets the throwing version
of `getAlgoliaCredentials`. `initAlgolia()` then catches the error, clears
state, and re-throws as `"Error initializing Algolia"`.

## Why it worked before (Vitest 3)

In Vitest 3, `vi.doMock` always queued a fresh factory for the next dynamic
import. Calling it twice for the same specifier inside a single test simply
made the **second** factory the active one for the next `import()` of that
module. Since `vi.resetModules()` in `beforeEach` had already cleared the
module registry, the next `await import("./client")` triggered a fresh resolve
of `./client-utils`, which used the override factory and threw.

So the test reliably exercised the error branch.

## What changed in Vitest 4

Vitest 4 tightened how `vi.doMock` factories are cached per-specifier within a
test run. Once a `vi.doMock("./client-utils", ...)` factory has been registered
in `beforeEach` and an import has been resolved against it, calling
`vi.doMock("./client-utils", ...)` a second time with a different factory does
**not** reliably replace the first one for subsequent dynamic imports — even
after `vi.resetModules()`.

The practical effect in this test: the second factory was silently ignored.
`initAlgolia()` ran with the original happy `getAlgoliaCredentials`, succeeded,
and resolved `undefined` — instead of rejecting. Hence the failure message:

```
- Expected:  Error { "message": "rejected promise" }
+ Received:  undefined
```

This is the order of operations Vitest 4 now applies:

1. `beforeEach` → `vi.doMock("./client-utils", happyFactory)` → factory locked.
2. Test body → `vi.doMock("./client-utils", throwingFactory)` → ignored.
3. `await import("./client")` → resolves `./client-utils` via the locked
   `happyFactory`.
4. `initAlgolia()` succeeds → test expectation fails.

Curiously, the test passed when run **in isolation** (only this file). That's
because the Vitest 4 caching is keyed off prior module resolution within the
worker, and a single-file run had less prior state to anchor the cache to.
This is exactly the kind of "passes locally, fails in CI" trap that motivated
the fix.

## The fix

Don't try to replace the factory at all. The `beforeEach` factory already
returns a `vi.fn()` for `getAlgoliaCredentials`; we can just override that
function's **implementation** for the one test that needs to throw. Vitest 4
has no problem with that — it's a plain mock-function operation that doesn't
touch the module factory registry:

```js
it("should throw and clear state on error", async () => {
    const { getAlgoliaCredentials } = await import("./client-utils");
    vi.mocked(getAlgoliaCredentials).mockImplementation(() => {
        throw new Error("Config not found");
    });

    const { initAlgolia } = await import("./client");

    await expect(initAlgolia()).rejects.toThrow("Error initializing Algolia");
});
```

Why this works:

- `./client-utils` is still mocked by the `beforeEach` factory — the only
  thing we change is what its `getAlgoliaCredentials` returns when called.
- `initAlgolia` calls `getAlgoliaCredentials()` **lazily at runtime**, not at
  module import time, so swapping its implementation before importing
  `./client` is enough to make the new behavior take effect.
- No second `vi.doMock`, no `vi.resetModules` gymnastics, no reliance on
  Vitest's internal factory caching.

## Takeaway

In Vitest 4, treat each `vi.doMock(specifier, factory)` as a **one-shot**
registration per test run. To vary mock behavior per test, return `vi.fn()`s
from the `beforeEach` factory and use `vi.mocked(fn).mockImplementation(...)`
(or `mockReturnValue`, `mockResolvedValue`, etc.) inside the individual test.
Avoid re-calling `vi.doMock` for the same specifier within a single test —
even with `vi.resetModules()` in between, the override is not reliable.
