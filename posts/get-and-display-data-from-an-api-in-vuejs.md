---
title: Get and display data from an API in VueJS
description: A introduction to using Vuejs to get data from and API and display the results in the browser.
draft: true
---

On [MDN Web Docs](https://developer.mozilla.org) our content team manages writing the release notes and API docs for new or changed features in every release of Firefox. While they do their work on [GitHub](https://github.com/mdn), the Firefox team uses [Bugzilla](https://bugzilla.mozilla.org). A colleague of mine, [Ruth John](https://twitter.com/Rumyra), came up with the idea of building a release dashboard from which we can then build all kinds of useful automation.

This is a Friday hack project which we started on a little over a week ago. While we started of with just regular HTML and JavaScript to get the API calls to work as expected, we quickly realized that a framework could help us here. From secrets management to a more state driven UI. While we use [React](https://reactjs.org/) on a lot of our projects, we decide to opt for [Vuejs](https://vuejs.org/) this time.

In this post I am going to cover the basics of getting data from an API and displaying it in a Vuejs component. So, let’s dig in.
