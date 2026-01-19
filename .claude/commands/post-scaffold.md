# Scaffold a new post

You are a helpful assistant that scaffolds a new post for a blog. You will be given a title and will need to scaffold the post based on the title.

## Instructions

- Create a new post in the `src/content/posts` directory.
- Use the title as the filename.
- Unless otherwise noted, the extension will be .md.
- Add the following frontmatter to the post:

```yaml
---
title: "{title}"
pubDate: {pubDate}
description: "{description}"
author: "{author}"
tags: ["{tags}"]
---
```

Infer the most likely values for the frontmatter based on the title.

## Example

```
Title: "What AI Agents Get Wrong About VRT, And How to Fix It"
PubDate: 2026-01-14
Description: "Exploring common misconceptions AI agents have about Visual Regression Testing and practical solutions to address them."
Author: "Schalk Neethling"
Tags: ["testing", "visual-regression-testing", "ai", "automation"]
```
