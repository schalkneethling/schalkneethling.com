---
title: "Panozoom: The Accidental Web App"
pubDate: 2026-04-10
description: "What started as a question about a free macOS image viewer turned into a deep dive into pan and zoom math, pointer events, WheelEvent quirks, and a TypeScript web component. Here is everything we learned along the way."
author: "Schalk Neethling"
tags: ["javascript", "typescript"]
---

It started with the simplest possible question: is there a free macOS app where I can open an image and pan and zoom around it, like you would in Figma?

The answer turned out to be a single HTML file.

## The Accidental App

When I say the app was accidental, I mean that I had no intention of building one. I was looking for a tool. What followed was a reminder that the web platform is quietly capable of things that feel like they should require native code, a build pipeline, or at the very least a framework.

The first version was a standalone HTML file. No dependencies. No bundler. Open it in a browser, drop an image on it, and you have a Figma-style image viewer: scroll to zoom toward the cursor, drag to pan, keyboard shortcuts, a fit-to-viewport button.

What struck me immediately after building it was how little of the code was actually doing the interesting work. Strip away the toolbar button handlers, the keyboard shortcuts, the drag-and-drop wiring, and the CSS, and you are left with two small functions that do almost everything.

```javascript
function zoomAround(cursorX, cursorY, factor) {
  const newScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, state.scale * factor));
  const ratio = newScale / state.scale;

  state.tx = cursorX - ratio * (cursorX - state.tx);
  state.ty = cursorY - ratio * (cursorY - state.ty);
  state.scale = newScale;

  applyTransform();
}
```

```javascript
canvas.addEventListener("pointermove", (event) => {
  if (!pointerOrigin) return;

  const deltaX = event.clientX - pointerOrigin.x;
  const deltaY = event.clientY - pointerOrigin.y;

  state.tx = panStart.tx + deltaX;
  state.ty = panStart.ty + deltaY;

  applyTransform();
});
```

Pan is delta arithmetic. Zoom is a few lines of coordinate math. Everything else is scaffolding around those two ideas. Let us work through each one properly.

