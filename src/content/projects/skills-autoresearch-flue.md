---
title: "skills-autoresearch-flue"
description: "A Flue agent harness for autoresearching, evaluating, and improving agent skills."
category: "main"
order: 12
repoUrl: "https://github.com/schalkneethling/skills-autoresearch-flue"
imageUrl: "https://repository-images.githubusercontent.com/1229035215/462a7f1d-5fdf-4c7c-a6f6-ee53437a2a43"
language: "TypeScript"
stars: 12
technologies: ["TypeScript", "Agents", "Evaluation"]
goalDocUrl: "https://github.com/schalkneethling/skills-autoresearch-flue/blob/main/GOAL.md"
whatAndWhy: "A Flue-based research harness for deciding whether agent skills help, how much context they should contain, and when a model no longer needs them. It exists to make skill changes evidence-driven instead of vibes-driven."
goalSummary: "Run auditable eval loops across producer models, compare no-skill and skill-guided output, inspect scores and costs, and let a researcher agent propose the smallest useful skill change when guidance is justified."
currentState: "The alpha centers on a release-notes fixture with baseline import, optional research, producer evals, independent judging, score aggregation, cost summaries, and persisted artifacts."
nextSteps:
  - "Tighten resume and retry behavior without overwriting audit evidence."
  - "Keep documentation, examples, schemas, and fixture behavior aligned as the alpha loop changes."
  - "Explore cross-provider judging after the single-provider flow is stable enough for meaningful comparisons."
contributionGuidance: "Contributions should preserve researcher, producer, and judge separation. Favor small fixtures, schema-validated artifacts, and changes that make evidence easier to inspect by hand."
---
