---
title: "Dynamically enable and disable map scroll wheel zoom with Leaflet.js"
pubDate: 2026-02-07
description: "Learn how to programmatically require the presence of a modifier key to enable scroll wheel zoom support in Leaflet maps."
author: "Schalk Neethling"
tags: ["javascript"]
---

At [Factorial GmbH](https://factorial.io), I recently worked on a search interface with an interesting layout challenge. Search results appeared on the left in a scrollable container, while a sticky [Leaflet map](https://leafletjs.com) occupied the right side filling the remaining horizontal viewport space.

The problem?

If you wanted to scroll past the search UI, you were faced with a bit of a challenge. Because the map will automatically zoom in and out when using the mouse's scroll wheel, you must scroll to the end of the scroll container in order to reach additional content further down the page. This is not a great user experience.

The ideal solution seemed straightforward: only zoom the map when users hold Ctrl (or Cmd on Mac) while scrolling, just like Google Maps does. Unfortunately, Leaflet's API and documentation don't cover this specific use case. The `scrollWheelZoom` option is either on or off.

After digging into the Leaflet API some more, I discovered that maps expose handlers [through the Handler class](https://leafletjs.com/reference.html#handler). One of these handlers is `scrollWheelZoom`, and handlers have `enable()` and `disable()` methods you can call dynamically. This opened up a solution: listen for wheel events and toggle zoom based on whether a modifier key is pressed.

First, initialize the map with scroll wheel zoom disabled:

```javascript
const map = L.map(container, {
  scrollWheelZoom: false,
});
```

Then add the event listener to take control:

```javascript
map.getContainer().addEventListener("wheel", (event) => {
  if (event.ctrlKey || event.metaKey) {
    if (!map.scrollWheelZoom.enabled()) {
      map.scrollWheelZoom.enable();
    }
  } else {
    if (map.scrollWheelZoom.enabled()) {
      map.scrollWheelZoom.disable();
    }
  }
});
```

We attach a wheel event listener to the map container, check whether Ctrl or Cmd is held down, and enable or disable the scroll zoom handler accordingly. The conditional checks prevent unnecessary enable/disable calls when the handler is already in the correct state.

This pattern gives you fine-grained control over Leaflet's `scrollWheelZoom` behavior. While the library doesn't document modifier-key-based zooming, the Handler API provides the building blocks to implement it yourself. The same approach works for other Leaflet handlers like dragging or keyboard controls when you need conditional behavior based on user input.
