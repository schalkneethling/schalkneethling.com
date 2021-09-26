---
title: Building the header
description: Dive into Flexbox to build out our header and main navigation
template: _base.html
---

# Building the header

Today we are going to dig into HTML as well as some CSS to buld out a header for our webpage. The header will consist of a logo and a simple navigation bar. While building our header, we will take a [mobile first approach](https://developer.mozilla.org/en-US/docs/Glossary/Mobile_First) and also ensure that our header is [responsive](https://developer.mozilla.org/en-US/docs/Glossary/Responsive_web_design). The first step to creating our header is to write out the HTML, so let’s get started.

## The main header skeleton

As mentioned, our header will contain a logo and a navigation bar. We will start by creating a `<header>` element and then add a `<nav>` element as the container for our navigation and a `div` as the container for our logo.

> NOTE: We will be using the existing `index.html` file we created last time. You can safely delete the `h1` element we added last week.

Inside the `body` element of the page, add the following:

```html
<header class="page-header">
  <div class="header-logo-container"></div>
  <nav class="main-navigation-container"></nav>
</header>
```

The `nav` and `header` elements were introduced as part of the HTML5 specification and is what is known as a landmark. Landmarks are used to provide an easier way to navigate to a specific section of a page by people using assistive technologies such as [screen readers](https://en.wikipedia.org/wiki/Screen_reader). With that said, we need to take two things into account:

- Limit the number of landmark elements you use. If you do not, their usefulness can degrade very quickly.
- Use the correct landmark element for the intended purpose.
- Label each landmark element with a appropriately descriptive name.

To label our `header` and `nav` elements, we will use the `aria-label` attribute. This information is read out to users of assistive technologies but is not visible in the browser.

```html
<header class="page-header" aria-label="Page header">
  <div class="header-logo-container"></div>
  <nav class="main-navigation-container" aria-label="Main navigation"></nav>
</header>
```

## Laying out the main header

Inside the root of your project create a new folder called `css`, and inside it create a new file called `main.css`. Before we add anything to this file, let’s link the file to our HTML file and talk about those `class` attributes. When I say "link" our CSS file to our HTML file, I mean that we are telling the browser that we have an external dependency that we want it to load and apply to the current document. This is done by using the `<link>` element.

```html
<link rel="stylesheet" type="text/css" href="css/main.css" media="screen" />
```

Let’s take a look at the individual parts of the above element. The `rel` attribute tells the browser the relationship of the linked document to the current document. In this instance, the file we are linking is a CSS document, or stylesheet, file. The `type` attribute tells the browser that the file we are loading is a CSS file. The `href` attribute tells the browser where to find the CSS file, and the `media` attribute tells the browser to only apply the CSS file if the media type of the current device is a `screen` device such as a laptop or mobile device. One can also specify a media type of `print` or `all`, [among other options](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link#attr-media).

The browser will now load the CSS file when loading and parsing our HTML file, but currently, we have not defined any style rules to apply to the document. We also have no content inside our container elements, but we will work around that for the time being. Add the following to the `main.css` file:

```css
body {
  margin: 0;
  padding: 0;
}

.page-header {
  display: flex;
  min-height: 50px;
}

.header-logo-container {
  background-color: #e2497f;
  flex: 0 1 400px;
}

.main-navigation-container {
  background-color: #ddf4ff;
  flex: 1 0 400px;
}
```

> NOTE: At this point please go ahead and install the plugin for VSCode that will make it easy to preview our page as we build it and make changes. https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer

With the above plugin installed, right click on your `index.html` file and choose the "Open with Live Server" option. You should see soemthing like this in your browser:

![Screen shot of the initial header in the browser showing a small pink block and a larger blue block](/assets/media/building-the-header/header-v1.png)

There is a lot going on here so, let’s take a look at the individual parts of the CSS above.

```css
body {
  margin: 0;
  padding: 0;
}
```

Before we dig into what this does, let’s break apart the parts of the CSS. The `body` portion of the above is what is known as the selector. The CSS engine in the browser will attempt to find a match for the selector we specified in the HTML document and, should it find a match, it will apply the style rules to the matching elements.

The `body` selector is what is known as an element selector. You can also use a class selector such as `.page-header`, an attribute selector such as `[aria-hidden="false"]`, and a variety of other selectors. We won’t gover over the entire list here but, we will touch on more and more as we build out out webpage.

> NOTE: Although you can use id selectors(`#bad-practice`) in CSS, [it is not recommended](https://www.impressivewebs.com/css-specificity-irrelevant/).

Next we have the opening and closing curly braces indicating the start and end of our ruleset. The ruleset is the entire block, in other words:

```css
body {
  margin: 0;
  padding: 0;
}
```

On the next line we define a style rule declaration. A style rule consists of a property(`margin`) and a value(`0`). The property is what we are setting the style of, and the value is what we are setting it to. By default the built in browser styles add some margins and padding to the `body` of the document. We do not want this, so we will reset them to zero.

```css
.page-header {
  display: flex;
  min-height: 50px;
}
```

The first item you will notice here is the string `.page-header`. If you look back at our HTML, you will notice this same name applied to the `header` element:

```html
<header class="page-header" aria-label="Page header"></header>
```

Two things to notice here:

1. `page-header` is the value of the `class` attribute but here, it does not use the dot notation we see in the CSS.
2. In the CSS, we do use the do notation. This is because in CSS, we use the dot notation to signify that the text that follows is a class name. This is also what is known as a selector.

What this allows us to do is to ensure that any style rules we define inside the `.page-header` style block, will _only_ apply to element which has a `class` attribute that contains the `page-header` value. You will note that I say _contains_. This is because you can specify an arbitraty number of space separated class names for any one element. For example, we could do the following:

```html
<header class="page-header hero" aria-label="Page header"></header>
```

If we then later in the HTML document have another element that uses the `page-header` class, for example:

```html
<div class="page-header sub" aria-label="Sub-Page header"></div>
```

The style rules we defined for `.page-header` will be applied to both elements. Now, the first style rule we define for the `page-header` class is `display: flex;`. Before we talk about the `flex` value, we need to step back for a bit and talk about the `display` property in general.

## `display`

Whenever we want to change from the default way of laying out elements on a page, we will change the value of the `display` property. By default all elements are assigned a default flow value of either `block` or `inline`. This is what is known as normal flow.

### Block level elements

Block level elements such as `p`, `div`, `ul`, etc. each break onto their own line in the document.

<img src="/assets/media/building-the-header/block-level.svg" width="200" height="200" alt="Screen shot showing block level elements stacked one on top if the other" />

Block level elements also take up the full width of its parent container.

<img src="/assets/media/building-the-header/block-level-full-width.svg" width="200" height="200" alt="Screen shot showing block level elements taking up the entire with of the container" />

### Inline elements

Inline elements such as `span`, `code`, `a`, etc. are laid out, as the name suggest, in a signle line.

<img src="/assets/media/building-the-header/inline-level.svg" width="200" height="200" alt="Screen shot showing inline level elements laid out in a single line" />

Also, unlike block level element, inline elements only take up as much space as the content it contains.

<img src="/assets/media/building-the-header/inline-level-content-width.svg" width="442" height="80" alt="Screen shot showing inline level elements only taking up as much space as their content" />

## Inline-block

One change to `display` you will commonly want to make is to set an element as `inline-block`. This keeps the element inline with its surroundig elements but, allows you to specify style properties such as `padding` and `margin`. For example:

```css
/* An anchor element is an inline element by default */
a {
  background-color: #e1539a;
  color: #212121;
  /* Here we are setting it to inline-block */
  display: inline-block;
  /* allowing us to add some padding to the element */
  padding: 12px;
}
```

<img src="/assets/media/building-the-header/inline-block-level.svg" width="442" height="80" alt="Screen shot showing inline-block level elements with added padding" />

The above then covers normal flow and the `inline-block` variant. On the web today, two new display modes have been added that finally gives CSS the layout model that was sorely needed for the web. These are `flex` and `grid`. In our `page-header` we set the display mode to `flex`. One thing that is different here is that, while the previous `display` values affected the element, or elements that match the selector. With `flex` we affect the element, or parent, as well as the direct children of the parent. The parent becomes the `flex` parent, and the direct children, becomes `flex` items.

> NOTE: While the direct children become `flex` items, the content inside them will again return to normal flow as discussed earlier.

The `flex` value of `display` changes the layout mode to what is known as Flexbox layout. Flexbox is only concerned with one directional layout so, either horizontal(row) or vertical(column). The default layout mode being `row`. You can however specify three other layout modes using the `flex-flow` property:

- `column`
- `column-reverse`
- `row-reverse`

For example:

```css
display: flex;
flex-flow: column;
```

For the moment, let’s comment out the `flex` property from our CSS:

```css
/* display: flex; */
```

When you open the page using live server(right click on the `index.html` file and choose: "Open with Live Server" from the options), you will see that nothing is displayed. This is because the container elements do not contain any content, we have not specified any width or height properties, and the `flex` related propeties no longer apply. Uncomment the `flex` property and refresh the page which will return us to the previous state. Byt why? We are still not specifying any width or height for the container elements. This is because of the `flex` property.

By default, the flex items will grow to fill the entire height or width, depending on your mode of layout, of its parent container.

```css
.header-logo-container {
  background-color: #e2497f;
  flex: 0 1 400px;
}

.main-navigation-container {
  background-color: #ddf4ff;
  flex: 1 1 400px;
}
```

The `background-color` property does not require any explanation so, let’s move on to the `flex` property. The `flex` property is a shorthand property that allows us to specify the `flex-grow`, `flex-shrink`, and `flex-basis` properties. Looking at our first rule, we can break it down as follows:

```css
/* the following shorthand */
flex: 0 1 400px; /* flex: 0[flex-grow] 1[flex-shrink] 400px[flex-basis]; */
/* is the same as */
flex-basis: 400px;
flex-grow: 0;
flex-shrink: 1;
```

For the navigation, we are essentially calling for the opposite:

```css
/* the following shorthand */
flex: 1 0 400px;
/* is the same as */
flex-basis: 400px;
flex-grow: 1;
flex-shrink: 0;
```

When you open the page in the browser, you will see that the navigation is takes up all the space of the viewport other than the `400px` assigned to the logo. Should we resize our browser window and make it narrower, the navigation will shrink but only until it reaches it basis of `400px`. At this point it will stop shrinking but, the logo will keep shrinking.

This is a nice example of how the various properties interplay but, it is not exactly what we would actually want our logo container to do. Let’s change it up a bit.

```css
.header-logo-container {
  background-color: #e2497f;
  flex: 0 0 250px;
}
```

Now our logo container will take up 250px of the viewport width and will neither stretch, nor shrink. Our navigation will still keep shrinking however. What we really want to happen is for the navigation and logo to stack on mobile viewports, and sit side by side on tablet and larger viewports. We can accomplish this using media queries.

> NOTE: From this point onward we will follow a mobile first approach which is a best practice when developing for the web. The main reason we deviated here was so that we could demonstrate the flexbox layout, which we will be using more off.

## Media queries

Media queries are used to specify different styles for different viewports. For example, if we want to change the way your header behaves across mobile and other viewports, we can do so by using a media query. A basic media query looks something like this:

```css
@media screen and (min-width: 768px) {
  /* ... */
}
```

When writing mobile first our default CSS styles are those targetted at mobile devices. We then start using `min-width` media queries to target larger viewports and change the relavant CSS. Let’s look at the various parts of the above media query.

The `@media` keyword is used to state that we are about to defaine the constraints of the media query. The `screen` keyword is used to target the media query to the screen media type. This is only one of the options. There are other media options such as `print` and `speech`. You can also use the catch all `all` media type. The `and` keyword is used to separate the media type and the constraints. The `min-width` keyword is used to specify the minimum width of the viewport at this point the CSS inside the media query block will be applied. The above media query is targeting viewports of at least 768px wide which is essentially same as a tablet in portrait mode.

We now need to change our CSS a bit for the `page-header, `header-logo-container`, and the `main-navigation-container`.

```css
.page-header,
.header-logo-container,
.main-navigation-container {
  min-height: 50px;
}

.header-logo-container {
  background-color: #e2497f;
}

.main-navigation-container {
  background-color: #ddf4ff;
}

@media screen and (min-width: 768px) {
  .page-header {
    display: flex;
  }

  .header-logo-container,
  .main-navigation-container {
    min-height: initial;
  }

  .header-logo-container {
    flex: 0 0 250px;
  }

  .main-navigation-container {
    flex: 1 0 400px;
  }
}
```

With the above in place go ahead and open the page in the browser, open the developer tools, and switch to a mobile device.

> NOTE: If you are not sure how, you can learn here how [to open developers tools and switch to responsive mode](../opening-browser-developer-tools/index.html).

```css
.page-header,
.header-logo-container,
.main-navigation-container {
  min-height: 50px;
}

.header-logo-container {
  background-color: #e2497f;
}

.main-navigation-container {
  background-color: #ddf4ff;
}
```

When the page is displayed on a mobile device i.e. a device with a viewport size smaller than `768px`, only the CSS above will be applied to the document and you should see the following:

![Screen shot of the header in a mobile browser with the logo and navigation containers stacked](/assets/media/building-the-header/mobile.png)

You can basically imagine that all of the CSS code inside our media query does not exist at this point. Also, because both the `div` and the `nav` elements are block level elements, they will stack on top of each other, and expand to fill the entire width of the available viewport. Now, when we resize the browser window to a viewport larger that `768px`, the media query will be applied and the following CSS will be applied to the document:

```css
@media screen and (min-width: 768px) {
  .page-header {
    display: flex;
  }

  .header-logo-container,
  .main-navigation-container {
    min-height: initial;
  }

  .header-logo-container {
    flex: 0 0 250px;
  }

  .main-navigation-container {
    flex: 1 0 400px;
  }
}
```

At this point it is important to explain why we added the media query to the end of the CSS file as opposed to the beginning or somewhere in the middle. CSS is based on the concept of the cascade. It is right there in the name Cascading Style Sheets(CSS) 🙃. What that means is that the browser will evaluate the CSS file from top to bottom. Anything that is lower in the CSS file that mathes a selector we defined earlier, will override or add to this ruleset. For example:

```css
.page-header {
  background-color: #000;
}

/* some additional rulesets */

.page-header {
  background-color: #fff;
}
```

The color of elements with the class `page-header` will now have a background color of white instead of black. While there are means, and valid use cases, to override this by using selectors with greater specificity, in general, it is best to use and embrace the cascade.

## Homework

- Remember to add, commit, and push your work to GitHub.
- Try adding an additional flex item to the `page-header` and see what the result is.
- Try adding an additional media query and change up the styling of the page header ot its elements.
- Remember to send me your links and questions on Slack
