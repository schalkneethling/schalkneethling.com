---
title: "css-media-pseudo-polyfill"
description: "A CSS polyfill for media pseudo-classes such as :playing, :paused, :seeking, and :muted."
category: "main"
order: 11
repoUrl: "https://github.com/schalkneethling/css-media-pseudo-polyfill"
imageUrl: "https://opengraph.githubassets.com/3e4f3b4145c5fce35fd49cf5f9b83806101eee6f02b2a6b937511bcdf1de65fc/schalkneethling/css-media-pseudo-polyfill"
language: "TypeScript"
stars: 3
technologies: ["TypeScript", "CSS", "Polyfill"]
whatAndWhy: "A progressive polyfill for media state pseudo-classes such as :playing, :paused, :seeking, :buffering, :stalled, and :muted. It exists so authors can write state-driven media styles now while browsers continue filling support gaps."
goalSummary: "Detect unsupported media pseudo-classes, preserve authored cascade intent by rewriting CSS into specificity-equivalent class selectors, and update audio and video elements as their playback state changes."
currentState: "The package supports per-pseudo-class feature detection, inline and same-origin linked stylesheet rewriting, MutationObserver-based media discovery, pure state computation, and explicit handling for non-polyfillable :volume-locked."
nextSteps:
  - "Add GOAL.md and ROADMAP.md so the polyfill scope and future removal path are captured outside the README."
  - "Keep tests focused on CSS rewriting, state computation, same-origin stylesheet behavior, and dynamic media elements."
  - "Document browser support and FOUC tradeoffs as native media pseudo-class support changes."
contributionGuidance: "Helpful contributions include reduced browser cases, css-tree rewriting tests, and media-state edge cases. Keep the polyfill progressive and avoid expanding into behavior the DOM cannot observe."
---
