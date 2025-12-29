---
title: Watched It - The Good, The Bad, and The Web Components - Zach Leatherman
pubDate: 2024-07-31
description: "My takeaways from Zach Leatherman's talk on web components at the 2023 JSHeroes conference."
author: "Schalk Neethling"
tags: ["watched-it"]
---

I watched a great talk by [Zach Leatherman](https://www.zachleat.com/) on web components and thought I would share some of my key takeaways.

> You can find [his talk on web components on YouTube](https://www.youtube.com/watch?v=R4Ri4ft7bXY).

The talk was given at JSHeros in May 2023 and in about 24 minutes, Zach gives us a great overview of the state of web components, the good, the bad, and the parts that still needs some work.

There are essentially three ways to write web components:

- LightDOM (Zach does not really use the term) aka Custom elements with the HTML nested directly inside them and almost no JavaScript required.
- Shadow DOM, where almost nothing is in the HTML and you rely on JavaScript to render the content of the custom element.
- Declaritive ShadowDOM which is a mix of the first two.

For each of these Zach asks a couple of questions:

- Is it server rendered, client rendered, or perhaps a little bit of both?
- Do we need a library?
- Do we get encapsulation?
- Do we need to repeat ourselves?
- Is there a likelyhood of a flash of unstyled content (FOUC) causing layout shift?

As with most things, none of these check all the boxes and each has its own trade-offs.

Zach ends the talk by acknowledging that web components still needs some help from libraries built on top of the core of web components to fill the gaps. One positive that has changed since Zach's talk is that, at the time, React was stilla hold out on supporting web components, but since the announcement of React 19, this is no longer the case.

There are also some great libraries that takes a web component first approach such as [Enhance.dev](https://enhance.dev/) and [Zach's own Web-C that is part of 11ty](https://www.11ty.dev/docs/languages/webc/). Outisde of this, there are two great libraries that improves on the web components standard namely [Lit](https://lit.dev/) and [Stencil](https://stenciljs.com/).

Although not mentioned in the talk, there is another great [library called Shoelace](https://shoelace.style/) that is well worth checking out.

You can see the state of interopreability between web components and the various libraries on [custom-elements-everywhere.com](https://custom-elements-everywhere.com/), and join in on a very active discussion as part of the standards process on the [Web Incubator Community Group](https://github.com/WICG) and specifically the GitHub issue, [\[declarative-custom-elements\] Capabilities needed and open questions](https://github.com/wicg/webcomponents/issues/1009).

I am super excited to be part of the evolution of web components and at [Factorial (where I work)](https://www.factorial.io/en) we are currently trailing the adoption of web component on large client projects. I will share more on this in a follow up post.
