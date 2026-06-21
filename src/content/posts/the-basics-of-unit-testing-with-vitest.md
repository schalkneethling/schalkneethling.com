---
title: "How To Think About Unit Tests, With Vitest"
pubDate: 2026-06-21
description: "A practical guide to thinking about what to test and why, using Vitest as my tool of choice. Covers the happy path, conditionals, purity, and the limits of code coverage as a measure of test quality."
author: "Schalk Neethling"
tags: ["testing"]
---

Test-driven development has been getting renewed attention lately, often in the context of working effectively with coding agents. It has always been a good idea, of course, but like other quality concerns such as accessibility and tech debt, testing tends to fall by the wayside. One of the primary reasons for this is because they are pushed to the end of the development cycle.

When time and budget pressure then set in, these topics are pushed right over the edge. There is almost always a promise made that we will circle back, but if you have been in the industry for a while, you know that those promises are, unlike JavaScript Promises, rarely fulfilled. When deliberately instructing coding agents to follow a test-driven development approach, we are deliberately front-loading the testing process and generally end up with much better test coverage.

Even though a coding agent will write most, or all of these tests, it is still important that you know what to look for in these tests. So, this post is therefore not so much about how to write tests, but rather, a quick guide on how to think about your tests.

## The Function We Are Testing

```ts
export function applyMove(state: GameState, move: Move): GameState {
  const { board, toMove } = state;
  const { cell, token } = move;

  if (cell < 0 || cell >= board.length) {
    throw new IllegalMoveError(
      `Cell out of bounds: Cell was set as ${cell} with a board size of ${board.length}`,
    );
  }

  if (board[cell] !== null) {
    throw new IllegalMoveError(
      `Cell already occupied: Cell ${cell} is already occupied by ${board[cell]}`,
    );
  }

  const nextPlayer: PlayerId = toMove === "p1" ? "p2" : "p1";

  return { board: board.with(cell, token), toMove: nextPlayer };
}
```

This is a pretty straightforward function that takes two objects as arguments and returns a new game state. However, we have a couple of topics to consider here:

- The happy path
- Two conditionals that can cause our `GameState` to be invalid
- Switching our player
- Ensuring that the function stays pure

## Getting Started

