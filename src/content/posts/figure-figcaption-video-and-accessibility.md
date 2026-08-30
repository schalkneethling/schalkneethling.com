---
title: Figure, video, figcaption, and accessibility
pubDate: 2026-08-26
description: What makes a video element accessible is captions, descriptions, and a transcript. When those are out of reach, what are the remaining options for giving a video element an accessible name?
author: Schalk Neethling
tags: [html, accessibility]
standardSite:
  publish: true
---

A video is not made accessible by the markup we wrap around it. It is made accessible by the alternatives we provide to people who are blind or have low vision, people who are deaf or hard of hearing, and people who would simply rather read.

While this is true, I am sure most of us have encountered situations where the ideal will simply never be realized. In these situations, what options are left? The rest of this post will unpack the pros and cons of these remaining options.

## What Makes a Video Accessible

The HTML Standard is direct about this. Content placed inside the [`video`](https://html.spec.whatwg.org/multipage/media.html#the-video-element) element exists for older browsers that do not support the element, and the specification states plainly that this fallback content is not intended to address accessibility concerns. It then tells us what is:

- Captions, either embedded in the video stream or supplied externally through the [`track`](https://html.spec.whatwg.org/multipage/media.html#the-track-element) element
- Sign-language tracks embedded in the video stream
- Audio descriptions, embedded in the stream, or provided as a WebVTT file referenced through `track`, which the specification intends the user agent to synthesize into speech
- Chapter titles, also through WebVTT
- Transcripts or other textual alternatives, linked in the prose near the element, for people who would rather not use a media element at all

Put together, that looks something like this:

```html
<video src="orbit.webm" controls aria-label="Satellite orbit simulation">
  <track kind="captions" src="orbit.en.vtt" srclang="en" label="English" default>
  <track kind="descriptions" src="orbit.en.desc.vtt" srclang="en" label="English descriptions">
  <track kind="chapters" src="orbit.en.chapters.vtt" srclang="en" label="Chapters">
</video>
<p><a href="orbit-transcript.html">Read a transcript of the orbit simulation</a>.</p>
```

The `kind` attribute is the important one in that markup, and the values are not interchangeable. Captions cover dialogue along with sound effects and other relevant audio information, for people who are deaf or hard of hearing. Subtitles cover transcription or translation of dialogue, for people who can hear the audio but do not understand the language.

There is one detail here that is easy to get wrong.

> **Note**: Subtitles is the missing value default, so a `track` without a `kind` is treated as subtitles, not captions. If you have written captions and forgotten the attribute, no browser will tell you, and the track will still load and display. The two are distinguished only by what the user agent labels them as and how assistive technology and user preferences select between them.

The `descriptions` track provides the visual information for people who are blind or have low vision.

> **Note**: That synthesis is intent, not reality. When [Adrian Roselli tested audio description support across engines](https://adrianroselli.com/2023/12/ad-support-in-html-video.html) in December 2023, no browser implemented `kind="descriptions"`, and MDN's browser-compat data records the same. The W3C technique for it, [H96](https://www.w3.org/WAI/WCAG22/Techniques/html/H96), is advisory rather than sufficient, and at its September 2023 review stated plainly that there is no native user agent support and that a JavaScript polyfill is needed. I have not re-tested this myself and am not aware of it having changed. Treat a descriptions track as forward-looking markup rather than as a delivered audio description. What works today is a separate described audio track, or a separately described version of the video.

We place the transcript outside the element, and there is no case where it belongs inside. Anything we nest inside `video` is fallback content, and a browser that supports the element never renders it, so a transcript placed there would only ever appear in a browser that cannot play the video in the first place. Outside the element it is ordinary document content, available to anyone who would rather read than watch.

## When You Cannot Do Any of That

There are two situations where a video ships without captions, descriptions, or a transcript.

The first is a video that contains no information at all. A muted background loop behind a heading, say, or a texture rather than a message. There is nothing to caption because nothing is being said. Be careful with this one, though. Decorative is an easy label to apply, and it is worth asking honestly whether a video really contains no content before you use it.

The second situation is the common one, and it is less comfortable. The video contains real content, and the captions and transcript are not going to exist. The source material was produced without them, nobody is budgeting the hours to write them, and the decision sits well above whoever is writing the markup. This happens on real projects.

What follows is not a replacement for that missing work. Captions and descriptions have their own success criteria, [1.2.2](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html) and [1.2.3](https://www.w3.org/WAI/WCAG22/Understanding/audio-description-or-media-alternative-prerecorded.html) among them, and no attribute is going to satisfy those. The requirement remains unmet. Record that somewhere, instead of sweeping it under the rug.

What we can still do is name the thing. [WCAG success criterion 1.1.1](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) asks for less from time-based media than it does from images. An image needs a text alternative that serves the equivalent purpose, which is why `alt` has to convey the meaning and describe its content. Nothing else in an `img` can. For time-based media, the requirement is only descriptive identification of the content. That is a much smaller scope and can be satisfied by a single attribute.

That leaves one question. How do we give a `video` element an accessible name? It is less obvious than it looks.

## Figcaption Can Be Misleading

The first instinct is usually to reach for a caption, and the markup looks right:

```html
<figure>
  <video src="orbit.webm" controls>
    <track kind="captions" src="orbit.vtt" srclang="en" label="English" default>
  </video>
  <figcaption>
    A simulation of a low Earth orbit decaying over eighteen months.
  </figcaption>
</figure>
```

The video in that example has no accessible name.

[MDN states the rule plainly](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/figure): the [`figcaption`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/figcaption) provides the accessible name for its parent [`figure`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/figure). It follows the same pattern as `legend` for `fieldset` and `caption` for `table`. If the `figure` has `aria-label` or `aria-labelledby`, those win. Otherwise the `figcaption` subtree is used. Otherwise the `title` attribute. Nothing in that sequence applies to the children of the figure.

A caption annotates a figure, not whatever happens to sit inside it. That does mean the relationship we perceive between the caption and the media next to it is a visual and editorial one, not a programmatic one.

So what does the `video` element give us? Nothing, as it turns out. The content attributes the HTML Standard defines for `video` are `src`, `crossorigin`, `poster`, `preload`, `autoplay`, `playsinline`, `loop`, `muted`, `controls`, `loading`, `width`, and `height`, plus the global attributes. There is no `alt`, and nothing else in that list provides a text alternative.

The specification does not define how a `video` gets named either. It defers to other specifications instead, pointing authors to [ARIA in HTML](https://w3c.github.io/html-aria/#el-video) and implementers to [HTML-AAM](https://w3c.github.io/html-aam/#el-video). What we are left with is [`aria-label`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-label), [`aria-labelledby`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-labelledby), or the global `title` attribute. MDN [lists videos among the elements `aria-label` is intended for](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-label#description), alongside links, form controls, and elements with landmark or widget roles.

## Choosing Between the Two Attributes

If the caption is visible on the page, pointing at it is a defensible choice:

```html
<figure>
  <video src="orbit.webm" controls aria-labelledby="orbit-caption">
    <track kind="captions" src="orbit.vtt" srclang="en" label="English" default>
  </video>
  <figcaption id="orbit-caption">Satellite orbit simulation</figcaption>
</figure>
```

The visible text and the accessible name stay in sync, and the name comes from a text node, which machine translation handles more reliably than an attribute value. The cost is repetition. The `figure` is already taking its name from that same caption, so a screen reader user may hear the string twice in quick succession.

That trade is no longer worth making once the caption is visually hidden because the design does not call for showing it, which is where a lot of this markup ends up in practice. [The HTML Standard](https://html.spec.whatwg.org/multipage/grouping-content.html#the-figure-element) describes a `figure` as flow content that is self-contained and typically referenced as a single unit from the main flow of the document. It is specific about what the caption is for: when we refer to a figure from the main content by identifying it through its caption, by a figure number for instance, that is what allows us to move the content elsewhere, to the side of the page or into an appendix, without disturbing the flow of the document.

We cannot refer to a caption nobody can see, so the `figure` serves no purpose. Screen reader users still traverse the extra node, and the argument for `aria-labelledby` no longer holds, because there is no visible text left to keep the name in sync with.

At that point the simplest markup that works is `aria-label` on the video itself:

```html
<video src="orbit.webm" controls aria-label="Satellite orbit simulation">
</video>
```

With this in place, at least our video now has an accessible name. Whether it is what I would ship is a separate question, and it turns on translation.

## The Translation Objection

The usual argument against `aria-label` is that automatic translation tools ignore attribute values. Most of that advice traces back to [Adrian Roselli's testing](https://adrianroselli.com/2019/11/aria-label-does-not-translate.html), which found Google Translate leaving `aria-label` untouched while it translated the rest of the page, and Bing Translator handling roughly half of the instances it met.

That has changed since then. Roselli has updated that post several times, and [more recent research from OpenAccess](https://www.openaccess.nz/blog/do-aria-attributes-get-translated/) reports that attributes do now translate, with the failures concentrated in dynamic attribute values and elements toggling in and out of `display: none`.

I have not verified this against current browser builds myself, and the two sources do not fully agree, so it is worth separating them. The permissive conclusion is the OpenAccess one: attributes do translate, with the nuance mentioned earlier. Roselli's position is narrower. As of his July 2025 update, support is less spotty than it was in 2019 but still unreliable, and his more recent testing of harder cases, such as dynamic `aria-label` values, added failures rather than removing them. He still prefers referencing element text over `aria-label` where that is practical.

As of this writing, August 26, 2026, a static `aria-label`, written once at authoring time, is the best-supported case and is not among those observed to fail. That is not the same as saying the concern has gone away.

There is an option that removes the question rather than reasoning about it. Point `aria-labelledby` at a visually hidden `span`:

```html
<span id="orbit-label" class="visually-hidden">Satellite orbit simulation</span>
<video src="orbit.webm" controls aria-labelledby="orbit-label">
</video>
```

The name is now computed from a text node, so it is ordinary document content. Translation tools treat it the way they treat a paragraph, and a localization workflow extracting strings will find it without anyone remembering that attributes need extracting too. There is no failure case left to test for. It is also what Roselli recommends.

The cost is markup. An extra element, an `id` to wire it up, and a utility class in the stylesheet, all to hold a string that `aria-label` keeps in a single attribute. Across a component rendered hundreds of times that is a real amount of additional HTML shipped to every reader.

I take that trade. Support for static `aria-label` is good and I have no evidence it is about to fail, but good support is not the same as no failure case, and a few lines of markup remove the question permanently rather than leaving it to be re-checked whenever a browser changes. My recommendation is `aria-labelledby` referencing real text, and I would only reach for `aria-label` where referencing text adds genuine complexity, such as a component where the string is generated far from where the element renders.

One last distinction is worth holding on to. If a caption is meant as supplementary information about the video rather than as its label, [`aria-describedby`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby) is the attribute to use. A short name for identity and a longer description for context is much closer to what a figure and its caption normally mean than using one string for both.

## Wrapping Up

If one idea is worth carrying away from this, it is that the `figcaption` names the `figure`. It does not name the `video` inside it. We compute an accessible name from the element and its attributes, not from a sibling by proximity alone.

The mistake I made was assuming the `figure` was contributing something. It was not. Once the caption was visually hidden, the wrapper existed only to hold a string, and a `figure` whose caption nobody can see is a node screen reader users traverse for nothing. Dropping it left a clear choice between naming the video with `aria-label` and referencing a visually hidden `span` with `aria-labelledby`, and I would take the `span` in almost every case.

## Further Reading

- [The `video` element in the HTML Standard](https://html.spec.whatwg.org/multipage/media.html#the-video-element), where the content attribute list settles what the element does and does not offer
- [The `track` element in the HTML Standard](https://html.spec.whatwg.org/multipage/media.html#the-track-element), including the `kind` table and the missing value default
- [The `figure` element in the HTML Standard](https://html.spec.whatwg.org/multipage/grouping-content.html#the-figure-element), which is clearer than most summaries about what a caption is actually for
- [Understanding Success Criterion 1.1.1: Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html), and specifically the time-based media clause
- [`video` in ARIA in HTML](https://w3c.github.io/html-aria/#el-video), the author-facing half of what the HTML Standard delegates
- [Audio Description Support in HTML Video, by Adrian Roselli](https://adrianroselli.com/2023/12/ad-support-in-html-video.html), the demo and cross-engine testing behind the note above
- [H96: Using the track element to provide audio descriptions](https://www.w3.org/WAI/WCAG22/Techniques/html/H96), an advisory technique rather than a sufficient one, and clear about why
- [`aria-label` on MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-label), whose Description section lists where the attribute is and is not supported
- [aria-label Does Not Translate, by Adrian Roselli](https://adrianroselli.com/2019/11/aria-label-does-not-translate.html), noting that the original findings have been revised several times since 2019
- [Do ARIA attributes get translated?, by OpenAccess](https://www.openaccess.nz/blog/do-aria-attributes-get-translated/), the more recent testing and the one to read second
