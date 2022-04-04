---
title: Styling the CodeMirror cursor for light and dark modes
description: A simple framework for form validation
---

This post was written when [CodeMirror](https://codemirror.net/) version 5 was still the main version used by websites. In version 6 there is a [new way via the EditorView.theme](https://codemirror.net/6/examples/styling/#themes) function. You might still be able to use the method described here but, I thought I would mention this right out of the door.

With that said, let’s dig in.

You can style the cursor used by CodeMirror using the `.CodeMirror-cursor` class. I mean, that sounds simple enough right? I thought so to, until I ran into a bit of a problem. I needed to be able to style the cursor for, as the title suggests, both light and dark mode. Still seems simple right?

The cursor is black by default so, the following should do the trick:

```css
.theme-dark {
  .CodeMirror-cursor {
    border-left: 1px solid #fff;
  }
}
```

But, for whatever reason(I have not dug into this too deeply), when I load up the editor and switch to dark mode, the cursor remains black. What!? I mean, the `theme-dark` class is on the `body` element and so, `CodeMirror-cursor` is a child of the `body`. It should work, but it doesn’t.

I started thinking of ways to inject this using JavaScript. I even considered creating an entire `style` block ith JavaScript and injecting it into the DOM. Then it hit me. I am setting the color of the left border. What would happen if I set the color of the left border to white, and the right border to black. Can you even do that?

I decided to give it a try.

```css
.CodeMirror-cursor {
  border-left: 1px solid white;
  border-right: 1px solid black;
}
```

Hey presto! It Works! When in dark mode the cursor is white, and when in light mode the cursor is black. 🎉 Hopefully this will stop someone out there from pulling out a few less hairs 😁
