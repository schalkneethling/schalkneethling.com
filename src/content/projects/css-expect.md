---
title: "css-expect"
description: "Write browser-native expectations for CSS custom functions and mixins."
category: "main"
order: 5
repoUrl: "https://github.com/schalkneethling/css-expect"
imageUrl: "https://repository-images.githubusercontent.com/1258634645/be6e459a-0cd5-47db-b6bb-d4b1789638d6"
language: "TypeScript"
stars: 4
technologies: ["TypeScript", "CSS", "Testing"]
goalDocUrl: "https://github.com/schalkneethling/css-expect/blob/main/GOAL.md"
whatAndWhy: "A small browser-backed expectation library for CSS custom functions, and eventually native CSS mixins. It exists because emerging CSS logic should be tested by the browser that computes it, not by a JavaScript reimplementation guessing at CSS semantics."
goalSummary: "Make it practical to write trustworthy tests for native CSS custom functions by loading CSS, applying a real property context, reading computed values, and returning diagnostics that explain browser support and expectation failures."
currentState: "The project is focused on proving the custom-function API against current Chromium support, with Playwright as the browser automation layer and a conservative package surface for early adopters."
nextSteps:
  - "Keep README examples and generated diagnostics aligned with the shipped API."
  - "Validate behavior when target CSS features are unsupported and make skip-or-fail policies clear."
  - "Prepare the package for a careful first public release."
contributionGuidance: "Useful contributions are browser-backed test cases, clearer diagnostics, and examples that show real custom-function usage. Avoid adding broad runner integrations until the core API has settled."
---
