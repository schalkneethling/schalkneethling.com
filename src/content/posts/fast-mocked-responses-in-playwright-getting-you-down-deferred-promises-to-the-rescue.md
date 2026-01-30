---
title: "Fast Mocked Responses in Playwright Getting You Down? Deferred Promises to the Rescue"
pubDate: 2026-01-30
description: "How to use deferred promises to control mock response timing in Playwright tests and avoid race conditions with instant responses."
author: "Schalk Neethling"
tags: ["playwright", "testing"]
---

Testing that a button shows a loading state during form submission sounds straightforward. Click the button, assert the loading class appears. But if you're mocking your API endpoints (as you should be in integration tests), you'll quickly run into a problem: the mocked response returns so fast that the loading state flashes by before your assertion can catch it. This is a common problem when using Playwright and can be frustrating to debug.

## The Problem

Consider a typical Playwright setup where you mock the form submission endpoint in a `beforeEach`:

```javascript
test.beforeEach(async ({ page }) => {
  await page.route("**/api/submit", async (route) => {
    await route.fulfill({
      status: 200,
      json: { success: true },
    });
  });
});
```

This works perfectly for testing success and error states, but when you try to test the loading state:

```javascript
await submitButton.click();
await expect(submitButton).toHaveClass(/Button--loading/);
```

The test fails. By the time Playwright checks for the class, the response has already returned and the loading state is gone.

## The Solution: Deferred Promises

The trick is to take explicit control over _when_ the response completes. You can do this by wrapping the route fulfillment in a promise that you resolve manually:

```javascript
test("shows loading state during submission", async ({ page }) => {
  // Remove any existing route from beforeEach
  await page.unroute("**/api/submit");

  let resolveResponse;
  const responseReady = new Promise((resolve) => {
    resolveResponse = resolve;
  });

  await page.route("**/api/submit", async (route) => {
    await responseReady; // <--- Here is your control lever to delay the response
    await route.fulfill({
      status: 200,
      json: { success: true },
    });
  });

  const submitButton = page.locator('button[type="submit"]');

  // Fill out your form...

  // Click without awaiting — we need to catch the loading state
  submitButton.click();

  // Now we can reliably assert the loading state
  await expect(submitButton).toHaveClass(/Button--loading/);
  await expect(submitButton).toBeDisabled();

  // Release the response when we're ready
  resolveResponse();
});
```

The `responseReady` promise acts as a gate. The route handler waits for it before fulfilling, giving you complete control over timing.

## Completing the Test

How you verify the test's completion depends on what happens after a successful submission.

**If the page navigates on success** (common with traditional form submissions or multi-page apps), verify the response completed successfully:

```javascript
const responsePromise = page.waitForResponse((res) =>
  res.url().includes("/api/submit")
);

resolveResponse();

const response = await responsePromise;
expect(response.status()).toBe(200);
```

The button's loading class becomes irrelevant here as the whole page is about to be replaced by the new page.

**If you're working with an SPA** where the page doesn't navigate, you'll want to verify the loading state clears:

```javascript
resolveResponse();

await expect(submitButton).not.toHaveClass(/Button--loading/);
await expect(submitButton).toBeEnabled();
```

This tests the full cycle: loading state appears during the request and disappears when it completes.

## Why This Approach Works

The deferred promise pattern has a few advantages over simply adding a delay to your mock. A fixed delay (like `setTimeout(resolve, 500)`) is arbitrary. It might be too short on a slow CI runner or unnecessarily slow down your test suite. The deferred approach is deterministic: you assert the loading state, _then_ allow the response to complete. No timing guesswork, no flaky tests.

It also makes the test's intent explicit. Anyone reading the code can see exactly what's being tested and when each phase of the interaction occurs.

## Wrapping Up

Loading states are an important part of the user experience, and they deserve test coverage. The deferred promise pattern gives you the control you need to reliably test these transient states, regardless of how fast your mocks respond.
