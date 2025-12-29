---
title: Starting a Vue Project with Vite
pubDate: 2022-09-01
description: This post will look at starting a new Vue project using the Vite toolchain.
author: "Schalk Neethling"
tags: ["vuejs"]
---

This post will look at starting a new Vuejs project using the Vite frontend toolchain.

## What is Vite?

In short, Vite (The French word for fast) is similar to tools such as vue-cli, but it is framework agnostic and much faster. Why?

Vite relies on modern JavaScript features such as [Ecmascript modules (ESM)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) and the [esbuild](https://esbuild.github.io/) bundler. When we write our code using ESM the bundler no longer needs to do all the processing it had to do when our source code was written using Asynchronous Module Definition ([AMD](https://requirejs.org/docs/whyamd.html)) or [Commonjs](https://requirejs.org/docs/commonjs.html).

With ESM, Vite will send our entry point file linked to in the HTML to the browser as-is. For example:

```js
<script type="module" src="./main.js"></script>
```

The browser will then make separate HTTP requests (if applicable) for each `import` statement (our dependencies) inside this entry file. The Vite dev-server will respond to these requests without any processing before the response, providing instantaneous updates to the page as you write your code. Hot updates also apply to CSS, further improving your developer experience and productivity. All of this is available even as our codebase grows. I'll let [Even You](https://github.com/yyx990803) take it from here.

[https://www.youtube.com/watch?v=DkGV5F4XnfQ](https://www.youtube.com/watch?v=DkGV5F4XnfQ)

## Prerequisites

Before starting with Vite, you must have [Node.js](https://schalkneethling.com/posts/installing-node-and-managing-versions) installed on your machine. This also includes `npm`, which we will use in our next step.

## Getting Started with Vite

As mentioned earlier, Vite is framework agnostic. In this post, however, we will use it to start a new [Vue](https://vuejs.org/) project using the provided Vue project template. We will be using `npm`, but you can achieve the same result using [Yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/).

> Note: You can determine the installed npm version by running `npm -v`

```bash
# npm 6.x
npm create vite@latest getting-started --template vue

# npm 7+ - note the extra double-dash (--)
npm create vite@latest getting-started -- --template vue
```

Once you run the above command, you will see output similar to the following:

```bash
Scaffolding project in ...

Done. Now run:

cd getting-started
npm install
npm run dev
```

Once the `dev` command completes, open the provided URL in your browser. You should see a page with the Vite and Vuejs logos, links, and additional information.

## What did Vite do?

Vite created a new Vuejs project with a basic structure and scaffolding. Let’s look at some of the files that were added to the project.

## Vite config

You will find the Vite config file at the project's root.

```js
// vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
});
```

All the config currently does is enable support for Vue through the [Vue plugin](https://github.com/vitejs/vite-plugin-vue/tree/main/packages/plugin-vue). There is one additional piece of configuration I recommend. Change your configuration to match the following:

```js
import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [vue()],
});
```

This allows you to use the following syntax when importing resources and components.

```js
import MyModule from "@/components/atoms/MyComponent.vue";
```

As you might infer from the configuration entry, the `@` symbol will always resolve to the root of the `src` directory. This means that no matter where in the source tree your component is, you can always use `@` to refer to `src` and then resolve the rest from there. This helps situations such as these:

```js
import MyComponent from "../../../components/atoms/MyComponent.vue";
```

This also means you can copy and paste resources from any file to any other file and the path will resolve successfully.

## Package scripts

Vite created some script targets in the `package.json` file. These are clear and understandable, so I will briefly touch on them. While developing locally, you will [start the development server](https://vitejs.dev/guide/cli.html#vite) using `npm run dev`. When [deploying to production](https://vitejs.dev/guide/cli.html#build), you will specify the `npm run build` script as the command to execute. This will build the production-ready assets in the `dist` folder, which would be the directory that your host serves.

If you want to [preview a production build](https://vitejs.dev/guide/cli.html#vite-preview) locally, you will run `npm run preview`.

## Source files

### Our entry point

You will also find the `index.html` file at the project's root, essentially our entry point. This file is minimal in nature, and most of this file should be familiar to you. There are three items to call out here.

```html
<link rel="icon" type="image/svg+xml" href="/vite.svg" />
```

This image will be used as the [favicon](https://favicon.io/tutorials/what-is-a-favicon/) in browsers that [support using an SVG](https://caniuse.com/link-icon-svg) for this purpose. The other interesting topic to address here is where this file is located. The `vue.svg` is located in `src/assets`, and the `vite.svg` file is located in the `public` folder at the project's root.

Here is the purpose of the `public` folder [according to the docs](https://vitejs.dev/guide/assets.html#the-public-directory):

> If you have assets that are:
>
> - Never referenced in source code (e.g. `robots.txt`)
> - Must retain the exact same file name (without hashing)
> - ...or you simply don't want to have to import an asset first just to get its URL
>
> Then you can place the asset in a special `public` directory under your project root.

I would say the reason why the `vite.svg` is placed inside `public` here, even though it is referenced in the source, is related to the second bullet point. If it were placed inside the `assets` folder, it would have a hashed file name, and the reference in the `index.html` file would not succeed and result in a [404 error](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404).

### The app container element

```html
<div id="app"></div>
```

This is the container for our Vue app. If you open `main.js` inside the `src` directory, you will see this line:

```js
createApp(App).mount("#app");
```

We create our `App` instance and then `mount` it inside our app container referenced by the `id` of `app`.

### Our JavaScript entry point

The last point of interest is the following line:

```html
<script type="module" src="/src/main.js"></script>
```

As the code suggests, this imports the `main.js` file we just looked at. It also identifies this to be of a `module` type. This means that Vite will expect our source code to be written using ESM, as discussed earlier in this post.

### The src directory

We have already briefly examined the `main.js` file inside the `src` directory. We won't be examining the details of each file here, but rather getting a basic understanding. At the top of the `src` directory is our `assets` directory.

Unlike assets saved in the `public` directory, assets saved in this directory will get hashed filenames, be part of the build assets graph, and can be processed by plugins for optimization. There are several other topics to keep in mind so it is a good idea to [read the official docs](https://vitejs.dev/guide/assets.html#importing-asset-as-url).

The next directory is the `components` directory. It is a convention in Vue projects to place all of your individual components within this `components` folder and, from there, follow their [recommended file naming conventions](https://vuejs.org/style-guide/).

`App.vue` is our parent (or grandparent 😁) component. From here, we will import our top-level components. In this case, the one component we import is the `HelloWorld.vue` component from our components directory.

You will notice that it is imported as follows:

```js
import HelloWorld from "./components/HelloWorld.vue";
```

Nothing wrong with that, but if you added the additional configuration mentioned earlier, you can import the component as follows:

```js
import HelloWorld from "@/components/HelloWorld.vue";
```

The remaining file in our `src` directory is the `style.css` file. This contains our global, non-scoped styles and is imported inside `main.js`. The classes and rules defined here will apply and is available to the entire application.

### The .vscode directory

The contents of this directory will only be of interest if you use the [VSCode](https://code.visualstudio.com/) editor. Here is a single `extensions.json` file with an array of recommendations. This lists (at the time of writing) two recommended extensions by the Vue team. The [Volar extension](https://marketplace.visualstudio.com/items?itemName=Vue.volar) is highly recommended while the second recommendation will mostly be useful to you if you are using [TypeScript](https://code.visualstudio.com/Docs/languages/typescript) or TypeScript annotations.

### Build assets

Before we end this post, let us take a quick look at what happens when we run the production build script. In your terminal, execute the following command.

```bash
npm run build
```

You should see the output in your terminal similar to the following.

```bash
vite v4.0.3 building for production...
✓ 16 modules transformed.
dist/index.html                  0.45 kB
dist/assets/vue-5532db34.svg     0.50 kB
dist/assets/index-2a0f3dfe.css   1.29 kB │ gzip:  0.66 kB
dist/assets/index-bca36975.js   54.21 kB │ gzip: 21.89 kB
```

In the newly created `dist` directory, you will find our `index.html` file. When you open this file, you will notice two differences to our `index.html` at the project’s root.

```bash
<script type="module" crossorigin src="/assets/index-bca36975.js"></script>
<link rel="stylesheet" href="/assets/index-2a0f3dfe.css">
```

Our `script` tag has been hoisted into the `head` of the document. Vite has also [added a `crossorigin` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) and updated the name of the JavaScript file based on its new hashed filename. It also now includes a hashed `style.css` file containing all of our CSS style rules.

The JavaScript file contains all of the JavaScript that makes up our current single-page website. You will also notice that the `vue.svg` file has been added here, but the file name is also hashed. This then is everything that is needed to serve our webpage to end-users. In total, this makes up ~24 kilobytes (kb) of data transferred to our end-users.

This number is small at the moment but _will_ grow and is something we need to keep a close eye on.

### Conclusion

Vite is fast and easy to use, enhances the developer experience, and generally produces smaller bundle sizes than other build tools. I hope that you have found this introduction to Vite useful and that, the next time you start a Vue project, you will give Vite a try.
