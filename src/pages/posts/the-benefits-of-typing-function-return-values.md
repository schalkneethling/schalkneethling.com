---
layout: ../../layouts/MarkdownPostLayout.astro
title: "Raise The Red Flag Early: The Power of Explicit Return Types in TypeScript"
pubDate: 2024-12-10
description: Learn how explicit return types in TypeScript can help you catch potential bugs early, improve code reliability, and create more predictable and maintainable TypeScript applications.
author: "Schalk Neethling"
tags: ["typescript"]
---

As developers, we're always on the lookout for ways to prevent errors before they make their way into production. One of the ways TypeScript can be your friend here is through the use of explicit return type annotations. This seemingly simple feature can dramatically improve your code's reliability and provide a better developer experience, especially for consumers of an API, utility functions, or library.

## The Subtle Pitfall of Implicit Returns

Consider a function that looks innocent enough:

```typescript
function getUserStatus(lastLogin: Date) {
  const daysSinceLogin =
    (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLogin < 7) {
    return "active";
  }

  if (daysSinceLogin < 30) {
    return "inactive";
  }
}
```

At first glance, this function seems fine. But there's a hidden problem: if the conditions aren't met, the function will implicitly return `undefined`. This can lead to runtime errors that may be difficult to track down. Also, instead of TypeScript raising an error right at the function definition, the error would only be raised at the call site.

You can understand how this could be frustrating for developers using your code. So how would explicit return types help here?

## The Magic of Explicit Return Types

By adding an explicit return type, TypeScript will raise the red flag immediately at the function definition:

```typescript
function getUserStatus(lastLogin: Date): "active" | "inactive" | "dormant" {
  const daysSinceLogin =
    (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLogin < 7) {
    return "active";
  }

  if (daysSinceLogin < 30) {
    return "inactive";
  }
}
```

If you [enter this code into the TypeScript Playground](https://www.typescriptlang.org/play/#code/GYVwdgxgLglg9mABAcwKZQKoGdUCcDKUAhlCFgBQA2RWUAMnMjGAFyIAiJqAlGwERFoMAG6o+iAD6I+zQbFHipfACZxcAWyJgo4gN4AoRIggJaiZUQCeWfMwioGTJAF5DRxOU5RUAOjBwAd3JuRABaRGpaR2YfNCgAFRh1VGCQgHoPAEYABlzEACpEADZsguLSwoAmABZuAG59NxhgDwtrW0gHRmZEAB5EAHYQg3dEXHQQXCQBIQUGowBfRqNm1qsbOy6nPsQAZmzhtyNx0inpWVmxecQlhaA), you will immediately be presented with an error:

> Function lacks ending return statement and return type does not include 'undefined'.

You as the author of this function can now be proactive in addressing this _before_ it becomes a problem.

```typescript
function getUserStatus(lastLogin: Date): "active" | "inactive" | "dormant" {
  const daysSinceLogin =
    (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLogin < 7) {
    return "active";
  }

  if (daysSinceLogin < 30) {
    return "inactive";
  }

  return "dormant";
}
```

## Why This Matters

The benefits are immediate and powerful:

1. **Early Error Detection**: TypeScript will highlight the issue at the function definition, not at the call site.

2. **Forced Completeness**: By specifying a return type, you're essentially creating a contract that your function must fulfill. TypeScript becomes your code reviewer, ensuring you handle all possible scenarios.

3. **Improved Code Readability**: Explicit return types serve as documentation. They clearly communicate what a function is expected to return.

## Credit Where It's Due

This approach was inspired by a lesson from [Mike North's TypeScript course on Frontend Masters](https://frontendmasters.com/courses/typescript-v4/). It's a testament to how small, intentional typing choices can significantly improve code quality and usability.

## Conclusion

Defining explicit return types is more than just a TypeScript feature; it encourages you to think through all possible code paths, make your intentions clear, and catch potential issues before they become pain points. I hope you found this helpful and that you will find use this to make your functions more resilient. Happy coding! 🚀
