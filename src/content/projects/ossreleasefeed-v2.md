---
title: "ossreleasefeed-v2"
description: "Create custom RSS release feeds for GitHub topic repositories or starred projects."
category: "main"
order: 2
repoUrl: "https://github.com/schalkneethling/ossreleasefeed-v2"
language: "TypeScript"
stars: 0
technologies: ["TypeScript", "RSS", "GitHub"]
whatAndWhy: "OSSReleaseFeed creates permanent feed URLs for GitHub release activity, without asking people to create an account or connect OAuth. It is for the person who still wants the quiet reliability of a feed reader when tracking open source releases."
goalSummary: "Provide lightweight Atom and JSON feeds for repositories discovered through GitHub topics or a user's starred projects, keeping the public surface simple: configure preferences, keep the URL, read releases wherever you already read feeds."
currentState: "The rewrite is under active development and is not yet in public beta. The planned stack combines a React/Vite frontend with a Cloudflare Worker backend built with Hono, Effect, and TypeScript."
nextSteps:
  - "Ship the first public beta once the feed-generation path is stable."
  - "Harden topic and starred-repository feed behavior before inviting broad usage."
  - "Add project docs that can feed the longer public project page without making builds depend on GitHub."
contributionGuidance: "The repository is not open for outside contributions yet. For now, the useful way to engage is to watch the repo, follow issues as they appear, and try the beta once it is announced."
---
