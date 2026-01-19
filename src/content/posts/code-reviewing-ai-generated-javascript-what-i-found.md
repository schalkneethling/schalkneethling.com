---
title: "Code Reviewing AI-Generated JavaScript: What I Found"
pubDate: 2026-01-19
description: "What I learned reviewing AI-generated JavaScript: real-world issues, code review tips, and ways to ensure robust, production-ready code."
author: "Schalk Neethling"
tags: ["javascript", "ai", "code-review", "best-practices"]
---

I recently had an AI agent build a JavaScript utility for calculating road distances using a third-party API. The task was complex: batch multiple API requests, validate inputs and outputs, handle errors gracefully, and manage timeouts. The agent delivered working code that passed its own tests.

Then I started the code review.

The code worked, but several issues ranged from minor inefficiencies to a critical bug that would break production. Here's what I found and how we fixed each one.

## Issue #1: The Critical Bug - Filtering Out Unreachable Destinations

This was the showstopper. The code calculated distances to 25 store locations, but one store was unreachable (on an island, road construction, whatever). The function returned 24 results instead of 25.

```javascript
// Before - silently removes unreachable destinations
const validResults = results
  .filter(r => r.distance !== null)
  .map(r => DistanceResultSchema.parse(r));
```

The problem? No way to tell which store is missing. If you're building a UI showing "closest stores," you can't map the 24 results back to your original 25 stores. You can't show "Store #7 is currently unreachable."

We fixed it by including all destinations and using null for unreachable ones:

```javascript
// After - includes all destinations
const validResults = results.map(r => DistanceResultSchema.parse(r));

// Schema updated to allow nulls
const DistanceResultSchema = z.object({
  targetId: z.string(),
  distance: z.number().nullable(), // null if unreachable
  time: z.number().nullable(),
});
```

Now input length always equals output length. Consumers can map results directly to their original destinations and handle unreachable cases explicitly.

## Issue #2: Schemas Used Only for Type Inference

The code defined Zod schemas but never actually used them for validation:

```javascript
// Before - schema exists but isn't used
const DistanceSuccessSchema = z.object({
  success: z.literal(true),
  data: z.array(DistanceResultSchema),
});

// Returns plain object, no validation
return {
  success: false,
  error: "Invalid origin coordinates",
};
```

Schemas just sat there with `eslint-disable-next-line no-unused-vars` comments. We fixed it by actually parsing every return value:

```javascript
// After - validate all returns
return DistanceErrorSchema.parse({
  success: false,
  error: "Invalid origin coordinates",
});
```

This applies to all 9 error returns and 2 success returns throughout the file. Now type mismatches get caught immediately instead of causing runtime bugs downstream.

## Issue #3: API Key Passed as Separate Parameter

The function signature spread configuration across multiple parameters:

```javascript
// Before
calculateDistanceBatch(origin, destinations, apiKey, options)
```

This makes the signature harder to extend and creates more parameters to track. We consolidated everything into a single options object:

```javascript
// After
const apiKey = getApiKey(validatedOptions);
const optionsWithKey = { ...validatedOptions, apiKey };
calculateDistanceBatch(origin, destinations, optionsWithKey);
```

Cleaner signature, single config object, easier to extend in the future.

## Issue #4: Unnecessary Intermediate Function

The code had three layers:

1. `calculateDistances()` - validated and routed
2. `calculateDistancesInBatches()` - orchestrated batches
3. `calculateDistanceBatch()` - made API call

The middle function exposed implementation details that consumers don't need to know about. We merged the batching logic directly into the main function:

```javascript
// After - batching is hidden implementation detail
export async function calculateDistances(origin, destinations, options) {
  // Batching logic inline
  if (destinations.length > MAX_BATCH_SIZE) {
    const batches = /* create batches */;
    const results = await Promise.all(/* process batches */);
    return /* combine results */;
  }
  return calculateDistanceBatch(origin, destinations, options);
}
```

Consumers call once and get all results. They don't need to know about batching.

## Issue #5: Mixed Error Handling Paradigms

The batch function returned success/error objects but never threw errors:

```javascript
// Before - returns error objects
try {
  if (!response.ok) {
    return DistanceErrorSchema.parse({ success: false, error: "..." });
  }
} catch (error) {
  return DistanceErrorSchema.parse({ success: false, error: "..." });
}
```