For our tests, we will use [Vitest](https://vitest.dev/), which is almost the defacto standard for writing unit tests.

> **Note**: Please refer to the Vitest link above for more information on setting it up for your project.

Once you have Vitest set up, you can start writing your tests. I will assume you have a TypeScript file named `index.ts` in your project that contains the function from earlier. You will also need a couple of types, so go ahead and add the following to your `index.ts` file:

```ts
export type Token = "X" | "O";
export type PlayerId = "p1" | "p2";

export type Cell = Token | null;
export type Board = readonly Cell[];

export type Move = {
  readonly cell: number;
  readonly token: Token;
};

export type GameState = {
  readonly board: Board;
  readonly toMove: PlayerId;
};
```

For good measure, also add a `errors.ts` file with the following content:

```ts
export class IllegalMoveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IllegalMoveError";
  }
}
```

## Our Test Suite

The basis for our test suite will be the following:

```ts
import { describe, expect, it } from "vitest";

import { applyMove, type GameState, type Move } from "./index";
import { IllegalMoveError } from "./errors";

describe("applyMove", () => {});
```

### Testing the Happy Path

When valid data is provided to our function we want to ensure that a move is applied and the new board state is returned.

```ts
it("places the token and advances to the next player", () => {
  const state: GameState = {
    board: [null, null, null, null, null, null, null, null, null],
    toMove: "p1",
  };
  const move: Move = { cell: 0, token: "X" };

  const nextState = applyMove(state, move);

  expect(nextState).toEqual({
    board: ["X", null, null, null, null, null, null, null, null],
    toMove: "p2",
  });
});
```

Inside `it` we state what it is we are testing and our outcome, and the callback function is our implementation. The test is rather simple. We start with an empty board, and player one is the player who is currently moving. We construct a move that will place the token "X" in the first cell. We then call our function, passing the state and move. We then store the return value in `nextState`.

We close the test by stating our expectation. In this case, we expect `nextState` to match our expected outcome. Running this test should produce an all green outcome. One thing to notice here is that we covered two of our cases with this single tests. We confirm that the move is applied correctly, and that the player is switched to the next player.

In this instance, that is completely fine as we are testing one cohesive behavior. However, be careful that you do not group too many expectations in a single test. If you do, it can make it harder to understand what is going on when a test fails. Consider whether two or three smaller tests allow you to reason about the details clearer, and will ensure you can more accurately diagnose the core reason for the failure. Also, you do not _have_ to run the complete test suite each time. Test runners such as Vitest allow you to run individual tests or test suites, so having isolated cases can often make iterations faster by only running those tests that are failing. This is helpful both when working by hand or with a coding agent.

### Testing the Conditionals

And here is exactly one of those cases. We _could_ technically test both our conditionals in a single test, but I much prefer to have each of these isolated into its own test case.

```ts
it("throws IllegalMoveError when cell is out of bounds", () => {
  const state: GameState = {
    board: [null, null, null, null, null, null, null, null, null],
    toMove: "p1",
  };
  const move: Move = { cell: 9, token: "X" };

  expect(() => applyMove(state, move)).toThrow(IllegalMoveError);
  expect(() => applyMove(state, move)).toThrow(/cell out of bounds/i);
});
```

Here we create an empty board and then try to place our token in a cell outside the board's bounds. When this happens, we expect `applyMove` to throw an `IllegalMoveError`, but also specifically our "Cell out of bounds" error message. Be careful to ensure that you include the `i` as part of the regular expression to mark the match as case-insensitive or your test will fail.

A note on the above. Here we call the `applyMove` function twice for each expectation. In this instance, it is fine as we are working with a pure function with simple inputs. If you were working with a function with side effects or complex inputs, you would want to run your expectations against the same thrown error. Here is an alternative you could use if the function were expensive, had side effects, or you wanted to assert multiple things about the same thrown error:

```ts
try {
  applyMove(state, move);
  expect.fail("Expected applyMove to fail");
} catch (error) {
  if (!(error instanceof IllegalMoveError)) {
    throw error;
  }
  expect(error.message).toMatch(/cell out of bounds/i);
}
```

Our next test verifies that `applyMove` throws an `IllegalMoveError` when the cell is already occupied. Here we use the same `GameState` setup as before, but with a token already placed in the cell we are trying to move to. We expect `applyMove` to throw an `IllegalMoveError` with our "Cell already occupied" error message.

```ts
it("throws IllegalMoveError when cell is already occupied", () => {
  const state: GameState = {
    board: [null, null, null, null, null, null, null, null, "X"],
    toMove: "p1",
  };
  const move: Move = { cell: 8, token: "X" };

  expect(() => applyMove(state, move)).toThrow(IllegalMoveError);
  expect(() => applyMove(state, move)).toThrow(/cell already occupied/i);
});
```

### Ensuring That the Function Stays Pure

A note on the purity of the function. The two conditionals which throw are not reflected in the signature, so the function will not always return a value as advertised. That is really a totality concern rather than a purity one, though the strictest definition of purity tends to fold the two together by treating exceptions as a hidden output channel. Pragmatically, the function is deterministic, does not mutate its inputs, and reads no external state. Calling it pure here is fair.

So, the primary topic we still want to test is that state is not mutated.

```ts
it("does not mutate the original state", () => {
  const state: GameState = {
    board: [null, null, null, null, null, null, null, null, "X"],
    toMove: "p1",
  };

  const nextState = applyMove(state, { cell: 0, token: "O" });

  expect(state.board).toEqual([null, null, null, null, null, null, null, null, "X"]);
  expect(nextState.board).toEqual(["O", null, null, null, null, null, null, null, "X"]);
});
```

Before we walk through above, I want to highlight some testing scenarios that might at first glance seem correct, but subtly fail. One way you may consider testing non-mutation as is follows:

```ts
const originalState = state.board;
const nextState = applyMove(state, { cell: 0, token: "O" });

expect(originalState).toEqual(state.board);
```

The problem here is that `originalState` and `state.board` are the same reference, so the `toEqual` will always pass, even if `applyMove` mutated our state. One way to address this is to spread the array into a new reference:

```ts
const originalState = [...state.board];
const nextState = applyMove(state, { cell: 0, token: "O" });

expect(state.board).toEqual(originalState); // original unchanged
expect(nextState.board).not.toBe(state.board); // new reference
```

Here, `toEqual` tests the value to ensure it is unchanged, and `toBe` tests to ensure the two references are different. The final implementation I would recommend is the following:

```ts
it("does not mutate the original state", () => {
  const state: GameState = {
    board: [null, null, null, null, null, null, null, null, "X"],
    toMove: "p1",
  };

  const originalState = [...state.board];
  const nextState = applyMove(state, { cell: 0, token: "O" });

  expect(nextState.board).toEqual(["O", null, null, null, null, null, null, null, "X"]);
  expect(state.board).toEqual(originalState); // original unchanged
  expect(nextState.board).not.toBe(state.board); // new reference
});
```

## What About Coverage?

You may have heard about code coverage. You may even have heard people mention that you should strive for 100% coverage. However, I am going to do two things.

1. Show how to [set up code coverage with Vitest](https://vitest.dev/guide/coverage.html)
2. Tell you to be careful with the output of the tool and the 100% goal

### Setting up Code Coverage

At the root of your project, create a `vitest.config.ts` file with the following content:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
    },
  },
});
```

Next, in `package.json`, add the following script:

```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage"
  }
}
```

Lastly, install the `@vitest/coverage-v8` package, using your package manager of choice:

```bash
pnpm i -D @vitest/coverage-v8
```

When you now run `pnpm test:coverage`, you should see a code coverage report in the terminal.

### The Caution and Conclusion

What we did in this post is carefully consider what we should test and why. This is _always_ the way to instruct your agents, and how you should review and write tests in your own projects. If code coverage reports 100%, that is a happy coincidence, but it should not be your target. Coverage tools measure which lines ran during your tests, not whether your tests actually verified anything meaningful about them. A test that exercises a code path without asserting anything meaningful about a behavior still increases the coverage number.

Therefore, adding tests for the sake of coverage can end up expanding your maintenance surface _and_ slow down your development process. Lack of maintenance means that you have tests that do not meaningfully increase your confidence to ship code, and that is what tests must do. Tests that slow down a development workflow may be skipped, and tests that are not run, have no value. You also do not want to overburden your delivery process by slowing your continuous integration (CI) pipeline to a crawl. This can lead to pull request queues that frustrate your fellow developers.

As with everything we ship, we should be adding measurable value. Code coverage can be an indicator of that, but it should not be your only metric.
