---
title: Adding a logo, navigation, and search to our header
description: We go through adding a logo, navigation, and simple search to our header
template: _base.html
---

# Adding a logo, navigation, and search to our header

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
