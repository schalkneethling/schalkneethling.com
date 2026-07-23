---
title: "Instantly Get Feature Specific Baseline Component Embed Code"
pubDate: 2026-07-07
description: Search the web-features catalog, preview the baseline-status component, and generate the CDN or bundler snippet, all from one small web app.
author: Schalk Neethling
tags: ["tools"]
standardSite:
  publish: true
---

Adding the [`<baseline-status>`](https://github.com/web-platform-dx/baseline-status) web component to a page starts with one required attribute: `featureId`. The value has to match an identifier from the [web-features](https://github.com/web-platform-dx/web-features) catalog, and finding the correct identifier has usually meant one of a few routes: browsing the `features` directory in the web-features repository, opening [webstatus.dev](https://webstatus.dev/) and reading the identifier off the end of the URL, or doing the same on the [web features explorer](https://web-platform-dx.github.io/web-features-explorer/), which also puts a Copy ID button directly on each feature's page.

Now that you have the `featureId`, how do you embed the `<baseline-status>` component on your page? The baseline-status component affords two ways to bring it into a page: install the `baseline-status` package and bundle it with the rest of the application, or load a precompiled build from a CDN such as jsDelivr.

[Get Baseline](https://get-baseline.schalkneethling.com) aims to take the guesswork out of embedding the `<baseline-status>` component on your page. Typing a feature name, a CSS property, or a JavaScript API returns the matching entries from the web-features catalog, along with the identifier attached to each one. Choose the feature you are documenting and a live preview renders the real `<baseline-status>` component.

Next, choose whether you need just the web component code or the full source alongside it. Then choose CDN or a bundler. Copy the code snippet to your page and you're good to go.

Get Baseline queries the web-features catalog directly for the search results and identifiers, and the preview renders the real baseline-status component, what-you-see-is-what-you-will-get. I hope this makes it a little easier for people to get started with the baseline-status component and that we will see these everywhere the web, and your projects, are written about.

## Further Reading

- [web-features on GitHub](https://github.com/web-platform-dx/web-features)
- [baseline-status web component](https://github.com/web-platform-dx/baseline-status)
- [webstatus.dev](https://webstatus.dev/)
- [Web features explorer](https://web-platform-dx.github.io/web-features-explorer/)
- [Baseline on web.dev](https://web.dev/baseline)