This meant `Promise.all()` always succeeded, requiring manual success checks afterward. We switched to proper throw semantics for internal helpers:

```javascript
// After - internal helpers throw
try {
  if (!response.ok) {
    throw new Error(`Distance Matrix API error: ${response.status}`);
  }
  return { data: [...] };
} catch (error) {
  throw error;
}
```

Now `Promise.all()` works as expected with fail-fast semantics. The public API still returns success/error objects by catching throws at the boundary.

## Issue #6: Manual API Response Validation

The code validated API responses with basic checks:

```javascript
// Before - manual validation
if (!data.sources_to_targets || !Array.isArray(data.sources_to_targets[0])) {
  throw new Error("Invalid Distance Matrix response format");
}
```

This only validates one field and doesn't check types. We created a comprehensive Zod schema instead:

```javascript
// After - complete schema
const GeoapifyMatrixResponseSchema = z.object({
  sources: z.array(WaypointSchema).optional(),
  targets: z.array(WaypointSchema).optional(),
  sources_to_targets: z.array(z.array(MatrixEntrySchema)),
  units: z.string().optional(),
  // ... all fields from API docs
});

const { data, success, error } = GeoapifyMatrixResponseSchema.safeParse(rawData);
if (!success) {
  throw new Error(`Invalid response: ${error.message}`);
}
```

This validates the entire response structure, catches unexpected API changes, and documents the expected format in code.

## Issue #7: Verbose Validation Result Handling

The code handled Zod validation results verbosely:

```javascript
// Before
const validationResult = GeoapifyMatrixResponseSchema.safeParse(rawData);
if (!validationResult.success) {
  throw new Error(`Invalid: ${validationResult.error.message}`);
}
const data = validationResult.data;
```

Simple destructuring makes this cleaner:

```javascript
// After
const { data, success, error } = GeoapifyMatrixResponseSchema.safeParse(rawData);
if (!success) {
  throw new Error(`Invalid: ${error.message}`);
}
```

Minor improvement, but these add up across a codebase.

## Issue #8: Missing Documentation About Nullable Fields

After fixing the filtering bug (Issue #1), `distance` and `time` could be null, but nothing warned consumers. Someone calling `distance.toFixed()` would get runtime errors.

We added comprehensive documentation with examples:

```javascript
/**
 * Calculate road distances from origin to multiple destinations
 * 
 * **Important:** Results include ALL destinations, even unreachable ones.
 * Unreachable destinations have `distance: null` and `time: null`.
 * Consumers MUST check for null before using distance/time values.
 * 
 * @example
 * const result = await calculateDistances(origin, destinations);
 * if (result.success) {
 *   result.data.forEach(item => {
 *     if (item.distance === null) {
 *       console.log(`${item.targetId} is unreachable`);
 *     } else {
 *       console.log(`${item.targetId} is ${item.distance}km away`);
 *     }
 *   });
 * }
 */
```

Working examples prevent consumer bugs and make the behavior explicit.

## Issue #9: Testing Actual Duration Instead of Timeout Mechanism

The code includes timeout handling using `AbortController`. The AI agent wrote tests that actually waited 20 seconds to verify timeout behavior:

```javascript
// Before - waits 20 actual seconds
it("should timeout after 10 seconds", async () => {
  // Test waits 20+ seconds to ensure 10s timeout fires
}, 15000);
```

This is testing the wrong thing. We don't need to verify that JavaScript can count to 10,000 milliseconds. We need to verify that the timeout mechanism works.

```javascript
// After - tests mechanism in 200ms
it("respects custom timeout", async () => {
  const result = await calculateDistances(
    origin,
    destinations,
    { timeout: 100 } // 100ms timeout
  );
  // Mock delay is 200ms, so this should timeout
  expect(result.success).toBe(false);
  expect(result.error).toContain("timeout");
});
```

Test suite went from 20+ seconds to 2.2 seconds (90% faster). The mechanism is what matters, not the actual duration.

## What's Next

These nine issues share common patterns. In Part 2, I'll extract the prevention strategies that would have caught these problems during initial implementation. We'll look at when to use Zod, how to design error handling, maintaining input/output relationships, and what makes tests effective versus just thorough.

The AI agent produced working code, but working isn't the same as production-ready. Code review remains essential, even when (especially when?) AI is writing the code.
