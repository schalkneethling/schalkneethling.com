---
title: "masonry-gridlanes-wc"
description: "A light-DOM custom element for CSS Grid Lanes masonry with a JavaScript fallback."
category: "main"
order: 4
repoUrl: "https://github.com/schalkneethling/masonry-gridlanes-wc"
imageUrl: "https://opengraph.githubassets.com/69ce968cb624e4cde1f74edf54d4dd27c018a4ec1fb692a82b0672d0ed04bee6/schalkneethling/masonry-gridlanes-wc"
language: "JavaScript"
stars: 11
technologies: ["JavaScript", "Web Components", "CSS Grid"]
goalDocUrl: "https://github.com/schalkneethling/masonry-gridlanes-wc/blob/main/GOAL.md"
whatAndWhy: "A native-first Web Component for masonry layouts that tracks the emerging CSS Grid Lanes model. It exists to let real sites experiment with platform-shaped masonry today, while keeping markup and CSS close enough to future native support that removal stays realistic."
goalSummary: "Make CSS Grid Lanes masonry practical for production sites through a light-DOM custom element that prefers native support and offers a focused, spec-shaped JavaScript fallback where the platform is not ready yet."
currentState: "The package has a 0.1.x foundation with column masonry, row-mode experimentation, demos, Playwright coverage, and Pretext-powered helpers for text-heavy layouts."
nextSteps:
  - "Strengthen confidence in column masonry and text-heavy layouts through focused tests and demos."
  - "Improve row-mode behavior while keeping its constraints clear."
  - "Keep the fallback honest about what it supports instead of presenting it as a full CSS Grid Lanes polyfill."
contributionGuidance: "Good contributions are small behavior fixes, demo improvements, or tests that clarify native-vs-fallback expectations. Open an issue first when changing fallback layout behavior."
---
