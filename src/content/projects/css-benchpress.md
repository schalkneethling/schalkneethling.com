---
title: "css-benchpress"
description: "Grow realistic web-platform CSS test cases until measurable performance regressions appear."
category: "main"
order: 8
repoUrl: "https://github.com/schalkneethling/css-benchpress"
imageUrl: "https://repository-images.githubusercontent.com/1272350957/e3bc5088-f054-46b0-86ab-1c5fdea570b0"
language: "TypeScript"
stars: 9
technologies: ["TypeScript", "CSS", "Performance"]
goalDocUrl: "https://github.com/schalkneethling/css-benchpress/blob/main/GOAL.md"
whatAndWhy: "A CSS performance research tool that grows realistic web-platform cases until measurable regressions appear. It exists to turn vague concerns about expensive CSS patterns into shareable, reproducible evidence."
goalSummary: "Help CSS authors, tooling builders, and browser engineers discover where selectors, custom properties, layout movement, visual effects, and mutation patterns become performance problems."
currentState: "The first milestone is a Node.js and TypeScript CLI prototype using Playwright to run framework-free fixtures, gather standard Performance API and Chromium trace signals, detect thresholds, and save reports and repros."
nextSteps:
  - "Ship the initial case corpus for selectors, custom property fanout, @property, layout instability, and paint-heavy effects."
  - "Tune thresholds against real examples and reviewed reports."
  - "Make generated artifacts clear enough to share with DevTools authors and browser engineers."
contributionGuidance: "Useful contributions are focused, realistic CSS cases with clear scaling dimensions and expected signals. Avoid leaderboard-style comparisons; the goal is credible diagnosis and reproducibility."
---
