---
title: "refined-plan-mode"
description: "A local web app for reviewing AI coding-agent plans with anchored feedback."
category: "main"
order: 13
repoUrl: "https://github.com/schalkneethling/refined-plan-mode"
imageUrl: "https://opengraph.githubassets.com/29924b3161f878801383457c29b92083fb0ae345ba4523d6ffb9f984940cbb3c/schalkneethling/refined-plan-mode"
language: "TypeScript"
stars: 3
technologies: ["TypeScript", "AI Agents", "Review Tools"]
goalDocUrl: "https://github.com/schalkneethling/refined-plan-mode/blob/main/GOAL.md"
whatAndWhy: "A local review app and protocol for AI coding-agent plans. It exists because long plans need the same kind of anchored, reviewable feedback loop that pull requests give code."
goalSummary: "Turn agent plans into versioned local artifacts with browser-based line, range, and text-selection comments, structured feedback files, and an explicit approval gate before implementation."
currentState: "The MVP can read versioned Markdown plans, render them in a browser reviewer, persist draft comments, submit JSON feedback, and mark a plan approved through the .plan-review file convention."
nextSteps:
  - "Solidify the local review loop around versioned plans, anchored comments, JSON feedback, and approval."
  - "Make the reviewer UI faster and more natural for repeated plan review."
  - "Keep Codex, Claude Code, and future harness integrations behaviorally consistent around the same file protocol."
contributionGuidance: "Useful contributions improve the local file protocol, reviewer ergonomics, harness instructions, and tests around plan review state transitions. Keep the workflow local-first and easy to recover by reading files."
---
