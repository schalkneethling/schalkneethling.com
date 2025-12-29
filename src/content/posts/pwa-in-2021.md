---
title: Progressive Web Apps (PWA) in 2021
pubDate: 2021-07-01
description: Some thoughts on the current state and challenges with regards to building a PWA in 2021.
author: "Schalk Neethling"
tags: ["javascript"]
---

Let me start by saying that I am by no means a [progressive web application (PWA)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) expert. I worked with [OpenUP](https://openup.org.za/) to build a PWA for the municipality of [Cape Agulhas](https://en.wikipedia.org/wiki/Cape_Agulhas), and have learned a lot which I am happy to share.

## Setting the scene

Progressive web applications (PWAs) hold a lot of promise for the web, especially with the resurgence of web components. The real problem with the PWA ecosystem is not so much the underlying technologies and specifications, although there are issues here. The biggest problem is the ecosystem, particularly the discovery and user experience of installing a PWA. There is a disconnect between the concept of "installing" a website on your mobile device or desktop via a browser, which is not something general users often think about.

Mozilla decided to remove this capability entirely from Firefox on the desktop. To be clear, it was never released in a public version of Firefox but was available as a prototype ([you can enable it in Firefox via FirefoxPWA](https://github.com/filips123/FirefoxPWA)). This raises the question: are PWAs a mobile-only target? This question is not entirely relevant because it concerns just one aspect of a PWA. Even though installation is always mentioned as a core feature of a PWA, its absence in a single browser on a single platform does not break the contract. There is much more that makes a PWA useful for end users:

- Push notifications
- Offline access
- App shortcuts
- Web Share API
- Service Workers
- One code base for all platforms
- Precache and background cache for faster load times

However, not all these features are available and consistent across platforms and browsers, contributing to the slow adoption of PWAs by businesses. Many companies and developers still manage multiple code bases to ensure their presence online where consumers expect them to be. Often, these "apps" are little more than shells with an embedded web view that renders the website. This highlights the problem of discoverability. There are ways to get your PWA on official app stores, but it is not always easy and often requires an additional build process or a separate repository/codebase. It should not be this way. You should be able to list your PWA alongside native apps in the same app stores users use. Currently, Microsoft on Windows is the only company addressing this issue.

The phrase is, "There is an app for that," not, "There is a PWA for that." I do believe there is a future for PWAs, but a lot of work is needed from both developers and browser makers to make this happen.

## Building the App

I joined the project with a significant portion of the foundation already laid. Some of the pieces in place were:

- Basic application structure using a homegrown codebase based on ES6 modules
- The design portion of the application was [Webflow](https://webflow.com/) driven and so, we also had jQuery as part of the codebase
- [Workbox](https://developers.google.com/web/tools/workbox/)
- [Parcel bundler](https://parceljs.org/)

After some tweaking and experimentation, we landed on a pretty good developer workflow with the following npm scripts:

```json
"build:dev": "parcel serve -p 3000 ./src/index.html --public-url / --no-cache --open",
"clean": "yarn del dist",
"dev": "yarn clean && yarn build:dev",
```

This ensures the code is rebuilt every time you make a change. The caveat is that it does not rebuild or inject the service worker. We have not yet found a way to automate this. So, when you need to work on something that depends on the service worker, you must follow a less-than-ideal process:

```json
"build": "yarn build:parcel && yarn workbox:inject",
```

Followed by:

```json
"serve-http": "http-server -d false -c-1 --proxy http://localhost:8080? dist",
```

Whenever you make a code change, you need to kill the server, and rerun both commands:

```bash
yarn build && yarn serve-http
```

Not the worst thing in the world, but it would be great if there was a way to do this automatically. Perhaps if we started with a framework such as [React](https://reactjs.org/) or [Vuejs](https://vuejs.org/) with a bootstrap such as [Create React App](https://create-react-app.dev/)(in the case of React), a lot of this might be taken care of automatically. Definitely a lesson learned. 🙃

### Workbox

Workbox offers a lot and it is a great way to get started. It is a service worker that is used to cache assets and serve them from the cache. It is also used to serve the service worker. With that said, the documentation is a bit lacking and you really need to just experiment until you find what works.

We ended up using the [`workbox:inject`](https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-webpack-plugin.InjectManifest) script along with the following Workbox config file for precaching:

```js
module.exports = {
  globDirectory: "dist/",
  globPatterns: [
    "**/*.{css,html,eot,svg,ttf,woff,woff2,png,jpeg,jpg,ico,js,webmanifest}",
  ],
  swDest: "dist/service-worker.js",
  swSrc: "src/service-worker.js",
};
```

We chose this approach over letting Workbox completely generate the service worker because we wanted more control over it. For example, we had no way of telling Workbox about some third-party libraries we needed to precache using the config alone. This meant that for the longest time, we were scratching our heads wondering why some UI elements would not load offline. Thankfully, Workbox offers a simple way to cache third-party dependencies and load them the first time the app is opened:

```js
// enable the ability to cache assets from third party
// external domains using a StaleWhileRevalidate strategy
workbox.routing.registerRoute(
  ({ url }) =>
    url.origin === "https://kit.fontawesome.com" ||
    url.origin === "https://d3e54v103j8qbb.cloudfront.net" ||
    url.origin === "https://fonts.googleapis.com" ||
    url.origin === "https://fonts.gstatic.com",
  new workbox.strategies.StaleWhileRevalidate(),
);
```

For these, we use a [`StaleWhileRevalidate` strategy](https://web.dev/stale-while-revalidate/). However, another critical third-party dependency is Workbox itself. For this, we used the [`CacheFirst` strategy](https://developers.google.com/web/tools/workbox/modules/workbox-strategies#cache_first_cache_falling_back_to_network). Since we are requesting a specific version of Workbox, the dependency is unlikely to change. If we bump the version of Workbox, it will be a new dependency, and Workbox will do a `NetworkFirst` request. Also, we will likely bump the version of the service worker and clear the cache completely.

```js
// workbox
workbox.routing.registerRoute(
  ({ url }) => url.origin === "https://storage.googleapis.com",
  new workbox.strategies.CacheFirst(),
);
```

With all of that in place, we were in pretty good shape regarding the [app shell when offline](https://developers.google.com/web/fundamentals/architecture/app-shell).

### Additional reading and resources

- [muni-portal-frontend](https://github.com/OpenUpSA/muni-portal-frontend/)
- [Deep dive into the install flow](https://www.youtube.com/watch?v=kzJfiKQyD24)
- [PWACompat: the Web App Manifest for all browsers](https://developers.google.com/web/updates/2018/07/pwacompat)
- [Chrome Labs PWACompat](https://github.com/GoogleChromeLabs/pwacompat)
- [If you want something, tell them](https://medium.com/dev-channel/progressive-web-app-progress-in-ios-12-2-beta-1-build-16e5181f-a18cd05ca361#4fab)
- [PWABuilder](https://www.pwabuilder.com/)
