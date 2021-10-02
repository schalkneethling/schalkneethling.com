---
title: Adding a logo, navigation, and search to our header
description: We go through adding a logo, navigation, and simple search to our header
template: _base.html
---

# Adding a logo, navigation, and search to our header

Before we dig into the code today, we have a few configuration related items to take care of.

## Introduction to Web Development Extension Pack

I created an extension pack for this web development course that packs a number of VSCode extension I reckon you will all find useful. To install the extension pack click the link below.

- [Introduction to Web Development Extension Pack](https://marketplace.visualstudio.com/items?itemName=MechanicalInk.intro-to-webdev-extenstion-pack)

Click on the "Install" button and follow the prompts. The list of extensions this will be installed by this extension pack is listed on the above page.

## Editor configuration and linting

I have previously mentioned [Prettier](https://prettier.io/) and you might have already added the `.prettierrc.json` file to your project. Whether you have or have not, we are going to use a tool called [Project Calavera](https://github.com/project-calavera/project-calavera/) to add a couple of configuration files and Nodejs packages to our project.

> NOTE: If you have not previously installed Yarn, now would be a good time to do so:
>
> You might even need to first install Nodejs itself first. See: [Nodejs](https://nodejs.org/en/download/) or
> if you are using WSL on Windows, [follow the instructions here](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl). Once you have Nodejs, run the command below to install Yarn.
>
> ```bash
> npm install -g yarn
> ```

You project should already have a `package.json` file but, if it does not, run the following after having installed Yarn:

```bash
yarn init -y
```

The above will create a `package.json` file for you. The `-y` flag is used to skip the prompts and tells Yarn to use some good defaults. With all of this in place, open up your `package.json` file and add the following:

```json
"calavera": {
    "css": true
}
```

The above tells Project Calavera that you want the configuration and linting tools used with CSS. Next run the following:

```bash
npx project-calavera@latest
```

This will take a minute or so, and will then output the following to the terminal:

```bash
npx: installed 28 in 5.795s
✔  success   [Calavera] Skeletons written to project successfully
ℹ  info      [Calavera] Run the following command to install dependencies: yarn add -D stylelint stylelint-a11y stylelint-config-recommended prettier stylelint-config-prettier stylelint-prettier
```

You will also notice that a few files have been added to the root of your project:

- `.editorconfig`
- `.prettierignore`
- `.prettierrc.json`
- `.stylelintignore`
- `.stylelintrc`

The [`.editorconfig`](https://editorconfig.org/) file is a configuration file that is recognized by most, if not all, code editors and sets up some basic configuration for you. The `.prettierignore` file is used to tell Prettier about certain files you want it to ignore. The current file contains just two entries which are [recommended by the Prettier project](https://prettier.io/docs/en/install.html). The `.prettierrc.json` file is a configuration file for Prettier. Here we are just accepting all the default code formatting options Prettier provides out of the box. The `.stylelintignore` file is a file that tells Stylelint to ignore certain files CSS files. Currently it will ignore anything that is inside the folder `css/libs`. The `.stylelintrc` file is a configuration file for [Stylelint](https://stylelint.io/).

A linter is a piece of software that checks your code to avoid common errors and ensure your code follows established best practices. From there website:

> A mighty, modern linter that helps you avoid errors and enforce conventions in your styles.

Finally, you will have noticed that Project Calavera output the following line:

```bash
ℹ  info      [Calavera] Run the following command to install dependencies: yarn add -D stylelint stylelint-a11y stylelint-config-recommended prettier stylelint-config-prettier stylelint-prettier
```

Copy and paste the line starting with `yarn` into your terminal and run it:

```bash
yarn add -D stylelint stylelint-a11y stylelint-config-recommended prettier stylelint-config-prettier stylelint-prettier
```

This will install the Nodejs packages for Prettier and Stylelint which will be used by VSCode when formatting and linting our files. And that is it for the configuration steps. Now we are ready to start coding.

> NOTE: You might notice that VSCode started to show some linting errors in your CSS. We will discuss and address these as we encounter them.

## Add a new container for our search bar

Open up your `index.html` file and add the following inside the `header` element just after our `nav` element:

```html
<form
  class="header-search"
  name="search"
  action="https://duckduckgo.com/"
  method="get"
  role="search"
></form>
```

There are a few new attributes on the `form` element. Let’s take a look at them. the `name` attribute is used to identify the form. The `action` attribute is used to specify the URL to which the form will be submitted. The `method` attribute is used to specify the HTTP method to use when submitting the form. We specify `GET` here, but there are [a number of HTTP methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) you can specify. The most commonly used with HTML forms are `GET` and `POST`. The `role` attribute is used to indicate to assistive technologies that this is a search form.

Open up `main.css` and add the following:

```css
.header-search {
  background-color: #076794;
  min-height: 50px;
}
```

Then inside the media query, add the following:

```css
/* add the header-search class to this rule block */
.header-logo-container,
.main-navigation-container,
.header-search {
  min-height: initial;
}

.header-search {
  flex: 0 1 300px;
}
```

Open up the `index.html` file in your browser using Live server and you should see the following:

![Screen shot of the new header in the browser showing a small pink block and a larger blue block and a small dark blue block](/assets/media/logo-navigation-search/updated-header-with-seach-container.png)

## Adding the logo

Inside the root of your project create a new folder called `assets` and copy your logo file into it. In `main.css` update `header-logo-container` outisde the media query to the following:

```css
.header-logo-container {
  background: transparent url("../assets/schalkneethling-logo.svg") center
    center no-repeat;
  background-size: contain;
  height: 158px;
  width: 100%;
}
```

In the above we use the `background` short hand to set the background color to transparent. The `url` is used to specify the image we want to use as the background image. Here I use `schalkneethling-logo.svg` linked using a relative path. We set the image to be centered in the container and set `no-repeat` to prevent the image from repeating. The `background-size` is used to set the size of the image. In this instance we set it to `contain`. This simply means that the image should be sized proportionately to always fit its container.

Next we set the actual desired `height` and `width` of the container. On mobile, we should now see the following:

![Screen shot of the header with the logo centered on mobile](/assets/media/logo-navigation-search/logo-mobile.png)

Inside the media query, update the `.header-logo-container` selector to the following:

```css
.header-logo-container {
  background-position: 0 0;
  flex: 0 1 200px;
  height: 79px;
  width: initial;
}
```

Here we set the background position to top-left instead of centered. We reset width to `initial` as `flex-basis` will now take over and we half the `height` of the container. Resizing the window to a larger viewport should now result in the following:

![Screen shot of the header with the logo left aligned on tablet](/assets/media/logo-navigation-search/logo-tablet.png)

## Adding the navigation

Back in our `index.html` file, add the following inside the `nav` element:

```html
<ul class="main-navigation">
  <li><a href="about">About</a></li>
  <li><a href="portfolio">Portfolio</a></li>
  <li><a href="contact">Contact</a></li>
</ul>
```

> TIP: [Emmet](https://emmet.io/) is bundled with VSCode by default and provide some nice short codes to quickly create HTML elements. For example, to create the basis of a list such as the once above you can type: `ul>li*3>a` and then press tab.

If you now reload your `index.html` page you should see something like the following:

![Screen shot of the header with the logo and navigation](/assets/media/logo-navigation-search/header-with-navigation.png)

Let’s jump into `main.css` and add some styling to make the navigation look more presentable. We will first look at mobile. Add the following just before the media query:

```css
.main-navigation {
  list-style: none;
  margin: 0;
  padding: 0;
}
```

The `list-style` turns off the default bullets that are shown for list items. We then reset the `margin` and `padding` to `0` to remove any default spacing.

```css
main-navigation a {
  color: #212121;
  display: block;
  padding: 12px;
}
```

Next we set our hyperlinks to `block` so that it will take up the full width of the container and allow us to set `padding` and possible `margin`. We also change the color of the hyperlinks to `#212121`, a dark grey.

```css
.main-navigation a:hover,
.main-navigation a:focus {
  text-decoration: none;
}
```

Next we add styling for the hover and focus states using the `:hover` and `:focus` psuedo classes. All we do here is remove the underline from the links to clearly indicate which hyperlink currently has focus. For larger viewports, all we need to add is the following to the media query:

```css
.main-navigation {
  display: flex;
  justify-content: space-around;
}
```

The items are not aligned quite right so we use the `justify-content` property to align them. Inside the media query we add the following:

```css
.page-header {
  align-items: center;
  display: flex;
  margin: 24px;
}
```

We use `align-items` to align everything inside the flex container to the center, and while we are in here, we add a bit of margin around the header. With that, we now have a very basic navigation bar.

## The search form

The elements we need to add are the search input element and the submit button. Add the following inside the `form` element:

```html
<input type="search" name="q" placeholder="Search" />
<button type="submit">submit</button>
```

Next jump back into `main.css` and add the following(remove any previous style blocks for `.header-search`):

```css
.header-search {
  background-color: #e5ebee;
  padding: 12px;
  width: 100%;
}
```

Next we want to give some breathing room to the search input. We will add the following:

```css
.header-search [type="search"] {
  padding: 12px;
}
```

For our button we want to add a thin border, change its cursor to be the more common pointer(hand with the pointing index finger), and add the same amount of padding we added to the input field:

```css
.header-search [type="submit"] {
  border: 1px solid #212121;
  cursor: pointer;
  padding: 12px;
}
```

Finally we want to add different styling for the hover, focus, and active states off the button. We will add the following:

```css
.header-search [type="submit"]:hover,
.header-search [type="submit"]:focus,
.header-search [type="submit"]:active {
  background-color: #212121;
  color: #fff;
}
```

On mobile you should now see something like the following:

![Screen shot of the header on mobile with logo, navigation, and search form stacked](/assets/media/logo-navigation-search/header-mobile.png)

When you extend the viewport size beyond mobile, the layout will change to a horizontal layout. This layout is by no means perfect(there are some sizes where the search area kinda breaks) nor exceedingly pretty. This is where your creativity comes in. Take this as a starting point and be creative. I look forward to see what you come up with!
