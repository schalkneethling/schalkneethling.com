---
title: Flexbox Fundementals
description: Covers the most essential aspects of CSS flexbox
template: _base.html
---

# Flexbox Fundementals

Today we are pausing the work on our webpage to explore the fundamentals of CSS flexbox. We started to use flexbox in our previous post, but we didn't have a chance to explore the full capabilities of the flexbox. The intent of today’s class is not to be an exhaustive guide to flexbox, but to give you a quick overview of the most essential aspects of flexbox.

We are also going to be using [Codepen.io](https://codepen.io/) to test out our code so, no need to fire up VSCode today. If you do not already have an account on Codepen, go ahead and create one. Seeing that all of you already have a GitHub account, feel free to use that option to signup for Codepen.

## The display model

As mentioned before, by default all HTML elements on a page participate in what is called normal flow. This is essentially a combination of block and inline elements. We can control the display model of an element by changing the value of the `display` property. Let’s take the following piece of HTML:

> NOTE: You can quickly create a new Codepen pen by typing pen.new into your browser’s address bar.

```html
<nav aria-label="main navigation">
  <ul class="main-nav">
    <li><a href="home">Home</a></li>
    <li><a href="about">About</a></li>
    <li><a href="contact">Contact</a></li>
  </ul>
</nav>
```

> NOTE: Copy and paste the above into the HTML editor of your Codepen.io pen.

This will look familiar to all of you as it is essetially the HTML we used for the navigation in the header of our webpage. The `nav` element is just a landmark wrapper that aids in semantic structure and accessibility when combined with the `aria-label` attribute as shown above. The unordered list element contains our links and by default, has a display model of `block`. The list items inside the unordered list, are what is known as the direct children of the parent unordered list element.

Let’s change the `display` property of the unordered list to `flex`:

```css
nav {
  margin-bottom: 48px;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.main-nav {
  border: 5px solid #349393;
  display: flex;
  min-height: 200px;
}
```

> NOTE: Copy and paste the above into the CSS editor of your Codepen.io pen.

After clicking "Run" you will see a layout resembling something akin to a navigation bar. Thing is, list items normally display stacked one on top of the other, and not inline. Why is this?

The reason of course is because we changed the display value of the parent to flex. This turns the list items into what is known as flex items. Flex items are the children of the parent flex container. Flex has, as of this writing, four possible flow values that affect how its children are laid out. These are:

- `row`: The flex items are laid out horizontally along the x-axis.
- `column`: The flex items are laid out vertically along the y-axis.
- `row-reverse`: The flex items are laid out horizontally in reverse order.
- `column-reverse`: The flex items are laid out vertically in reverse order.

The default being `row`. As such, our flex items are laid out in a row. Let’s add another navigation menu to our HTML:

```html
<nav aria-label="table of contents">
  <ul class="toc">
    <li><a href="#topic1">Topic 1</a></li>
    <li><a href="#topic2">Topic 2</a></li>
    <li><a href="#topic3">Topic 3</a></li>
  </ul>
</nav>
```

> Copy and paste this below the current HTML code in your pen.

Without adding any CSS, click "Run". This then is the default layout for an unordered list. Instead of being in a row, they are stacked one on top of the other. Let change the parent to be a flex container, and run the code again:

```css
.main-nav,
.toc {
  border: 5px solid #349393;
  display: flex;
  min-height: 200px;
}
```

As we could have predicted, and now looks exactly the same as the main navigation. Let’s change this one to use `column` for its flow value and run the example again:

## Flow direction

```css
.toc {
  flex-flow: column;
}
```

We are now back to where we were before, big woop! While it might look that way, there are some important differences. Now that our parent is a flex container, we have new super powers, so to speak. One thing you will notice is that the flex parent expands to fill the entire width of the viewport but, in our main navigation, the flex items are not taking advantage of the space available to them. Instead, they are all squashed together on the left.

One of the other properties we can set on the flex parent is `justify-content`. This controls how items inside the container are aligned along the main axis. There are a number of options here and I [encourage you to experiment with them](https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content#values), but today, we will cover a couple so you can get a feel for it.

The default for `justify-content` is `flex-start`. This means that the items are aligned to the start of the main axis. This explains why our list items are squashed together on the left. Let’s change this to `space-between` and run the example again:

## Alignment

```css
.main-nav {
  justify-content: space-between;
}
```

Now our items are spread out to take full advantage of the available space. We have spoken about the face that the hyperlinks will still not actually take up the space that is available to it because its default display is inline. Let’s change that and make our navigation bar look more like the real deal:

```css
.main-nav a {
  display: block;
}

.main-nav a:link,
.main-nav a:visited {
  background-color: #46bebe;
  color: #091a1a;
  text-decoration: none;
}

.main-nav a:hover,
.main-nav a:focus {
  background-color: #0b4a4a;
  color: #fff;
}
```

## Flexibility

It’s better I guess, but still not really what we would have expected. The items still does not take up their available space. 🤔 the reason for this is due to two other properties of flexbox.

- `flex-grow`
- `flex-shrink`

As the names suggest, these two properties control how the flex item will grow and shrink. By default, `flew-grow` is set to `0`, which means it will not grow. We want our items to stretch though so, let’s tell flexbox to do just that.

```css
.main-nav li {
  flex-grow: 1;
}
```

That is _much_ better. As you resize the browser window, you will now see that the items stretch and shrink as needed. Let’s improve the look of our bar a little bit more with some padding on the hyperlinks.

```css
.main-nav a {
  display: block;
  padding: 1rem;
}
```

## More alignment

Just for fun, let position our navigation bar at the bottom of our container. Any ideas how we would go about doing that?

```css
.main-nav {
  align-items: flex-end;
  justify-content: space-between;
}
```

We accomplish this using the `align-items` property. While `justify-content` is used to align items along the main axis, `align-items` is used to align items along the cross axis. Run your example again to see the end result. Before we continue, here is a quick question. What do you think will happen if we add the following CSS to the table of contents navigation?

```css
.toc {
  flex-flow: column;
  justify-content: space-between;
}
```

Surpirsing? Well, the "catch" is that items are laid out across the `main-axis` and `cross-axis`. These change depending on the `flex-flow` value.

### `flex-flow: row`

![A diagram showing that main axis in a horizontal direction and the cross-axis in a vertical direction when flex-flow is row](/assets/media/flexbox/flex-flow-row.png)

### `flex-flow: column`

![A diagram showing that main axis in a vertical direction and the cross-axis in a horizontal direction when flex-flow is column](/assets/media/flexbox/flex-flow-column.png)

### `flew-flow: row-reverse`

When set to `row-reverse`, the `main-axis` is reversed but the `cross-axis` remains the same.

![A diagram showing that main axis in a horizontal rtl direction and the cross-axis in a horizontal direction when flex-flow is row-reverse](/assets/media/flexbox/flex-flow-row-reverse.png)

### `flow-flow: column-reverse`

When set to `column-reverse`, the `main-axis` is reversed but the `cross-axis` remains the same. Be careful though. 😄 Remember, which axis is the main and which is the cross axis also changed. 🙃

![A diagram showing that main axis in a vertical rtl direction and the cross-axis in a horizontal direction when flex-flow is row-reverse](/assets/media/flexbox/flex-flow-column-reverse.png)

### Challenge time!

Have a look at the following screenshot. Using what you have learned so far, replicate this layout. Hint: It has a lot in common with the current main navigation, but the flow is critical.

![Screenshot showing the navigation at the bottom-right of the container with each item only taking up enough space for its contents](/assets/media/flexbox/flex-row-reverse-challenge.png)

### Solution

The HTML:

```html
<nav aria-label="secondary navigation">
  <ul class="secondary-nav">
    <li><a href="msic">Music</a></li>
    <li><a href="art">Art</a></li>
    <li><a href="drama">Drama</a></li>
  </ul>
</nav>
```

And the CSS:

```css
.main-nav,
.toc,
.secondary-nav {
  border: 5px solid #349393;
  display: flex;
  min-height: 200px;
}

.secondary-nav {
  align-items: flex-end;
  flex-flow: row-reverse;
  justify-content: flex-start;
}

.secondary-nav a {
  display: block;
  padding: 1rem;
}

.secondary-nav a:link,
.secondary-nav a:visited {
  background-color: #46bebe;
  color: #091a1a;
  text-decoration: none;
}

.secondary-nav a:hover,
.secondary-nav a:focus {
  background-color: #0b4a4a;
  color: #fff;
}
```

## `flex-basis`

As you noticed with this last example, each item would take up only as much space as needed for its contents. Often times this is not a problem but, this is not always what we want. How do we solve for this then?

This is where the `flex-basis` property comes into play. The `flex-basis` property sets the initial size of the flex item. This is the size that the item will take up before it grows or shrinks. Go ahead and duplicate the final code for the above challenge and make the following change:

```html
<nav aria-label="tertiary navigation">
  <ul class="tertiary-nav"></ul>
</nav>
```

We do the above so we identify the navigation as different from the secondary navigation and, we change the class name so we do not impact our secondary navigation with the changes we make here.

```css
.main-nav,
.toc,
.secondary-nav,
.tertiary-nav {
  border: 5px solid #349393;
  display: flex;
  min-height: 200px;
}

.tertiary-nav li {
  flex-basis: 120px;
}
```

Go ahead and run the example. You will see that the items are now all start with a width of at least 120px. This is one use case for the `flex-basis` property. Another is using it in combination with the `flex-shrink` property. If you resize the browser window and look at the menu items in the main navigation, you will see that the items continue to shrink as the window gets smaller. What if we did not want that but we wanted them to stop at a specific size?

We can use `flex-basis` in combination with `flex-shrink`. You could write something like this:

```css
.main-nav li {
  flex-basis: 120px;
  flex-grow: 1;
  flex-shrink: 0;
}
```

And that would totally work but, there is a shorthand form of the above. The code below is the exact equivalent of the above code.

```css
.main-nav li {
  /* grow, shrink, basis */
  flex: 1 0 120px;
}
```

Go ahead and update the code for the main navigation to use this last form and rerun the examples. As you now resize the window, you will see that the items stop shrinking when they reach the `flex-basis` of 120px.

## Wrapping

By default when items are laid on in a row, flexbox will keep all of the items on the same line even if there is not enough vertical space. Sometimes this might be OK but, when creating something like an image gallery we most likely would prefer that the images wrap around to the next line. This is very easily achieved with the `flex-wrap` property.

Create a new pen and use the following HTML as a basis:

```html
<ul id="gallery" class="gallery">
  <li>
    <img src="https://placekitten.com/g/200/200" alt="random kitten image" />
  </li>
</ul>

<footer>
  <p>
    <a href="https://placekitten.com"> Images by https://placekitten.com </a>
  </p>
</footer>
```

Go ahead and duplicate the list items so there are fourteen items or more. Now add the following CSS and run the example:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

.gallery {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}
```

You will see that, as stated earlier, the items are kept on a single row and forces a horizontal scrollbar. Go ahead and add the following line to your CSS and rerun the example:

```css
flex-wrap: wrap;
```

Hey presto! It wraps! It still does not look great with all of the images stacked so tightly though.

## Mind the `gap`

We can address this by setting a `gap`. Add the following to the CSS and rerun the example:

```css
/* for some older browsers you will also need to set grid-gap as they lack support for `gap` */
grid-gap: 24px;
gap: 24px;
```

This is better. Let’s add some more style to the images though:

```css
.gallery img {
  border: 10px solid #e1c863;
  border-radius: 6px;
  display: block;
  max-width: 100%;
}
```

Most of the above will be familiar to you. The one thing of interest to note, is the rule `max-width: 100%`. Here we are telling the browser that the image is never allowed to take up more than 100% of the space of its parent element, even if the image is larger. Go ahead and run the example and resize the window. Notice how the browser responsively wraps the images onto new lines as needed. Pretty darn neat right?!

## A small bonus

It has historically been rather cumbersome, to put it mildly, to position an element or group of elements at the vertical and horizontal center of its parent container. thanks to flexbox, this is no longer a cause for frustration. Let’s use the tertiary navigation example from earlier to demonstrate.

Currenltly we have its `justify-content` property set to `flex-start`. Let’s change that to `center` and rerun the example.

```css
justify-content: center;
```

Now, if `justify-content` aligns items, in this case, horizontally from right to left, then `align-items` will align them vertically from top to bottom. Does it mean that we can simply add the following and all is well with the world?

```css
align-items: center;
```

Indeed it does! Just one more of the super powers of flexbox. We covered a lot of flexbox today but, believe it or not, there is even more to it. I would encourage you to read the [articles on MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout/Basic_Concepts_of_Flexbox) for more information.

## Homework

While we built pretty standalone components today, you can use flexbox to build the entire layout of a page. What I want from you, is to build a responsive, mobile first, layout using flexbox. Here are the specifications:

> NOTE: You can add content or just give the container a background colour. It is totally up to you.

1. The page should have a header, footer, and main content area.
2. the main content area should be split up into three sections: [sidebar][main content][sidebar2]
3. On mobile, decide how you will stack these three containers
4. On large enoung viewports where all three containers are visible, the sidebars should not stretch, while the main content area should.
5. Bonus points for setting a max-width on the entire page and centering it on really wide displays.

Have fun and send me your links!
