---
title: Improving the Responsiveness of the Header
description: We start digging into some JavaScript to improve the responsiveness of the header on mobile phones.
template: _base.html
---

# Improving the Responsiveness of the Header

Last week we deep a rather deep-dive into flexbox and you had some practice building out a more complete page using flexbox. Today we are going to return to our header and start digging into some JavaScript. Our goal, make our header completely responsive on all devices.

## Hamburger

The hamburger menu pattern is pretty common, if not the defacto, standard way to manage real estate on mobile devices. Specifically when it comes to page components such as the header. To accompish this, we will make some changed to the HTML of our current header, add some CSS and tie it all together with JavaScript.

## HTML

Instead of building directly into our existing header, we are going to again be using [Codepen.io](https://codepen.io/). It will be your job to then go and implement this into your own header. Let’s get started with the basics which will be familiar to you already. [Create new pen](https://pen.new/) and paste the following into the HTML editor:

```html
<header class="site-header">
  <nav id="main-nav-container" class="main-nav" aria-label="Main menu">
    <ul id="main-menu" class="main-menu">
      <li>
        <a href="/" aria-current="page">Home</a>
      </li>
      <li>
        <a href="/about">About</a>
      </li>
      <li>
        <a href="/pricing">Pricing</a>
      </li>
      <li>
        <a href="/contact">Contact</a>
      </li>
    </ul>
  </nav>
</header>
```

The only pieces here that might be a bit new is the use of the `id` attribute and the `aria-current` attribute. The `id` attribute is another means by which we can refer to an element and will come into play a little later when we are implementing the JavaScript. The `aria-current` attribute is a way to tell screen readers that the hyperlink refers to the current page being displayed. This is a useful means of orientation, especially when the navigation is rather complex.

## Our toggle

We now need an element we will only show on mobile phones and, which we will use as the trigger to show and hide our header. We will be using a `<button>` element.

> NOTE: When in doubt always remember, `button`s do things hyperlinks take you somewhere.

Just inside the `nav` element we will add our button and two SVG icons:

```html
<button
  type="button"
  id="main-menu-toggle"
  class="main-menu-toggle"
  aria-expanded="false"
  aria-controls="main-menu"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    class="open-menu"
    viewBox="0 0 16 16"
  >
    <title>Open Menu</title>
    <path
      fill-rule="evenodd"
      d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"
    />
  </svg>

  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    class="close-menu hidden"
    viewBox="0 0 16 16"
  >
    <title>Close Menu</title>
    <path
      fill-rule="evenodd"
      d="M13.854 2.146a.5.5 0 0 1 0 .708l-11 11a.5.5 0 0 1-.708-.708l11-11a.5.5 0 0 1 .708 0Z"
    />
    <path
      fill-rule="evenodd"
      d="M2.146 2.146a.5.5 0 0 0 0 .708l11 11a.5.5 0 0 0 .708-.708l-11-11a.5.5 0 0 0-.708 0Z"
    />
  </svg>
</button>
```

Here are a number of new pieces to discuss so, let’s start from the top. The first is `aria-expanded`. This is a way to tell screen readers that the button is a toggle and that the container it will expand, is currently not expanded. We will programatically update this a little on as a user interacts with the button. The second attribute is `aria-controls`. This is a way to tell screen readers that the button controls(expands and collapses in this instance) a container with the id of `main-menu`. If you look back at the first piece of HTML we added, you will see that the unordered list has an `id` attribute of "main-menu".

[Scalable Vetor Graphics(SVG)](https://developer.mozilla.org/en-US/docs/Web/SVG) is a massive topic deserving its own class so, I will only touch on those bits that are relevant to this section. We have added two icons. One will be shown when our menu is closed(collapsed - the hamburger icon) and the other when it is open(expanded - a `X` close icon). The only attribute to make a not of here is the `class` attribute on each of the SVG elements. You will notice that the second of the two has an additional class of `hidden`. This is a class that we will use to hide the SVG element when the menu is closed.

The other important piece to take note of is the `title` element inside the SVG. This is a way to provide a description of the icon to screen readers. This means there is no need to provide an `aria-label` attribute on the button. Running the code at this point should result in something like below:

![Shows a button containing a hamburger and close button as well as an unstyled list of links](/assets/media/js-menu/initial-unstyled-hamburger-menu.png)

While you can click the button, nothing we happen just yet.

## The CSS

The CSS is going to be pretty minimal and does not introduce anything you do not already know, but let’s step through it. First, we want to reset our `body` element somewhat.

```css
body {
  font: 100%/1.5 sans-serif;
  margin: 0;
}
```

Next we want to ensure that your `nav` element is set to `relative`. Because we are going to be positioning some elements absolutely, we are setting the `nav` to relative so that it will act as the parent container for our elements when positioning them.

```css
.main-nav {
  position: relative;
}
```

Next up, the button:

```css
.main-menu-toggle {
  background: none;
  border: 0;
  cursor: pointer;
  height: 42px;
  position: absolute;
  right: 0;
  top: 12px;
  width: 42px;
}
```

Here you can see that we are positioning the button absolutely. We want it to appear `12px` from the top of the `nav` elements top position, and all the way to the right. We also set `cursor` to `pointer` so that the familiar pointing hand will appear when hovering over the button.

Let’s add a simple `hover` and `focus` state for our button as well:

```css
.main-menu-toggle:hover,
.main-menu-toggle:focus {
  background-color: #edecec;
  border-radius: 50%;
}
```

Next we tell the SVG elements inside the button to scale to fit the width and height of the button.

```css
.main-menu-toggle svg {
  height: 100%;
  width: 100%;
}
```

Next we reset the `ul` element and set its initial display to `none`(Remember we are building using a mobile first approach):

```css
.main-menu {
  display: none;
  list-style: none;
  margin: 0;
  padding: 0;
}
```

Now, when we want the menu to be visible, we are going to add a class called `show`. So, we need to define this class next:

```css
.main-menu.show {
  display: block;
  position: absolute;
  right: 0;
  top: 56px;
  width: 100%;
}
```

Nothing new here, but do notice that we are position the menu further down to accomodate the button. Next we add some very basic styling to the menu items:

```css
.main-menu a {
  display: block;
}

.main-menu a:link,
.main-menu a:visited {
  background-color: #333;
  border-bottom: 1px solid #fff;
  color: #fff;
  padding: 16px;
}

.main-menu a:hover,
.main-menu a:focus {
  background-color: #fff;
  border-bottom: 1px solid #333;
  color: #333;
}
```

And last but not least, we need to define the `hidden` class I mentioned earlier:

```css
.hidden {
  display: none;
}
```

That covers the CSS for the moment. Running the example now, should produce the following:

![Shows a hamburger menu button aligned top-right in the viewport](/assets/media/js-menu/menu-with-mobile-css.png)

Still though, clicking the button will do nothing. Let’s fix that!

## JavaScript

JavaScript is probably the worlds most used and most loved programming language. That last part of that phrase is often up for debate though. For today, we are going to put internet politics aside and start using this powerful programming language. Again, I will touch and more and more complex topics, but for now, I am going to focus on only that which will help you understand the code we are writing.

Like SVG, _really_ understanding JavaScript, is a course all its own. So, let’s start with the basics.

### Functions

Functions, also sometimes called methods in some languages, are essentially a named block of code that performs a specific task. In JavaScript, functions are defined with the `function` keyword.

```js
function doAThing() {
  // do something
}
```

Now, add the following function to the Javascript editor:

```js
function logIT() {
  console.log("Hello World!");
}
```

Before running you code, you will need to open the console in Codepen. If you look at the following screen shot, you will see it is the left most button in the bottom actions bar titled console.

![Shows bottom actions menu. The console button is the first in the series of actions](/assets/media/js-menu/codepen-bottom-options-menu.png)

With the console open, you can run the code by clicking the `Run` button. What?! Nothing happened. What gives? Well, be default, simply declaring a function will not execute it. This is definitely desirable as we do not necesarilly want all our functions arbitratily executed on page load. What we need to do, is call our function. To do this, add the following after our function definition:

```js
logIT();
```

When you run the code this time, you should see the message, "Hello World!" in the console. Horray! We just wrote and executed our first function. While this style of defining and calling functions on page load is not wrong, there is another well established pattern that is super useful.

Next we will make use of what is known as n Immediately Executed Function Expressions (IIFEs). IIFEs are a way to create a function on the fly and execute it immediately. This is useful for creating a function that will only be executed once, but also, to create a function that runs some code on page load. This can be useful to setup some variables, define some function, and possible attach some event handlers to elements.

The form of an IIFE is as follows:

```js
(function () {
  // code to execute
})();
```

The import part of the above are those last two paratheses. So, essentially what this is doing is defining a function, and then immediately executing it. Update the code in the JavaScript error to the following:

```js
(function () {
  console.log("Hello World!");
})();
```

Run your code again. You should see the message, "Hello World!" in the console.

### Variables

Variables are a means for us to store data and later use that data. It used to be that the only way to declare a variable in JavaScript was with the `var` keyword. This has its shortcomings and so, a couple of years back we also got the `let` and `const` keywords to declare variables.

Here are the most important things to know about these keywords:

```js
(function () {
  var a = "I am a var";

  if (true) {
    let b = "I am a let";
    console.log(a, b);
  }

  console.log(a, b);
})();
```

The first log statement will print: `"I am a var" "I am a let"`. The second log statement however, will throw an error. This is because the `let` keyword is scoped to the if block. This means that you can _only_ access the variable inside the if block. The `const` keyword shares much in common with the `let` keyword, but its value cannot be reassigned.

The name of the keyword pretty much tells us that. So, while the following are all valid:

```js
let a = "I am a let";
var b = "I am a var";

a = "I am a let with a new value";
var b = [1, 2, 3];

console.log(a, b);
```

The following will throw and type error(`TypeError: invalid assignment to const 'c'`):

```js
let a = "I am a let";
var b = "I am a var";
const c = "I am a const";

a = "I am a let with a new value";
b = [1, 2, 3];
c = "Nope, nope, sorry.";

console.log(a, b, c);
```

Usage of the `var` keyword is still seen, but is becoming less and less common. There are also some nuances with `const`, but for now this will serve you well. Talking about variables, we need to define a few to get our menu working. Update your IIFE to the following:

```js
"use strict";

const menuToggle = document.getElementById("main-menu-toggle");
const mainMenu = document.getElementById("main-menu");
```

Ok, first question. What is up with the `"use strict";` business? This is a way to tell the browser’s JavaScript engine [to use strict mode when executing your code](https://stackoverflow.com/questions/1335851/what-does-use-strict-do-in-javascript-and-what-is-the-reasoning-behind-it). This will cause more errors to be thrown and the engine to be less lenient, in the end though, it makes for better code shipped to your end users. Next we set up two variables. We are using the `const` keyword as we will only set this once, and then never to to reassign it.

What are we storing though?

In the first instance we are using the `getElementById` function of the `document` object and giving it the name of an `id` we believe to exist on the page. If the JS engine coud find a match, a reference to the element is stored in `menuToggle`. We then do the same for the `main-menu`. We can see what is stored by logging out the variable names after they have been declared:

```js
console.log(menuToggle);
console.log(mainMenu);
```

### Event Handlers

Now that we have these elements, we want to add some event handlers. An event handler is a special type of function in JavaScript that are mapped to certain events that could happen on a page or element. Once the event is fired by the browser, the listener function is executed.

```js
if (menuToggle && mainMenu) {
  menuToggle.addEventListener("click", (event) => {
    console.log("Clicked!");
  });
}
```

Here we are adding an `eventListener` on the button and listening for `click` events. The reason we wrap it in a conditional, is a defensive coding mechanism. Essentially we ensure that we have a reference to both the `menuToggle` and `mainMenu` elements before trying to do anthing with them. Once a click event is fired, we will log the message, "Clicked!" to the console. Clear your console, run the code and click on your button.

That is pretty neat! But, we definitely want to do more that just log a message to the console. Because we are going to end up adding another event listener in a while, we are going to create a new reusable function. This helps avoid code duplication, eases maintenance, akes code more testable, and generally helps to avoid bugs.

```js
function toggleMenu() {
  const showMenuIcon = document.querySelector(".open-menu");
  const closeMenuIcon = document.querySelector(".close-menu");

  mainMenu.classList.toggle("show");
  showMenuIcon.classList.toggle("hidden");
  closeMenuIcon.classList.toggle("hidden");
}
```

Let’s take this line by line. The first piece we already know. We are declaring a function with the name `toggleMenu`. The first thing we do inside it is get a refence to both the SVG icons. Here we are using a different DOM(Document Object Model) function though. For these, we know the elements do not have an `id` attribute and so, we use `querySelector` passing it the name of the class. You will notice that the format in which we provide it is the same way we will define a class in CSS. You can use even more complex selectors as the parameter passed. Essentially any valid CSS selector can be used.

One the following three lines we are using another very useful DOM function, `toggle` on `classList`. By why not wrap this all in a conditional as we did before? While you definitely could, we have already confirmed that we have access to `menuToggle` and `mainMenu` before this function was called so, we should be safe here.

So, what happens on those three lines of code? Well, for each of the elements, we get its `classList` and then say, "toggle the class `show` or `hidden`." This will add the class to the element if it is not already present, or remove it if it is.

We can now call this function inside our listener function.

```js
if (menuToggle && mainMenu) {
  menuToggle.addEventListener("click", (event) => {
    toggleMenu();
  });
}
```

Run your code now, and interact with the button. Whoop!

As a demonstration of some of the other events you can listen for, let’s add a `keyup` event listener to the `document`.
You can add this inside the `if` conditional either before or after the `click` event listener.

```js
document.addEventListener("keyup", (event) => {
  if (event.key === "Escape") {
    toggleMenu();
  }
});
```

Here again, we add an event listener, but this time to entire document. Also, we are listening for the `keyup` even which is fired whenever a user presses a key on their keyboard. Next, we use the `key` propery of the `event` object and test to see whether the key that was pressed was the escape key. If this is the case, we call the `toggleMenu` function. But there is a problem. This means that, if the menu is closed, this will open it. If it is open, it will close. The second of the two is the only one we really care about. We need to test for one more thing.

```js
document.addEventListener("keyup", (event) => {
  if (event.key === "Escape" && mainMenu.classList.contains("show")) {
    toggleMenu();
  }
});
```

Here we use another super useful function of `classList`, the `contains` function. Now we are saying, when a user presses the escape key on their keyboard _and_ the main menu has the class `show` on it, we want to call the `toggleMenu` function. And that is all the JavaScript we need for now. All that is left is a bit more CSS for larger viewports.

## Back to CSS

After the definition of the `hidden` class go ahead and add your media query:

```css
@media screen and (min-width: 63.9375em) {
  .main-menu {
    display: flex;
    justify-content: space-between;
  }
}
```

The first thing we want to do at this viewport is to set the main menu to use flex and specify how our flex items should be laid out.

```css
.main-menu li {
  flex: 1 1 200px;
}
```

Next, we tell our items to grow and shrink, and also start with a `flex-basis` of 200px. And lasty, we want to hide the menu toggle:

```css
.main-menu-toggle {
  display: none;
}
```

Time to celebrate!

But wait, there is more 🙃 If you resize your browser window to a mobile size, open the menu, and then resize it to a desktop size, you will see the menu is not quite where we want it.

![Shows the main menu on desktop with an unwanted offset from the top of the browser window](/assets/media/js-menu/desktop-layout-problem.png)

Why is this?

Well, it is because, unless we clicked the icon again the `show` class is still present on the main menu. We therefore need one more additioal to our CSS inside the media query.

```css
.main-menu,
.main-menu.show {
  display: flex;
  justify-content: space-between;
  position: initial;
}
```

And with that, we have a fulle responsive menu across all viewports. Congratulations!

### Adding JavaScript to your HTML

Inside off Codepen we have separate editors for HTML, CSS, and JavaScript which it then contcatenates together into a single file. Inside VSCode however, you have to do this yourself. You already know how to link your stylesheet, for the JavaScript, you will need to add a script tag to the end of your HTML.

Create a new folder at the root of the project and call it `js`. Inside this folder, create a new file called `main.js`. Now, just before the closing `body` element, add the following code:

```html
<script src="./js/main.js"></script>
```

## Homework

See how you can utilise what we learned today to make _your_ website header responsive across all devices. Send me your links and questions!