One thing worth clarifying before we go further: `canvas` throughout this post is a naming convention for the main container element — a plain `<div>` that acts as the interactive viewport. The [HTML `<canvas>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas) is not used anywhere in this app. The image is a regular `<img>` element, and all positioning is done with CSS transforms.

## Why Pointer Events Instead of Mouse Events

The implementation uses [pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) — `pointerdown`, `pointermove`, `pointerup`, `pointercancel` — rather than their mouse event equivalents. If you have not encountered pointer events before, this choice is worth understanding because it solves a real problem that mouse events handle awkwardly.

The classic approach to drag behaviour with mouse events looks like this:

```javascript
element.addEventListener("mousedown", (event) => {
  // drag started
});

document.addEventListener("mousemove", (event) => {
  // update position
});

document.addEventListener("mouseup", () => {
  // drag ended — remember to remove the listeners
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
});
```

Notice that `mousemove` and `mouseup` have to be attached to `document`, not to the element itself. If you attach them to the element, moving the pointer too quickly will take it outside the element's bounds, at which point the element stops receiving events and the drag breaks mid-gesture. Attaching to `document` is the workaround — but it means you are responsible for manually cleaning up those listeners when the drag ends, and forgetting to do so is a genuine source of bugs and memory leaks.

Pointer events solve this with [`setPointerCapture`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture):

```javascript
canvas.addEventListener("pointerdown", (event) => {
  canvas.setPointerCapture(event.pointerId);
  // ...
});
```

Calling `setPointerCapture` tells the browser: for the lifetime of this gesture, deliver all pointer events to this element, regardless of where the pointer physically is on the page. The canvas owns the pointer from `pointerdown` until the gesture ends. A fast pan that drifts the cursor into the toolbar, over a button, or even outside the browser window entirely will not break the drag, and will not accidentally trigger hover states or clicks on other elements.

The browser releases the capture automatically when `pointerup` or `pointercancel` fires — there is nothing to clean up manually. The listeners themselves stay on the canvas element where they belong, rather than being temporarily hoisted to `document`.

The secondary benefit of pointer events is that they provide a unified API across mouse, touch, and stylus input. A `pointerdown` fires whether the user clicked with a mouse, tapped with a finger, or pressed with a stylus. If you ever wanted this app to work on a touch device, panning via finger drag would work without any additional code.

## How Pan Works

Panning is the simpler of the two. When `pointerdown` fires, you record the pointer's current position as `pointerOrigin` and save the current translation as `panStart`. Then, on every `pointermove`, you calculate how far the pointer has moved from its origin and add that delta to the saved translation.

`deltaX` and `deltaY` use the `d` prefix by convention — borrowed from mathematics, where δ (delta) denotes a change in a value. `event.clientX - pointerOrigin.x` is simply "how far has the pointer moved horizontally since we started dragging".

The reason you save `panStart` rather than accumulating the delta incrementally is stability. If you added the delta to the current translation on every frame, floating point arithmetic would introduce drift over a long drag. Saving the translation at drag-start and always computing relative to that gives you a clean, stable result.

## The Coordinate System

Before the zoom math makes sense, it helps to understand the coordinate system everything lives in.

The CSS transform on the stage element uses `transform-origin: 0 0`, which pins the transform origin to the top-left corner of the stage. This means scale grows the image outward toward the bottom-right, and `tx`/`ty` (the translation values) describe exactly one thing: where is the top-left corner of the image, measured from the top-left corner of the canvas?

This makes the state extremely simple. At any moment, the entire position and size of the image is described by three numbers: `tx`, `ty`, and `scale`. There is no implicit centering to compensate for, no offset to account for. The scale grows from a known corner, and the translation moves that corner to wherever it needs to be.

The CSS is correspondingly minimal:

```css
.stage {
  position: absolute;
  inset-block-start: 0;
  inset-inline-start: 0;
  transform-origin: 0 0;
}
```

And the transform application:

```javascript
stage.style.transform = `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`;
```

Without the translation, `scale(2)` would double the image size with the top-left corner pinned to the canvas origin — the image would grow to the bottom-right. The translation is what lifts that corner and positions it wherever the math says it should be.

## How Zoom Works

This is the part worth sitting with. The goal of the zoom function is precise: after the scale changes, whatever pixel was under the cursor before the zoom should still be under the cursor after it. This is what gives the zoom its anchored, intuitive feel — you are zooming _into_ the point you are looking at, not toward some arbitrary centre.

To achieve this we need to know the cursor's position in canvas-local coordinates. The raw `event.clientX` is relative to the viewport, but the canvas does not start at the top-left of the viewport — it is offset by the toolbar. [getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect) gives us the canvas element's position within the viewport, and subtracting it converts the cursor position into canvas space:

```javascript
const rect = canvas.getBoundingClientRect();
const cursorX = event.clientX - rect.left;
const cursorY = event.clientY - rect.top;
```

In this particular layout, `rect.left` happens to be zero because the canvas spans the full width of the viewport — but using `getBoundingClientRect` for both axes is the right approach regardless. It makes the code robust to layout changes and keeps both axes symmetrical, which makes the intent clear.

Now, `cursorX - state.tx` is the horizontal distance from the left edge of the image to the cursor. Both values are measured from the same reference point (the canvas origin), so the subtraction is meaningful. If `tx` is 48 and `cursorX` is 400, the cursor is 352 pixels into the image horizontally.

The `ratio` is simply `newScale / state.scale` — by what factor did the scale just change? If you zoomed in 25%, `ratio` is `1.25`. If you zoomed out 20%, `ratio` is `0.8`.

Multiplying the distance from the image edge to the cursor by the ratio tells you where that same point will be after the scale change — without any correction. If the cursor was 300 pixels from the left edge and the image got 25% bigger, that point is now `300 * 1.25 = 375` pixels from the left edge. The image grew, so the point moved 75 pixels further right. But you do not want it to move.

So you subtract that scaled distance from `cursorX` to find where the left edge of the image needs to be placed for the cursor's point to land back at `cursorX`:

```javascript
state.tx = cursorX - ratio * (cursorX - state.tx);
state.ty = cursorY - ratio * (cursorY - state.ty);
```

That is the entire zoom formula. Two lines. It falls directly out of one constraint: _the image-space point under the cursor must remain at the cursor's screen position after the scale changes_.

A useful way to visualise what is happening physically: imagine grabbing the image by its top-left corner. When you zoom in, you pull that corner upward and to the left — the image grows, and the corner moves away from the cursor to keep the point under it fixed. When you zoom out, you push that corner downward and to the right as the image shrinks. The direction is not always perfectly diagonal — it depends entirely on where the cursor is. If the cursor is dead centre, the corner moves diagonally. If the cursor is near the top edge, the corner barely moves vertically but shifts a lot horizontally. The formula handles all of these cases without special-casing any of them, because the magnitude of the correction in each axis is proportional to how far the cursor is from the corner in that axis.

## The Wheel Event

The [WheelEvent](https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent) deserves its own section because it has a few non-obvious characteristics that the implementation handles explicitly.

The first is `deltaMode`. A `WheelEvent` can report its delta in different units depending on the input device:

- `0` — pixel mode (trackpads and most mice)
- `1` — line mode (some mice report scroll in discrete line increments)
- `2` — page mode (rare, almost never seen in practice)

A line-mode delta of `3` means three lines, not three pixels. Multiplying by 20 converts it into an approximate pixel equivalent — a rough heuristic, since there is no spec-defined line height for this purpose — so both modes produce deltas in the same unit and the zoom sensitivity feels consistent across devices.

The second characteristic is more surprising. When you pinch on a trackpad, browsers synthesise a `WheelEvent` with `ctrlKey` set to `true` — even though you never touched the Control key. This convention [originated with Internet Explorer on Windows](https://groups.google.com/a/chromium.org/g/blink-dev/c/BW4hshtMsmo/m/crQeQLoH7RYJ), was adopted by Chromium and Firefox, and has stuck across all major browsers. The original Chromium commit that added it for macOS is [publicly available](https://chromium.googlesource.com/chromium/src/+/621b3fe4c2e9821e396163f2e1cdfa2b3ffa320f^!) and describes it as a pragmatic tradeoff to match existing browser behaviour rather than introducing a new API.

Pinch gestures on a trackpad also produce small, precise fractional deltas, whereas a scroll wheel produces large, coarse ones. The two require different sensitivity settings:

```javascript
// @see https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode
// 0 = pixel mode (trackpads and most mice),
// 1 = line mode (some mice report scroll in discrete line increments)
// 2 = page mode (rare, hardly ever used in practice)
// For a consistent user experience we normalize the delta across browsers
// and trackpads. We multiply the number of pixels by 20 as a best guess
// heuristic for the number of pixels per line.
const delta = event.deltaMode === 1 ? event.deltaY * 20 : event.deltaY;

// When you pinch on a trackpad, browsers synthesise a WheelEvent with
// ctrlKey set to true. The delta values between pinch gestures and
// a scroll wheel are also very different — a scroll wheel has much coarser
// deltas. Because trackpads report constant finger movement, these produce
// small, precise fractional deltas. We therefore need to adjust the
// sensitivity of the scroll wheel downwards much more aggressively.
// Note: `1 - delta * factor`: Convert a raw pixel delta into a
// scale multiplier centred around 1. Scrolling down gives a
// positive deltaY; 1 - (positive number) returns something
// less than 1, shrinking the scale. Scrolling up gives a
// negative deltaY; 1 - (negative number) returns something
// greater than 1, increasing the scale.
const factor = event.ctrlKey ? 1 - delta * 0.01 : 1 - delta * ZOOM_STEP * 0.01;
```

The `1 - delta * factor` shape converts a raw delta into a scale multiplier centred around 1. It is a clean formulation that handles zoom-in and zoom-out in a single expression without needing to flip a sign.

## Naming and What It Reveals

One of the more instructive moments in the process was renaming `cx`/`cy` to `cursorX`/`cursorY`.

The original names looked like "canvas x" and "canvas y" — a reasonable interpretation. But that reading leads to a subtle confusion when you encounter `cx - state.tx`. If `cx` means "canvas x" (the left edge of the canvas), then `cx - state.tx` would be the distance from the canvas edge to the image edge, which is `tx` itself. That makes no sense in the formula.

The variable is actually the cursor's x position in canvas-local coordinates. `cursorX - state.tx` is the horizontal distance from the left edge of the image to the cursor. That distance is what the formula operates on, and the naming `cursorX` makes it immediately clear.

The fix cascades cleanly through the code:

```typescript
const cursorX = event.clientX - rect.left;
const cursorY = event.clientY - rect.top;

this.#zoomAround(cursorX, cursorY, factor);
```

And the function signature:

```typescript
#zoomAround(cursorX: number, cursorY: number, factor: number)
```

The formula now reads as intended: "zoom toward the cursor". It is a small change with a meaningful impact on readability, and it illustrates something worth keeping in mind — when code is hard to reason about, the names are often the first thing worth questioning.

The same logic applies to `#zoomIn` and `#zoomOut`, which compute the centre of the canvas to use as the zoom pivot:

```typescript
#zoomIn = () => {
  const canvasX = this.#canvas.clientWidth / 2;
  const canvasY = this.#canvas.clientHeight / 2;
  this.#zoomAround(canvasX, canvasY, ZOOM_BTN_FAC);
}
```

Here `canvasX` and `canvasY` genuinely are canvas-centre coordinates — they are not cursor positions. The naming distinction between `cursorX` at the call site in the wheel handler and `canvasX` at the call site in the button handler communicates the difference clearly without needing a comment.

## The Refactor to a Web Component

The second phase of the project was refactoring the standalone HTML file into a TypeScript web component. The core logic did not change — but several structural decisions became clearer in the process.

### Event Listener Cleanup with AbortController

The most significant improvement was how event listeners are managed. The original code had no cleanup at all. The refactor uses [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) with a signal passed to every `addEventListener` call.

The controller is created in `connectedCallback` and the signal is passed directly into `#addEventListeners`, which distributes it to each handler. This keeps responsibility clear — `connectedCallback` owns the controller, and `#addEventListeners` simply receives and distributes the signal:

```typescript
connectedCallback() {
  this.#abortController?.abort();
  this.#abortController = new AbortController();
  this.#addEventListeners(this.#abortController.signal);
  this.#applyTransform();
}

#addEventListeners = (signal: AbortSignal) => {
  this.#handleCanvasEvents(signal);
  this.#handleScrollWheel(signal);
  this.#handlePointerEvents(signal);
  this.#handleFileInput(signal);
  this.#handleToolbarEvents(signal);
  this.#handleKeyboardEvents(signal);
};
```

And in `disconnectedCallback`:

```typescript
disconnectedCallback() {
  this.#abortController?.abort();
}
```

One `abort()` call removes every listener registered with that signal. No stored references, no individual `removeEventListener` calls, no risk of forgetting one. Jake Archibald's post [Don't use functions as callbacks unless they're designed for it](https://jakearchibald.com/2021/function-callback-risks/) covers this pattern well and includes a useful note about passing the signal directly rather than the controller object itself.

The `AbortController` is initialised in `connectedCallback` rather than the constructor because `connectedCallback` and `disconnectedCallback` can fire multiple times if the element is moved around the DOM. Creating a fresh controller each time the element connects ensures the listeners are always registered against a live, un-aborted signal.

Note also the `this.#abortController?.abort()` as the first line of `connectedCallback`. The spec does not guarantee that `disconnectedCallback` always fires before a subsequent `connectedCallback` — in certain DOM manipulation scenarios you could end up registering a second set of listeners on top of the first without having cleaned up the previous ones. Aborting first prevents that. The `?.` handles the first call where `#abortController` is still `null`, so it is safe unconditionally. It is a one-liner that costs nothing and protects against a double-registration bug that would be genuinely difficult to diagnose.

Passing `signal` into `#addEventListeners` rather than having it access `#abortController` directly also has a TypeScript benefit — since the controller is assigned on the line immediately before the call, TypeScript can narrow the type and is satisfied that it is not `null`. No non-null assertions or type casts needed.

It is also worth noting that `ResizeObserver` and `IntersectionObserver` do not support `AbortSignal` and must be disconnected explicitly in `disconnectedCallback`. [Jake Archibald flagged this](https://x.com/jaffathecake/status/1405437361643790337) — both observers leak memory through their callbacks if not manually disconnected, in all browsers.

### Event Delegation in the Toolbar

Rather than attaching individual click listeners to each toolbar button, the refactored code uses a single delegated listener on the toolbar element:

```typescript
toolbar.addEventListener(
  "click",
  (event: Event) => {
    const target = event.target as HTMLElement;

    if (target.matches(`#${zoomInButton.id}`)) {
      this.#zoomIn();
    }

    if (target.matches(`#${zoomOutButton.id}`)) {
      this.#zoomOut();
    }

    if (target.matches(`#${resetZoomButton.id}`)) {
      this.#resetZoom();
    }
  },
  { signal },
);
```

Fewer listeners, same behaviour, and the single listener is still cleaned up by the `AbortController` like everything else.

## What We Ended Up With

The final component is a `<panozoom-app>` custom element, deployed at [panozoom.schalkneethling.com](https://panozoom.schalkneethling.com). It handles its own event lifecycle, cleans up after itself on disconnection, and exposes a clear internal API via private class fields and methods. The zoom math is the same two lines it always was.

The full source is on GitHub at [github.com/schalkneethling/panozoom](https://github.com/schalkneethling/panozoom). The repository includes the original one-shot standalone HTML file in the `one-shot` folder — worth reading alongside the final component to see how the same logic looks before and after structure is applied. The `visualizer` folder contains the interactive math visualizer built to explore the coordinate geometry: you can scroll and drag on a representative image rectangle and watch every step of the zoom formula update in real time with the actual numbers substituted in.

The app is also installable as a [Progressive Web App](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps). Install it once from the browser and it behaves like a native app — the shell assets are precached by a service worker so it loads instantly, and because images are opened from the local filesystem via `URL.createObjectURL`, nothing ever leaves the device.

The web platform provided everything else the app needed: [CSS transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/transform) for the visual layer, [pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) with `setPointerCapture` for reliable drag handling, the `WheelEvent` API for scroll and pinch, [URL.createObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL) for loading local files, [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) for cleanup, and [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) for encapsulation. No framework, no build-time dependencies, no canvas element.

The most interesting lesson from the whole project was not about any specific API. It was about compression. A lot of complexity — smooth zoom, pinch support, drag stability, cross-device input handling — compresses down to a surprisingly small amount of code when you let the platform do what it is designed to do and take the time to understand the math rather than reaching for an abstraction. The two lines of `zoomAround` are small not because the problem is trivial, but because the coordinate geometry has a clean solution and the web platform has the primitives to express it directly.

## Further Reading

- [WheelEvent — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent)
- [WheelEvent: deltaMode — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent/deltaMode)
- [Pointer events — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
- [Element: setPointerCapture() — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)
- [AbortController — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [AbortSignal — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal)
- [CSS transform — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)
- [transform-origin — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-origin)
- [Using custom elements — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)
- [Pinch me, I'm zooming: gestures in the DOM — Dan Burzo](https://danburzo.ro/dom-gestures/)
- [Don't use functions as callbacks unless they're designed for it — Jake Archibald](https://jakearchibald.com/2021/function-callback-risks/)
- [Event listeners and garbage collection — Jake Archibald](https://jakearchibald.com/2020/events-and-gc/)
- [Chromium commit: Synthesize ctrl-wheel events on touchpad pinch](https://chromium.googlesource.com/chromium/src/+/621b3fe4c2e9821e396163f2e1cdfa2b3ffa320f^!)
