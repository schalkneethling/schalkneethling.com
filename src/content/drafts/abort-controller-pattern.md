---
title: "The Correct AbortController Pattern for Custom Elements"
pubDate: 2026-06-25
description: "Custom elements that move in the DOM need a fresh AbortController on each connectedCallback. Eager-init breaks listener cleanup on reconnect."
author: "Schalk Neethling"
tags: ["javascript", "web-components", "frontend-engineering-explained"]
---

 1. Declared as null at the class field,
  typed /** @type {AbortController | null}
   */ — not eagerly constructed with new
  AbortController().
  2. Constructed inside connectedCallback
  (each connect creates a fresh one).
  3. Aborted with ?. in
  disconnectedCallback — the
  optional-chaining guard you asked for is
   the standard form, but only needed
  because the field is null until first
  connect.

  Why this matters: custom elements can be
   moved in the DOM, which triggers
  disconnectedCallback →
  connectedCallback. With my eager-init
  version, the controller is constructed
  once at upgrade time. After the first
  disconnect it's permanently aborted, so
  any listeners re-attached on reconnect
  would be attached to an already-aborted
  signal and never fire. The canonical
  pattern creates a fresh controller per
  connect, so move/reconnect works
  correctly.

  1. Before (eager init, listener references the field directly):

  export class CadDataRequestForm extends HTMLElement {
      /** @type {HTMLFormElement|null} */
      #form = null;

      #abortController = new AbortController();

      connectedCallback() {
          this.#queryElements();
          this.#initForm();
          this.#addEventListeners();
      }

      disconnectedCallback() {
          this.#abortController.abort();
      }

      #addEventListeners() {
          this.#form?.addEventListener("submit", this.#handleSubmit, {
              signal: this.#abortController.signal,
          });
      }
  }

  Problem: #abortController is constructed once at upgrade time. After the first disconnectedCallback, it's
  permanently aborted. If the element is moved/reconnected, any listeners re-attached on the second
  connectedCallback would be tied to an already-aborted signal and never fire.

  2. After (fresh controller per connect, signal passed to setup helper):

  export class CadDataRequestForm extends HTMLElement {
      /** @type {HTMLFormElement|null} */
      #form = null;

      /** @type {AbortController | null} */
      #abortController = null;

      connectedCallback() {
          this.#abortController = new AbortController();
          this.#queryElements();
          this.#initForm();
          this.#addEventListeners(this.#abortController.signal);
      }

      disconnectedCallback() {
          this.#abortController?.abort();
      }

      /**
       * @param {AbortSignal} signal
       */
      #addEventListeners(signal) {
          this.#form?.addEventListener("submit", this.#handleSubmit, { signal });
      }
  }

  Key changes:

  - Field declared null with a AbortController | null JSDoc type.
  - new AbortController() moved into connectedCallback, so each connect gets a fresh one — move/reconnect works
   correctly.
  - signal passed as a parameter to #addEventListeners, so the listener call site doesn't need
  this.#abortController?.signal (and the type is non-null inside the helper without further narrowing).
  - disconnectedCallback uses ?.abort() because the field is null before the first connect.
