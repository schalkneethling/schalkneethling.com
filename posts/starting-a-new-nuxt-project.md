---
title: Starting a new Nuxtjs project
description: A run through starting a new Nuxtjs project and creating a landing page
---

I have been toying with a side-project for some time now called [Ourbackyard.co.za](https://ourbackyard.co.za). When I started it I wanted to quickly get something in front of users to get a sense of the interest in the idea. I wrote everything using [Expressjs](expressjs.com/), [Pug templates](https://pugjs.org/) and [SASS](https://sass-lang.com/). I also used [Auth0](https://auth0.com/) for authentication and am hosting the [MongoDB](https://www.mongodb.com/) database on [Atlas](https://www.mongodb.com/atlas).

There is absolutely nothing wrong with any of this, and some of the pieces will remain. My intention was always to adopt a modern framework if the idea showed promise. I also wanted to separate the front-end from the back-end, with Express being used expressly as an API server which talks to the MongoDB instance on Atlas.

After considering the options out there I decided to stick with my original decision to rewrite the front-end using [Nuxtjs](https://nuxtjs.org/). I _really_ like [Vue.js](https://vuejs.org) and prefer its conventions and stylistic choices over [React](https://reactjs.org/). I do use React and I am particularly interested in the new [Remix](https://remix.run) framework which is built on top of React. For this project though, I am sticking to my original decision and going with Nuxtjs.

As I am going to be learning Nuxtjs, as well as Vue.js for that matter, I thought I would share my journey with you. And so, here we are. Without further ado, let's get started shall we?

> NOTE: To follow along you will need Nodejs installed. The best way to install Node is with either [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) or [nvs](https://github.com/jasongin/nvs). I will also be using [Yarn](https://yarnpkg.com/), but feel free to use [NPM](https://www.npmjs.com/) if it is your tool of choice.

## Bootstrapping the project

As with all frameworks, Nuxt comes with a number of useful conventions and utilities. The first of these we will use is [create-nuxt-app](https://github.com/nuxt/create-nuxt-app) which we will use to create a new Nuxt project. I am first going to change directory into my `dev` folder:

```bash
cd ~/mechanical-ink/dev
```

> NOTE: I am not creating a folder for the project, I am simple changing directory into the parent directory. Creation of the project directory will be handled by `create-nuxt-app`.

I will first make sure that I am using version 16 of Node:

```bash
nvm use 16
```

The above should output something like:

```bash
Now using node v16.13.1 (npm v8.1.2)
```

Next we [create out Nuxt project](https://nuxtjs.org/docs/get-started/installation#using-create-nuxt-app):

```bash
yarn create nuxt-app ourbackyard-frontend
```

Nuxt is going to ask you a couple of questions to get everything set-up just the way you need it. My answers were as follows:

- Project name: ourbackyard-frontend
- Programming language: JavaScript
- Package manager: Yarn
- UI Framework: None
- Nuxt.js modules: Axios and PWA
- Linting tools: ESLint, Prettier, Lint staged files, StyleLint, Commitlint
- Testing framework: Jest
- Rendering mode: Universal (SSR / SSG)
- Deployment target: Static (Static/Jamstack hosting) - I intend to host the front-end on Netlify.
- Development tools: jsconfig.json, Sematic pull requests, Dependabot
- Continuous integration: GitHub Actions
- GitHub username: schalkneethling
- Version control system: Git

And off it goes! It will now do its thing and get the project created and set-up.

> NOTE: You can read additional information about your [choices under the features documentation](https://github.com/nuxt/create-nuxt-app/blob/master/README.md#features-tada).

Once completed, you should see something like the following:

```bash
🎉  Successfully created project ourbackyard-frontend

  To get started:

	cd ourbackyard-frontend
	yarn dev

  To build & start for production:

	cd ourbackyard-frontend
	yarn build
	yarn start

  To test:

	cd ourbackyard-frontend
	yarn test

✨  Done in 700.11s.
```

Following the steps to get started and opening `http://localhost:3000` should show the default Nuxtjs landing page. Neat!

Opening the project in your editor of choice will show a number of files and folders. We will touch on the purpose of these as we go along. One thing to do before we go further is to delete `components/Tutorial.vue`, `components/NuxtLogo.vue`, and `test/NuxtLogo.spec.js`.

> NOTE: If you are using [VSCode](https://code.visualstudio.com/), I highly recommend you install [Vue VSCode Snippets](https://marketplace.visualstudio.com/items?itemName=sdras.vue-vscode-snippets) by [Sarah Drasner](https://twitter.com/sarah_edo).

## Rounding the basis

Before we dive into creating components, we need to do some global setup. First, let’s create our default layout. This will be the layout that is used for all pages that do not specify a layout.

At the root of the project, create a `layouts/default.vue` file with the following content:

```js
<template>
  <Nuxt />
</template>
```

That is the minimum we need to have here. We will build this out a bit more soon though. You can also read more about [layouts in the Nuxtjs documentation](https://nuxtjs.org/docs/directory-structure/layouts/).

Next we will update our `nuxt.config.js`. This is the brains of the operation and one of the most important files in a Nuxt project. The first configuration we want to change is the `title`. Currently it is using the `name` from `package.json` as the title.

```js
head: {
  title: 'Welcome to Ourbackyard.co.za - Connecting people with local businesses',
```

I am also going to change the `meta description`:

```js
meta: [
  {
    hid: "description",
    name: "description",
    content: "A platform to connect people with local businesses",
  },
];
```

For this project I use the Poppins font family. If you are loading your font family from say [Google fonts](https://fonts.google.com), you should configure the `link` element that will load it inside Nuxt config. I might change my mind later but for now, I am going to go ahead and do just that.

If you are doing the same, Google fonts will provide you with some HTML you can use to load your chosen font(s). Something like the following:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;300;600;800&display=swap"
  rel="stylesheet"
/>
```

In Nuxt config, we will update the existing `link` property to the following:

```js
link: [
  { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossorigin: 'true',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@100;300;600;800&display=swap',
  },
],
```

I also need to set up some global styles. Firstly I will create a folder named `assets` at the root of the project and a folder named `sass` inside it. To get started, I will only have a `main.scss` file in the `sass` folder that set some very basic styles and includes a [reset stylesheet](https://hankchizljaw.com/wrote/a-modern-css-reset/) which I store inside `assets/sass/lib`.

I Nuxt config, we define our global style using the `css` property:

```js
// Global CSS: https://go.nuxtjs.dev/config-css
css: ["~/assets/sass/main.scss"],
```

> NOTE: The tilde(~) is a special character that tells Nuxt to look for the file starting at the base(root) directory of the project.

In the `static` folder I am also going to update the `favicon.ico` and `icon.png` to the correct versions I already have prepared. If you now stop and restart the development server, you will find that the build fails. This is because, while you can use SASS with Vue and Nuxt, the CLI did not install the dependencies for SASS by default.

To fix this, run the following in your terminal:

```bash
yarn add -D sass sass-loader@10.1.1
```

> NOTE: You will see that I specified a specific version for `sass-loader`. At the time of writing, this is the version that Nuxt expects. Installing a never version will not work.

Running `yarn dev` now should work as before. To confirm that everything is loading as expected, open up the `index.vue` file inside the `pages` folder. Remove the `<Tutorial />` component and replace it with the following:

```html
<h1>Welcome to Ourbackyard.co.za</h1>
```

If you inspect the `h1` you should see that it is using whichever font family and style you have set in your global styles.

## Creating the header and footer

Ok, let’s dig into some components. Inside the `components` folder go ahead and create a new file called `SiteHeader.vue`. As I am focusing on things relevant to Ourbackyard, I won’t share to much code here as it will probably irrelevant to you. With that said, here is your first opportunity to use one of the Vue snippets if you are using VSCode. With the new file open, type `vbase`. When it is highlighted, hit enter. You should now have code similar to the following:

```vue
<template>
  <div></div>
</template>

<script>
export default {};
</script>

<style lang="scss" scoped></style>
```

> NOTE: The `scoped` attribute above is not a standard HTML attribute but [is used by `vue-loader` to allow scoped CSS](https://vue-loader.vuejs.org/guide/scoped-css.html). In other words, CSS that will only be applicable to the current component. If you have used other framework, you might appreciate the simplicity of this. Also, if you are _not_ using SASS, you should change the value of the `lang` attribute to say `css`.

Once you are have the basics in place for you site header, we need to add it to our default layout. Open up the `layouts/default.vue` file and add the following after the closing `template` tag:

```html
<script></script>
```

Inside the `script` tag type `vimport` and select `vimport-export` from the options. This should add the following snippet:

```js
import Name from "@/components/Name.vue";

export default {
  components: {
    Name,
  },
};
```

There will also be three active cursors. Select the `Name` text and replace it with `SiteHeader` to end up with:

```js
import SiteHeader from "@/components/SiteHeader.vue";

export default {
  components: {
    SiteHeader,
  },
};
```

Next, update the `template` code to the following:

```vue
<template>
  <div class="site-wrapper">
    <SiteHeader />
    <Nuxt />
  </div>
</template>
```

Here is my basic `SiteHeader` component:

```vue
<template>
  <header class="site-header">
    <h1 class="logo">
      <a href="/">
        <span class="visually-hidden">Ourbackyard.co.za</span>
      </a>
    </h1>
  </header>
</template>

<style lang="scss" scoped>
.logo {
  &::before {
    background: transparent url("~/assets/media/logo.svg") center center
      no-repeat;
    content: "";
    display: block;
    height: 100px;
    width: 370px;
  }
}
</style>
```

If your server has been running, it should have reloaded and you should now see the header. If not, start-up your server and reload you landing page.

For the site footer you are going to follow the exact same steps and you should end up with a `template` like this:

```vue
<template>
  <div class="site-wrapper">
    <SiteHeader />
    <Nuxt />
    <SiteFooter />
  </div>
</template>
```

Sometimes you constrain the maximum width of you `site-wrapper` to say `1400px`(`87.5em`) but, you do not want to constrain the footer. In that case your `template` can look like this:

```vue
<template>
  <div class="site-wrapper">
    <SiteHeader />
    <Nuxt />
  </div>
  <SiteFooter />
</template>
```

This is where I will end it for the first portion of this series. I hope you learned something useful. Stay tunes for the next installment.
