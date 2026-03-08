---
title: "Cleaner Temp Directory Cleanup in Node.js With mkdtempDisposable"
pubDate: 2026-03-08
description: "Working with temporary directories in Node.js just became cleaner and more intentional with mkdtempDisposable and explicit resource management."
author: "Schalk Neethling"
tags: ["nodejs", "testing"]
---

When writing integration tests that need to work with the file system, you may commonly reach for `mkdir` or, if you know about it, `mkdtemp`. You would then set up your root folder inside a `beforeEach` hook and then clean up in your `afterEach` hook. Node.js 24 introduced `mkdtempDisposable`, which makes all of this just a little less manual and more intentional.

## The Manual Approach With mkdtemp

Here is how this typically looks in a [Vitest](https://vitest.dev/) test suite:

```javascript
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

describe("doctor", () => {
  let tempDir;
  let previousCwd;

  beforeEach(async () => {
    previousCwd = process.cwd();
    tempDir = await mkdtemp(path.join(tmpdir(), "my-cli-doctor-"));
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    await rm(tempDir, { recursive: true, force: true });
  });

  test("passes for a valid config", async () => {
    await mkdir(path.join(tempDir, "src/components"), { recursive: true });
    await writeFile(
      path.join(tempDir, "config.mjs"),
      `export default { components: { folder: "src/components" } };`,
    );

    const result = await runDiagnostics();
    expect(result.success).toBe(true);
  });
});
```

[`mkdtemp`](https://nodejs.org/api/fs.html#fspromisesmkdtempprefix-options) appends six random characters to the prefix you provide, giving you a unique directory path each time. You then combine this with [`os.tmpdir()`](https://nodejs.org/api/os.html#ostmpdir) to place it in the system's temporary directory. The approach works, but you need to remember to call `rm` with `{ recursive: true, force: true }` in your `afterEach`. Forget that, and you are slowly filling up your temp directory with orphaned test artefacts.

## Enter `mkdtempDisposable`

Node.js 24.4.0 introduced [`mkdtempDisposable`](https://nodejs.org/api/fs.html#fspromisesmkdtempdisposableprefix-options), which returns an object with a `path` property and a `remove()` method instead of a plain string. It also implements `Symbol.asyncDispose`, making it compatible with the [explicit resource management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/await_using) proposal.

The simplest way to adopt `mkdtempDisposable` in an existing test suite is to swap out `mkdtemp` and call `remove()` explicitly in your `afterEach`:

```javascript
import { mkdtempDisposable, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

describe("doctor", () => {
  let tempDir;
  let previousCwd;

  beforeEach(async () => {
    previousCwd = process.cwd();
    tempDir = await mkdtempDisposable(path.join(tmpdir(), "my-cli-doctor-"));
    process.chdir(tempDir.path);
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    await tempDir.remove();
  });

  test("passes for a valid config", async () => {
    await mkdir(path.join(tempDir.path, "src/components"), { recursive: true });
    await writeFile(
      path.join(tempDir.path, "config.mjs"),
      `export default { components: { folder: "src/components" } };`,
    );

    const result = await runDiagnostics();
    expect(result.success).toBe(true);
  });
});
```

No more importing `rm` or remembering the `{ recursive: true, force: true }` options. The `remove()` method handles all of that for you. This is a small but meaningful improvement. It is one less thing to get wrong when writing test setup and teardown.

## The `await using` Syntax

If you are running Node.js 24 or later, you can go a step further with `await using`. This is JavaScript's [explicit resource management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/await_using) syntax, and it is a natural fit for temporary directories in tests:

```javascript
test("passes for a valid config", async () => {
  await using tmpDir = await mkdtempDisposable(
    path.join(os.tmpdir(), "my-cli-doctor-"),
  );

  await mkdir(path.join(tmpDir.path, "src/components"), { recursive: true });
  await writeFile(
    path.join(tmpDir.path, "config.mjs"),
    `export default { components: { folder: "src/components" } };`,
  );

  const result = await runDiagnostics();
  expect(result.success).toBe(true);
  // tmpDir is automatically cleaned up when it goes out of scope
});
```

When `tmpDir` goes out of scope, its `Symbol.asyncDispose` method is called automatically, removing the directory and its contents. No `afterEach` needed for the cleanup, no `remove()` call to remember. The intent of the code is clearer too as the temporary directory is scoped to exactly where it is used.

### A Caveat: `await using` and `beforeEach`

You might be tempted to use `await using` inside a `beforeEach` hook to get automatic cleanup between tests. This will not work the way you expect. The `await using` declaration is scoped to the function it lives in, which is the `beforeEach` callback. When that callback finishes, the scope ends and `Symbol.asyncDispose` triggers immediately, removing the directory before your test even starts.

The key thing to understand is that `beforeEach`, the test function, and `afterEach` are three separate function invocations. They do not share a scope. So explicit resource management cannot span across them.

This means `await using` works when creation and usage live in the same function body, which is exactly the per-test pattern shown earlier. When you need a shared directory across multiple tests in a `describe` block, the `beforeEach`/`afterEach` pattern with an explicit `remove()` call is the right approach.

A note on the Node.js documentation: it states that `mkdtempDisposable` "should be used with `await` + `await using`." That "should" is a recommendation for the idiomatic usage pattern, not a requirement. If it were mandatory, the API would not expose `remove()` as a separate method. The `remove()` method exists precisely for cases like test hooks where you need manual control over when cleanup happens.

A seemingly small but meaningful addition to your Node.js toolbelt.

### Further Reading

- [`fsPromises.mkdtemp` — Node.js documentation](https://nodejs.org/api/fs.html#fspromisesmkdtempprefix-options)
- [`fsPromises.mkdtempDisposable` — Node.js documentation](https://nodejs.org/api/fs.html#fspromisesmkdtempdisposableprefix-options)
- [`await using` — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/await_using)
- [Explicit Resource Management TC39 Proposal](https://github.com/tc39/proposal-explicit-resource-management)
