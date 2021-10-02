---
title: Progressive Web Apps in 2021
description: Some thoughts on the current state and challenges with regards to building a PWA in 2021
template: _base.html
---

# Progressive Web Apps in 2021

Let me caveat everything in this post with, I am by no means a [progressive web application](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) expert. I worked with [OpenUP](https://openup.org.za/) to build a PWA for the municipality of [Cape Agulhas](https://en.wikipedia.org/wiki/Cape_Agulhas), and have learned a lot which I am happy to share.

## Setting the scene

Progressive web applications(PWA) holds a lot of promise for the web along with the resurgence of web components. The real problem with the PWA ecosystem is not so much the underlying technologies and specifications, although there are definitely issues here. The biggest problem is the ecosystem. Here I am referring to discovery and the user experience of installing a PWA. There is definitely also a disconnect between the concept of "installing" a website on your mobile device or desktop via a browser. It is just not something general users think about.

So much so, that Mozilla decided to remove the ability completely from Firefox on the desktop. To be clear, it was never released in a public release of Firefox. It was only available as a prototype(there is an option to enable this in Firefox via (FirefoxPWA)[https://github.com/filips123/FirefoxPWA]). The question then becomes, are PWA's a mobile only target? Thing is, that question is actually not entirely a good one, because we are really only talking about one aspect of a PWA. Even though it is always mentioned as one of the core pieces of a PWA, it not being installable from a single browser on a single platform really does not break the contract in my mind. There is so much more that makes a PWA useful for end users.

- Push notifications
- Offline access
- App shortcuts
- Web Share API
- Service Workers
- One code base for all platforms
- Precache and background cache for faster load times

To be honest though, not all those features are available and consistent across platforms and browsers and in that lies part of the problem of the slow adoption of PWA's by business. That is why a lot of companies and developers still manage three or four code bases just to ensure their presence online is available where consumers expect them to be. Even though often the "apps" is not much more than a shell with an embedded web view that renders the website. Here I hint at the problem of discoverability. There are ways, means and hoops you can jump through as a developer to get your PWA on the official app stores, but it is not always easy, and often requires an additional build process or, again, a separate repo/codebase. It should not have to be like that. You should just be able to list your PWA alongside native apps in the same app stores users use. I believe the only company that has addressed this is currently Microsoft on Windows.

The phrase is, "There is an app for that" not, "There is a PWA for that". To be clear though, I do believe there is a future here, but there is still a lot of work needed from both developers and browser makers to make this happen.

## Building the App

I came into the project with quite a bit of the foundation already laid. Some of the pieces that was in place were:

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

This ensures that the code is rebuilt every time you make a change. The caveat here is, it does not rebuild or inject the service worker. We have as yet not found a way to make this happen. So, when you do need to work on something that depends on the service worker, you have a bit of non-ideal process you need to follow. You first need to run:

```json
"build": "yarn build:parcel && yarn workbox:inject",
```

Followed by:

```json
"serve-http": "http-server -d false -c-1 --proxy http://localhost:8080? dist",
```

Whenever you make a code change, you need to kill the server, and rerun both commands, i.e.:

```bash
yarn build && yarn serve-http
```

Not the worst thing in the world, but it would be great if there was a way to do this automatically. Perhaps if we started with a framework such as [React](https://reactjs.org/) or [Vuejs](https://vuejs.org/) with a bootstrap such as [Create React App](https://create-react-app.dev/)(in the case of React), a lot of this might be taken care of automatically. Definitely a lesson learned. 🙃

### Workbox

Workbox offers a lot and it is a great way to get started. It is a service worker that is used to cache assets and serve them from the cache. It is also used to serve the service worker. It is a great way to get started with the service worker. With that said, the documentation is a bit lacking and you really need to just experiment until you find what works.

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

The decision to use this instead of letting Workbox completely generate the service worker was because we wanted a bit more control over the service worker itself. For example, using the config, we had no way of telling Workbox about some third-party libraries we needed to precache. This meant that for the longest time, we were scracthing our heads wondering why some of the UI elements would not load offline. Thankfully Workbox does offer a simple way to tell it about the third-part dependencies and have it load and cache them the first time the app is opened:

```js
// enable the ability to cache assets from third party
// external domains using a StaleWhileRevalidate strategy
workbox.routing.registerRoute(
  ({ url }) =>
    url.origin === "https://kit.fontawesome.com" ||
    url.origin === "https://d3e54v103j8qbb.cloudfront.net" ||
    url.origin === "https://fonts.googleapis.com" ||
    url.origin === "https://fonts.gstatic.com",
  new workbox.strategies.StaleWhileRevalidate()
);
```

For these we use a [`StaleWhileRevalidate`](https://web.dev/stale-while-revalidate/) strategy but, there is another critical third-party dependency we have, Workbox itself 😄. For this one, we used the [CacheFirst](https://developers.google.com/web/tools/workbox/modules/workbox-strategies#cache_first_cache_falling_back_to_network) as we are requesting a specific version of Workbox, the dependency is unlikely to ever change. Should we bump the version of Workbox, it will be a new dependency and Workbox will do a `NetworkFirst` request. Also, we will most likely bump the version of the service worker and just blow away the cache completely.

```js
// workbox
workbox.routing.registerRoute(
  ({ url }) => url.origin === "https://storage.googleapis.com",
  new workbox.strategies.CacheFirst()
);
```

With all of that in place, we were in pretty good shape as far as the [app shell](https://developers.google.com/web/fundamentals/architecture/app-shell) is concerned when offline.

### Additional reading and resources

- [muni-portal-frontend](https://github.com/OpenUpSA/muni-portal-frontend/)
- [Deep dive into the install flow](https://www.youtube.com/watch?v=kzJfiKQyD24)
- [PWACompat: the Web App Manifest for all browsers](https://developers.google.com/web/updates/2018/07/pwacompat)
- [Chrome Labs PWACompat](https://github.com/GoogleChromeLabs/pwacompat)
- [If you want something, tell them](https://medium.com/dev-channel/progressive-web-app-progress-in-ios-12-2-beta-1-build-16e5181f-a18cd05ca361#4fab)
- [PWABuilder](https://www.pwabuilder.com/)
