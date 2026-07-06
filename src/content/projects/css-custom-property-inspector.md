---
title: "css-custom-property-inspector"
description: "A VS Code extension that shows CSS custom property values, definitions, and resolved references on hover."
category: "main"
order: 9
repoUrl: "https://github.com/schalkneethling/css-custom-property-inspector"
imageUrl: "https://opengraph.githubassets.com/8ee606d555f413fb3414dff7e8d8280ae7ffc9305fc38d5e353e2d5ecf86a707/schalkneethling/css-custom-property-inspector"
language: "TypeScript"
stars: 0
technologies: ["TypeScript", "VS Code", "CSS"]
whatAndWhy: "A VS Code-compatible extension for inspecting CSS custom properties from the editor. It exists because design-token systems are easier to maintain when authors can see values, definitions, fallbacks, and reference chains without manually searching a workspace."
goalSummary: "Give CSS, SCSS, Less, and HTML authors useful hover feedback for custom property definitions, resolved var() chains, color swatches, selector context, and clickable source locations."
currentState: "The extension scans workspace stylesheets and HTML style blocks, keeps an index fresh through file watching, and exposes configurable hover behavior for resolved values, depth, include types, excludes, and file links."
nextSteps:
  - "Add a project GOAL.md so the long-term editor-tooling direction is captured outside the README."
  - "Expand real-workspace test coverage around nested references, media-query context, and fallback handling."
  - "Clarify compatibility and release expectations for VS Code, VS Codium, Cursor, and Windsurf users."
contributionGuidance: "Strong contributions include reproducible CSS workspaces, hover-output expectations, and fixes that keep indexing accurate without making editor feedback noisy."
---
