---
title: "Mocking Browser Image Loading in Vitest: Property Descriptors, Prototypes, and WeakMap"
pubDate: 2026-02-20
description: "A deep dive into the JavaScript concepts behind mocking HTMLImageElement behaviour in Vitest, including Object.defineProperty, Object.getOwnPropertyDescriptor, prototype manipulation, and WeakMap for per-instance state tracking."
author: "Schalk Neethling"
tags: ["testing", "javascript", "frontend-engineering-explained"]
---

If you have ever needed to test code that loads images in a non-browser environment, you have probably run into a wall. Vitest (and Jest before it) uses [jsdom](https://github.com/jsdom/jsdom) or [happy-dom](https://github.com/nicedaysoftware/happy-dom) to simulate browser APIs, but these environments do not actually load images. There is no network request, no decoded pixels, and critically, `naturalWidth` and `naturalHeight` are always `0`. The `onload` and `onerror` callbacks never fire either.

So how do you test a utility that depends on all of these behaviours? You mock them. But the way you mock properties on a built-in browser prototype like `HTMLImageElement` involves some interesting JavaScript that is worth understanding in its own right.

In this post, we will walk through a real Vitest `beforeEach` / `afterEach` setup that mocks image loading behaviour, and break down every concept at play.

## The utility under test

The function we are testing, `loadImageWithDimensions`, creates an `img` element, sets its `src`, waits for either `onload` or `onerror` to fire, and then reads `naturalWidth` and `naturalHeight` to set explicit `width` and `height` attributes on the element. This is a common pattern for preventing [Cumulative Layout Shift (CLS)](https://web.dev/articles/cls).

```javascript
export function loadImageWithDimensions(src, options = {}) {
  const { alt = "", loading, isDecorative = false, className = "" } = options;

  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.alt = alt;

    if (loading) {
      img.loading = loading;
    }

    if (className) {
      img.className = className;
    }

    img.onload = () => {
      // Set explicit dimensions for CLS prevention
      img.width = img.naturalWidth;
      img.height = img.naturalHeight;
      resolve(img);
    };

    img.onerror = () => {
      if (isDecorative) {
        // Decorative images: Don't show broken image icon (cleaner UX)
        resolve(null);
      } else {
        // Content images: Show broken image with alt text for accessibility
        resolve(img);
      }
    };

    // Set src last to trigger load
    img.src = src;
  });
}
```

The function returns a Promise that resolves with either the `img` element (with `width` and `height` attributes set) or `null` if a decorative image fails to load. Notice that `src` is set last — this is intentional, as setting `src` is what triggers the browser to start loading. The `onload` and `onerror` handlers need to be in place before that happens.

The key challenge is that in jsdom, setting `img.src` does not trigger any loading, and `naturalWidth` / `naturalHeight` are always `0`. We need to simulate the entire lifecycle.

## Step 1: Saving the originals with Object.getOwnPropertyDescriptor

```javascript
let originalSrcDescriptor;
let originalNaturalWidthDescriptor;
let originalNaturalHeightDescriptor;

beforeEach(() => {
  originalSrcDescriptor = Object.getOwnPropertyDescriptor(
    HTMLImageElement.prototype,
    "src",
  );
  originalNaturalWidthDescriptor = Object.getOwnPropertyDescriptor(
    HTMLImageElement.prototype,
    "naturalWidth",
  );
  originalNaturalHeightDescriptor = Object.getOwnPropertyDescriptor(
    HTMLImageElement.prototype,
    "naturalHeight",
  );
```

[`Object.getOwnPropertyDescriptor`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptor) returns a _property descriptor_ object that fully describes how a property behaves. This is not just its value. A descriptor includes metadata like whether the property is writable, enumerable, and configurable. More importantly for our case, it captures whether a property is defined as a simple value or as a getter/setter pair.

For `HTMLImageElement.prototype.src`, the descriptor will contain `get` and `set` functions because `src` is an _accessor property_ in jsdom (it reflects the HTML attribute). For `naturalWidth` and `naturalHeight`, the descriptors will be read-only getters.

To see this in action, if you open your browser console and run `Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src")`, you will get something like this:

```javascript
{
  enumerable: true,
  configurable: true,
  get: f src(),   // length: 0, name: "get src"
  set: f src(),   // length: 1, name: "set src"
  [[Prototype]]: Object
}
```

The descriptor is a plain object with `configurable`, `enumerable`, and in this case `get` and `set` functions. This is what distinguishes an _accessor property_ from a _data property_ (which would have `value` and `writable` instead). The entire behaviour of the property is captured in this single object, which is what makes the save-and-restore pattern possible.

We save these descriptors so we can restore them after each test. This is critical for test isolation. Without it, our mocks would leak into other tests and potentially cause mysterious failures.

## Step 2: Tracking per-instance state with WeakMap

```javascript
const imageStates = new WeakMap();
```

Here is where things get interesting. We need each `img` element to have its own load state (has it loaded yet, or not?) but we are defining our mock on the _prototype_, which is shared by all instances. A regular object or `Map` would work, but a [`WeakMap`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) is the right choice here. As [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) describes it:

> A `WeakMap` is a collection of key/value pairs whose keys must be objects or non-registered symbols, with values of any arbitrary JavaScript type, and which does not create strong references to its keys.

That last part is key for our use case. Because a `WeakMap` does not create strong references to its keys, when an `img` element is no longer referenced anywhere else in your code, the garbage collector can clean it up, and the corresponding entry in the `WeakMap` is automatically removed. With a regular `Map`, those entries would persist for the lifetime of the `Map` itself, keeping the `img` elements alive in memory. In a test suite that creates hundreds of image elements across many test runs, that distinction matters.

The `WeakMap` is keyed on the `img` element itself (remember, `WeakMap` keys must be objects), and the value is a simple state object: `{ loaded: false }` or `{ loaded: true }`.

## Step 3: Mocking naturalWidth and naturalHeight on the prototype

```javascript
Object.defineProperty(HTMLImageElement.prototype, "naturalWidth", {
  get() {
    const state = imageStates.get(this);
    return state?.loaded ? 200 : 0;
  },
  configurable: true,
});

Object.defineProperty(HTMLImageElement.prototype, "naturalHeight", {
  get() {
    const state = imageStates.get(this);
    return state?.loaded ? 100 : 0;
  },
  configurable: true,
});
```

[`Object.defineProperty`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) lets you define or redefine a property on an object with precise control over its behaviour. Here we are replacing the `naturalWidth` and `naturalHeight` properties on the `HTMLImageElement` prototype with custom getters.

There are a few things worth noting. First, because we define these on the prototype, every `img` element created via `document.createElement("img")` inherits these getters. Second, inside the getter, `this` refers to the specific `img` instance that the property is being accessed on, not the prototype. This is how JavaScript prototype-based getter/setter dispatch works, and it is exactly what lets us look up per-instance state from the `WeakMap`.

Third, `configurable: true` is essential. Without it, we would not be able to redefine these properties again in `afterEach` to restore the originals. By default, properties created with `Object.defineProperty` are _not_ configurable, which would lock us out of our own cleanup.

The mock returns `200` and `100` for loaded images (mimicking a 200×100 image), and `0` for images that have not yet loaded or that errored. That `0` return matches real browser behaviour, where `naturalWidth` and `naturalHeight` are `0` before the image has loaded or if the load failed.

## Step 4: Mocking the src setter to simulate loading

```javascript
Object.defineProperty(HTMLImageElement.prototype, "src", {
  get() {
    return originalSrcDescriptor?.get?.call(this) || "";
  },
  set(value) {
    // Call original setter to update DOM attribute
    originalSrcDescriptor?.set?.call(this, value);

    // Track state for naturalWidth/naturalHeight
    imageStates.set(this, { loaded: false });

    // Trigger onload or onerror based on URL pattern
    setTimeout(() => {
      if (value.includes("broken")) {
        if (this.onerror) {
          this.onerror(new Event("error"));
        }
      } else {
        const state = imageStates.get(this);
        if (state) {
          state.loaded = true;
        }
        if (this.onload) {
          this.onload(new Event("load"));
        }
      }
    }, 0);
  },
  configurable: true,
});
```

This is the most complex part. The `src` property is being replaced with a custom accessor that does three things.

The **getter** delegates to the original getter using `.call(this)`. This is important because we still want `img.src` to return the correct value. The `call(this)` ensures the original getter runs with the correct `img` instance as its context.

The **setter** first calls the original setter so that the underlying DOM attribute is still updated correctly. Then it initialises the load state in our `WeakMap` to `{ loaded: false }`. Finally, it uses `setTimeout` with a delay of `0` to asynchronously trigger either `onload` or `onerror`.

The `setTimeout(..., 0)` is an important detail. In a real browser, image loading is asynchronous. The `load` and `error` events fire after the current synchronous code has finished. By wrapping our callbacks in `setTimeout`, we replicate this asynchronous behaviour. Without it, the `onload` callback would fire _during_ the `src` assignment, before our utility has had a chance to attach its handlers.

### Why not requestAnimationFrame?

You might wonder whether [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) would be a better fit here, since it is also a way to defer work. It would not work in this context. `requestAnimationFrame` is tied to the browser's rendering pipeline and fires before the next repaint. In jsdom and happy-dom, it is either not implemented or shimmed in a way that does not reliably match browser behaviour. More importantly, its semantics are wrong for what we need. We are not trying to sync with a paint cycle — we are trying to defer a callback until after the current synchronous code finishes. `setTimeout` with a delay of `0` is the right tool for that job because it places the callback on the [macrotask queue](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide#tasks_vs._microtasks), which runs after the current call stack has cleared.

### What if the delay were not 0?

The `0` does not actually mean "run in zero milliseconds." It means "run as soon as possible after the current synchronous execution and any already-queued microtasks complete." If you changed it to, say, `100`, the tests would still pass because they use `async` / `await` and the promise inside `loadImageWithDimensions` does not resolve until `onload` or `onerror` fires. The `await` keeps the test waiting regardless of the delay.

However, a higher value would make the tests slower for no benefit, and it would misrepresent the intent. The `0` delay communicates clearly: this is about deferring to the next tick, not about simulating a real network delay. If you genuinely wanted to simulate slow image loads (for example, to test a loading spinner), you would use a longer delay intentionally and pair it with [`vi.useFakeTimers()`](https://vitest.dev/guide/mocking#timers) to keep the tests fast while still exercising timeout-dependent logic.

The URL-based branching (checking for `"broken"` in the URL) is a simple convention that lets tests control whether an image load should succeed or fail. Any URL containing `"broken"` triggers the error path; everything else succeeds.

## Step 5: Restoring everything in afterEach

```javascript
afterEach(() => {
  if (originalSrcDescriptor) {
    Object.defineProperty(
      HTMLImageElement.prototype,
      "src",
      originalSrcDescriptor,
    );
  }
  if (originalNaturalWidthDescriptor) {
    Object.defineProperty(
      HTMLImageElement.prototype,
      "naturalWidth",
      originalNaturalWidthDescriptor,
    );
  }
  if (originalNaturalHeightDescriptor) {
    Object.defineProperty(
      HTMLImageElement.prototype,
      "naturalHeight",
      originalNaturalHeightDescriptor,
    );
  }
});
```

This is the cleanup. We pass the _exact descriptor objects_ we saved earlier back to `Object.defineProperty`. Because descriptors capture the full definition of a property (getters, setters, configurability, enumerability, and all), this completely restores the original behaviour as if we had never touched it.

This pattern of save-descriptor, override, restore-descriptor is a robust way to temporarily monkey-patch built-in prototypes in tests. It is significantly safer than, say, deleting a property and hoping for the best.

## The concepts working together

When you step back, the overall pattern is elegant. `Object.getOwnPropertyDescriptor` captures the current state. `Object.defineProperty` replaces it with controlled mocks. `WeakMap` tracks per-instance state without modifying the instances themselves. Prototype-level getters with `this` binding give each instance its own behaviour. `setTimeout` replicates asynchronous loading. And the full descriptors are restored in `afterEach` to keep tests isolated.

Understanding these building blocks individually makes the test setup readable rather than intimidating, and they are useful well beyond testing. Property descriptors are at the heart of how reactive frameworks implement data binding — [Vue 2's entire reactivity system](https://v2.vuejs.org/v2/guide/reactivity.html) was built on `Object.defineProperty`, converting data properties into getter/setter pairs to perform dependency tracking and change notification. `WeakMap` is used extensively for associating metadata with DOM nodes without causing memory leaks, and prototype manipulation is fundamental to how polyfills work.

## Further reading

- [Object.defineProperty - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
- [Object.getOwnPropertyDescriptor - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptor)
- [WeakMap - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
- [Property Descriptors - web.dev](https://web.dev/learn/javascript/objects/property-descriptors)
- [Property Flags and Descriptors - javascript.info](https://javascript.info/property-descriptors)
- [Inheritance and the Prototype Chain - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
- [Cumulative Layout Shift (CLS) - web.dev](https://web.dev/articles/cls)
- [Reactivity in Depth - Vue.js](https://v2.vuejs.org/v2/guide/reactivity.html)
