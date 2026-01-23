---
title: "Exporting Algolia Indices to JSON: Skip the Custom Scripts"
pubDate: 2026-01-23
description: "Export your Algolia search indices to JSON without building custom export scripts using the Algolia CLI."
author: "Schalk Neethling"
tags: ["algolia", "tooling"]
---

I needed to export an Algolia index as JSON to use as test fixtures. Real data makes for the best test data, and I figured this would be straightforward. It wasn't, at least not in the way I expected.

My first stop was the Algolia dashboard. No export button, no download option, nothing obvious. A quick search and some prompting of ChatGPT ( I was in between tokens with Claude) yielded a mix of dead ends and overcomplicated solutions. One suggestion was an npm package called `algolia-export` that required my Admin API key. Red flag. The package also appeared to be abandonware, if it ever existed at all.

The other common suggestion was to write a custom utility using [Algolia's Browse API](https://www.algolia.com/doc/libraries/sdk/methods/search/browse). While that would work, it felt like unnecessary yak shaving when all I wanted was a simple data dump. There had to be a better way.

One last check of the Algolia documentation revealed the obvious answer: they have a CLI. Of course they do. And while it doesn't have an explicit "export" command, a pipe is all we need.

After [installing the CLI](https://www.algolia.com/doc/tools/cli/get-started#install-the-algolia-cli) and [setting up a profile](https://www.algolia.com/doc/tools/cli/authentication#profiles) (which takes less than a minute), the Browse API is available as a command:

```bash
algolia objects browse [index-name]
```

This dumps your entire index to standard output. If you've got a massive index, you might want to take a pause before pressing enter, but for most use cases it works perfectly. Since it outputs to stdout, you can pipe it anywhere you need:

```bash
algolia objects browse [index-name] > index.json
```

Done. You've got your index as JSON, ready to use as test fixtures or for whatever else you need. The CLI also supports various flags to filter results, limit records (looking at you big index), or specify attributes, so you can [fine-tune the output](https://www.algolia.com/doc/tools/cli/commands/objects/browse#examples) without writing any code.

The lesson here is the same one I keep relearning: check the official tooling before reaching for custom solutions. The Algolia CLI is well-documented, actively maintained, and handles authentication properly. It turned what could have been an hour of scripting into a 30-second command.

If you're working with Algolia and need to pull data locally, skip the custom scripts and go straight for the [Algolia CLI](https://www.algolia.com/doc/tools/cli/get-started). Your future self will thank you.
