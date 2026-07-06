---
title: "css-property-type-validator"
description: "Standalone tooling for validating CSS custom property registrations declared with @property."
category: "main"
order: 6
repoUrl: "https://github.com/schalkneethling/css-property-type-validator"
imageUrl: "https://repository-images.githubusercontent.com/1198765576/0966a7fe-ab8b-4e6d-997e-5dbb136ff80d"
liveUrl: "https://typedcss-validator.schalkneethling.com"
language: "TypeScript"
stars: 10
technologies: ["TypeScript", "CSS", "Tooling"]
goalDocUrl: "https://github.com/schalkneethling/css-property-type-validator/blob/main/GOAL.md"
roadmapDocUrl: "https://github.com/schalkneethling/css-property-type-validator/blob/main/ROADMAP.md"
whatAndWhy: "A validator for typed CSS custom properties and @property registrations. It exists because invalid registrations and incompatible var() usage can silently change rendered output, especially in token-heavy systems."
goalSummary: "Make typed custom properties easier to adopt by catching invalid @property descriptors, incompatible assignments, and risky var() usage through a shared validation core that can power a CLI, Stylelint plugin, editor tooling, and a browser UI."
currentState: "The core validates registrations, direct assignments, multiple registered var() usages, simple fallback branches, imported registries, and a first beta Stylelint plugin."
nextSteps:
  - "Improve support for whitespace and fallback-toggle custom property patterns."
  - "Add clearer remediation context to diagnostics."
  - "Harden Stylelint beta behavior through real-project feedback and config-file based registry discovery."
contributionGuidance: "The best contributions include reduced CSS examples, expected diagnostics, and tests against the shared core. Keep behavior conservative and prefer skipping uncertain cases over noisy false positives."
---
