---
title: "Timelapse: A PWA - Putting Cursor's Composer 2 To The Test"
pubDate: 2026-03-22
description: "Timelapse is a progressive web app (PWA) with acollection of widgets that shows how much time has elapsed in the day, week, month, quarter, and year. Widgets and timezone are configurable."
author: "Schalk Neethling"
tags: ["ai"]
---

I took Cursor's Composer 2 for a spin. There were moments where its response was slow; however, I reckon it is being hammered as a lot of people are talking about it and using it at the moment. I am actually very impressed with it. I built a little web app with it and had it pivot a couple of times as I changed my mind about the implementation, and it handled it very well.

- I started with just a plain HTML, CSS, JS build with web components.
- Then, I decided to make it a PWA
- I hated all the HTML in JS, and so I pivoted to using [lit.dev](https://lit.dev/)
- Added favicon using [realfavicongenerator's agent instruction](https://realfavicongenerator.net/)
- Added social sharing metadata

Accessibility needs some work, but it is fully keyboard accessible

I did some code review and had to guide it here and there (mostly CSS and some HTML), but in general, it did a really good job.

The repo is here: [Timelapse](https://github.com/schalkneethling/timelapse)
You can see the app here: [Timelapse on Netlify](https://dot-timelapse.netlify.app)
