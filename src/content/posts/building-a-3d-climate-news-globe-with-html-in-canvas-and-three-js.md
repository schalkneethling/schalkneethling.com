---
title: "Building a 3D Climate News Globe with HTML in Canvas and Three.js"
pubDate: 2026-04-20
description: "A deep dive into Blue Earth, an experiment that plots positive climate news stories on a rotating 3D globe using the HTML in Canvas API, Three.js, and a build-time pipeline powered by Claude and Geoapify."
author: "Schalk Neethling"
tags: ["javascript", "html"]
---

There is a new proposal making its way through the [Web Incubator Community Group (WICG)](https://github.com/WICG/html-in-canvas) that caught my attention the moment I read about it: HTML in Canvas. The idea is deceptively simple. What if you could render real, interactive, fully styled HTML elements _inside_ a `<canvas>` — including WebGL and WebGPU contexts — while keeping them in the DOM for accessibility, hit testing, and keyboard interaction?

I wanted to understand what building something real with this API feels like. Not a demo with a spinning cube, but something with enough moving parts to surface both the power and the rough edges. The result is [Blue Earth](https://blue-earth.schalkneethling.com/), an experiment that presents positive climate news stories on a rotating 3D globe, rendered with [Three.js](https://threejs.org/) using NASA's city lights texture. As stories drip into the feed, a marker is plotted on the globe at the location the story is about. The globe rotates to bring the marker into focus. Click on it, and a card opens with the publisher, publication date, headline, summary, and a link to the full story.

Those cards are pure HTML. Semantic `<article>` elements with headings, paragraphs, a `<time>` element, and a link. They are focusable, respond to both click and keyboard interaction, and the text is selectable — as one would expect from any HTML content. At the same time, because they live inside the canvas, they interplay with the 3D scene. As a user rotates the globe, a card can move behind it, tilt, and reposition itself based on the rotation. Pretty dang cool.

The full source is available on [GitHub](https://github.com/schalkneethling/blue-earth).

## The HTML in Canvas API

Before diving into the project, it is worth understanding the three primitives that make up this API.

The first is the `layoutsubtree` attribute. Adding it to a `<canvas>` element opts its descendants into layout and hit testing. From the [specification](https://github.com/WICG/html-in-canvas#1-the-layoutsubtree-attribute):

> The `layoutsubtree` attribute on a `<canvas>` element opts in canvas descendants to have layout and participate in hit testing. It causes the direct children of the `<canvas>` to have a stacking context, become a containing block for all descendants, and have paint containment.

The children are laid out by the browser but are not painted to the screen until they are explicitly drawn into the canvas.

The second primitive is a set of drawing methods. For 2D contexts there is `drawElementImage()`, for WebGL there is `texElementImage2D()`, and for WebGPU there is `copyElementImageToTexture()`. The 2D method renders a child element into the canvas and returns a transform that can be applied back to the element so its DOM position stays in sync with its drawn position. The WebGL and WebGPU methods work similarly but do not return a transform directly — you use the separate `getElementTransform()` helper on the canvas to achieve the same synchronisation. This is what keeps hit testing, accessibility, and intersection observers working.

The third is the `paint` event. It fires whenever a canvas child's rendering changes, giving you an efficient callback to redraw only what has changed. There is also a `requestPaint()` method for cases where you need to force an update every frame.

This is currently an experimental API behind a flag in Chrome Canary. You can enable it at `chrome://flags/#canvas-draw-element`. There is no implementation announced for Firefox or Safari at the time of writing.

Blue Earth uses feature detection to check for support and show an appropriate message when the API is not available:

```javascript
const supportsHtmlInCanvas =
  "requestPaint" in HTMLCanvasElement.prototype &&
  "texElementImage2D" in WebGLRenderingContext.prototype;
```

## The pipeline

Blue Earth is not a live feed. The stories are prepared via a build-time pipeline that runs before deployment using `vp run pipeline:build`. There are several steps to this pipeline, and each one filters the data a little further.

### Collecting stories

The first step is to collect stories from a curated list of climate-focused sources: [Positive News](https://www.positive.news/), [Carbon Brief](https://www.carbonbrief.org/), [Yale Environment 360](https://e360.yale.edu/), [Inside Climate News](https://insideclimatenews.org/), [Grist](https://grist.org/), [Yale Climate Connections](https://yaleclimateconnections.org/), and [Climate Home News](https://www.climatechangenews.com/). These are all consumed via RSS feeds. Stories from [The Guardian](https://www.theguardian.com/) are pulled using their open API. A list of keywords and negative keywords is used to filter articles for relevance.

At the moment, the RSS feed parsing is a bit manual and would benefit from switching to a proper XML parser, but the focus of the experiment was on proving the concept rather than solidifying the infrastructure.

The collected stories are written to `fetched-stories.json`.

### Extracting locations with Claude

With the stories collected, the next challenge is determining _where_ each story is about. A headline like "Zambia Under Pressure to Clean Up Shuttered Lead Mine Poisoning Town" clearly refers to a place, but extracting that programmatically from free-form text is not trivial.

To solve this, each story is sent to [Claude](https://www.anthropic.com/claude) (using the Haiku model) with a prompt that asks it to extract the primary geographic location:

```javascript
body: JSON.stringify({
  model,
  max_tokens: 256,
  messages: [
    {
      role: "user",
      content: `Given this news article title and summary, extract the primary geographic location where the described climate action is taking place.

Return ONLY valid JSON in this exact shape:
{
  "place": "city or region name",
  "country": "country name",
  "confidence": "high | medium | low",
  "reason": "brief explanation of where in the text this came from"
}

Return ONLY raw JSON.
Do not wrap the response in Markdown.
Do not use code fences.
Do not add any explanatory text before or after the JSON.

If no clear location can be determined, return: { "place": null }

Title: ${story.title}
Summary: ${story.summary}`,
    },
  ],
}),
```

The prompt is deliberately verbose. The repeated instructions about returning only raw JSON without Markdown formatting or code fences are necessary because, without them, the model will occasionally wrap the response in a way that breaks `JSON.parse()`.

The response is filtered to remove any stories where `place` is `null` or the confidence is `low`. The remaining stories are written to `extracted-stories.json`.

### Geocoding with Geoapify

At this point, we know the _name_ of each place but not its coordinates. To plot a story on a globe, we need latitude and longitude. For this, Blue Earth uses [Geoapify's forward geocoding API](https://www.geoapify.com/geocoding-api/).

The API returns results ranked by confidence. We take the first result from the response — the one with the highest confidence — but still check it against a threshold of `0.6`. Any match that falls below this is filtered out.

The geocoded stories are written to `geocoded-stories.json`. One final pass assigns each story a unique ID (used to reference the corresponding `<article>` element) and groups related articles by shared tags. The pipeline also records the date at which the JSON was generated.

Here is what a single entry in the final `stories.json` looks like:

```json
{
  "id": "story-005-zambia-under-pressure-to-clean-up-shuttered-lead",
  "title": "Zambia Under Pressure to Clean Up Shuttered Lead Mine Poisoning Town",
  "summary": "Three decades after one of the largest lead mines in the world closed down...",
  "url": "https://e360.yale.edu/digest/zambia-kabwe-mine",
  "source": "Yale Environment 360",
  "publishedAt": "2026-04-17T13:10:00.000Z",
  "relatedIds": [],
  "location": {
    "placeName": "Kabwe, Central Province, Zambia",
    "lat": -14.4434056,
    "lng": 28.4465166,
    "resultType": "city",
    "confidence": 1
  }
}
```

## The globe

If we are in a supporting browser, the bootstrap loads the stories and initialises the scene. Before doing so, it checks `prefers-reduced-motion` to respect the user's motion preferences.

The 3D globe itself is built with [Three.js](https://threejs.org/). Cards on the table: I had a lot of help from [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) here. I directed it in terms of what I needed, tested the results, provided feedback, and iterated until we landed on the look and interaction I was after. Having read over the code for the globe afterwards, I was struck by how surprisingly approachable Three.js is. Something that looks and feels this rich is built with relatively straightforward code.

### Plotting markers

Within the scene, a `MarkerField` class uses the latitude and longitude from the pipeline to plot each story's location on the globe:

```javascript
const mesh = new Mesh(geometry, material.clone());
mesh.position.copy(
  latLngToVector3(story.location.lat, story.location.lng, GLOBE_RADIUS * 1.008),
);
```

Because this is not a live feed, stories are slowly added to the queue with a pulse window of around eight seconds:

```javascript
const FEED_INTERVAL_MS = 8_000;
```

### The card pool

The story cards are managed by a `CardPool` class. Rather than appending all stories to the canvas at once or constantly adding and removing `<article>` elements, the pool is initialised with five cards. These are then recycled via a `populateCard` function that updates the content of an existing card element:

```javascript
private populateCard(element: HTMLElement, story: Story | null) {
  const source = element.querySelector<HTMLElement>(".story-card__source");
  const date = element.querySelector<HTMLTimeElement>(".story-card__date");
  const title = element.querySelector<HTMLElement>(".story-card__title");
  const summary = element.querySelector<HTMLElement>(".story-card__summary");
  const place = element.querySelector<HTMLElement>(".story-card__place");
  const link = element.querySelector<HTMLAnchorElement>(".story-card__link");

  if (
    source === null ||
    date === null ||
    title === null ||
    summary === null ||
    place === null ||
    link === null
  ) {
    throw new Error("Expected story card sub-elements to exist");
  }

  if (story === null) {
    element.dataset.url = "";
    source.textContent = "";
    date.textContent = "";
    date.dateTime = "";
    title.textContent = "";
    summary.textContent = "";
    place.textContent = "";
    link.href = "#";
    link.tabIndex = -1;
    return;
  }

  source.textContent = story.source;
  element.dataset.url = story.url;
  date.textContent = dateFormatter.format(new Date(story.publishedAt));
  date.dateTime = story.publishedAt;
  title.textContent = story.title;
  summary.textContent = story.summary;
  place.textContent = story.location.placeName;
  link.href = story.url;
  link.tabIndex = 0;
}
```

When a card is acquired, the pool first checks whether it already has a card for the given story ID and simply returns it. When a card is released, it is reset, pointer events are disabled, and it is moved completely off-canvas:

```javascript
entry.element.style.transform = "translate3d(-9999px, -9999px, 0) scale(1)";
```

### Picking markers

When a user clicks on the globe, the event coordinates are normalised and passed to a `pick` function on the `MarkerField`. This uses a Three.js `Raycaster` to find intersecting objects, looks for the first visible match, and retrieves the associated story:

```javascript
pick(pointer: Vector2, camera: Camera) {
  this.raycaster.setFromCamera(pointer, camera);

  const intersections = this.raycaster.intersectObjects(
    this.group.children,
    false,
  ) as Array<Intersection<Mesh>>;
  const match = intersections.find((entry) => entry.object.visible);
  const storyId = match?.object.userData.storyId as string | undefined;

  return storyId === undefined
    ? null
    : (this.markerMap.get(storyId)?.story ?? null);
}
```

If a story is found, the position of the corresponding marker is retrieved and the card pool's `toggle` method is called. If the user clicks the same marker that is already open, the card closes. Otherwise, a new card opens:

```javascript
toggle(story: Story, anchor: Vector3) {
  if (this.activeCard?.storyId === story.id) {
    this.close();
    return;
  }

  this.open(story, anchor);
}
```

There is quite a bit more happening in the interaction layer — rotation tracking, card positioning, tilt calculations — but the source code is available on [GitHub](https://github.com/schalkneethling/blue-earth) for those who want to dig deeper.

## What is next

At the moment, all of the HTML except for a very minimal shell is built in JavaScript. Now that the experiment is working, one of the improvements I want to make is to move more of the markup to the light DOM and explore using [Lit](https://lit.dev/) for the parts that need to remain dynamic, with a custom element pattern for the overall implementation.

There are also pipeline improvements to consider: switching to a proper XML parser for the RSS feeds, pre-computing some of the metadata that is currently derived at runtime (such as the country list and related story counts), and potentially expanding the list of sources.

## Wrapping up

When I got the idea for Blue Earth, I honestly did not think it would be possible. At the very least, I thought that the interaction between Three.js and native HTML elements would seem clunky and not feel quite natural. I was blown away when I saw how natural and well everything worked in the end, using a single `canvas` element. I am just starting to understand and experiment with the HTML in Canvas API, but from my initial exploration, it opens doors to experiences on the web that would either not have been possible before, be almost entirely inaccessible, or be so resource-heavy that it would not make sense for many real-world scenarios.

I am excited to see how this specification evolves, and hope to see other browser makers jump in, participate, and start implementing the API. In order for this to happen, though, we, the web developer community, need to send out signals to show that we want and need this to be part of the platform.

So, try it yourself, enable the flag at `chrome://flags/#canvas-draw-element` in Chrome Canary, and have a look at the [WICG explainer](https://github.com/WICG/html-in-canvas) and the [specification](https://wicg.github.io/html-in-canvas/). There is also a growing list of [community demos](https://github.com/GoogleChromeLabs/css-web-ui-demos/blob/main/html-in-canvas/awesome-html-in-canvas.md) worth exploring for inspiration. Go ahead and build something and share it with the wider community. We all cannot wait to see what you make.

## Further reading

- [WICG HTML in Canvas explainer](https://github.com/WICG/html-in-canvas)
- [HTML in Canvas specification](https://wicg.github.io/html-in-canvas/)
- [Awesome HTML-in-Canvas community demos](https://github.com/GoogleChromeLabs/css-web-ui-demos/blob/main/html-in-canvas/awesome-html-in-canvas.md)
- [Three.js documentation](https://threejs.org/docs/)
- [Geoapify Forward Geocoding API](https://apidocs.geoapify.com/docs/geocoding/forward-geocoding/)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Blue Earth source code](https://github.com/schalkneethling/blue-earth)
- [Blue Earth live demo](https://blue-earth.schalkneethling.com/)
