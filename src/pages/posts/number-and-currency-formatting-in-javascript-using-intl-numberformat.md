---
layout: ../../layouts/MarkdownPostLayout.astro
title: Number and Currency Formatting in JavaScript using Intl.NumberFormat
pubDate: 2024-04-04
canonical: "https://dev.to/schalkneethling/number-and-currency-formatting-in-javascript-using-intlnumberformat-46og"
description: "While this post does not by any means aim to cover all the amazing things you can do with Intl.NumberFormat, I do cover two very common use cases you may have faced when formatting numbers in JavaScript."
author: "Schalk Neethling"
tags: ["javascript"]
---

While this post does not by any means aim to cover all the amazing things you can do with [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat), I do cover two very common use cases you may have faced when formatting numbers in JavaScript. As with most things concerning programming, there are many ways to achieve the same end result, this is one of my favorite APIs when formatting numbers in JavaScript.

> NOTE: Feel free to share how you handle number formatting with JavasScript in the comments.

First things first, [support for `Intl.NumberFormat` and the related `format` function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/format#browser_compatibility) across runtime and browser environments is excellent so you can safely follow this post and use `Intl.NumberFormat` in production.

## Basic number formatting

Let's say you have a magical coin that superficially increases in value every 500 milliseconds until it reaches 2 million at which point it stops.

```js
const increment = 1000;
const maxCoinValue = 2000000; // two million
let magicCoinCurrentValue = 0;

const magicalCoinMiner = setInterval(() => {
  if (magicCoinCurrentValue < maxCoinValue) {
    magicCoinCurrentValue = magicCoinCurrentValue + increment;
    console.log(magicCoinCurrentValue);
  } else {
    clearInterval(magicalCoinMiner);
  }
}, 500);
```

As the number grows ever bigger, the readability of the number will suffer as we are currently outputting the number without any formatting.

```bash
1000 # one thousand
...
30000 # thirty thousand
...
400000 # four hundred thousand
...
1800000 # one million eight hundred thousand
```

Let's address the formatting using `Intl.NumberFormat` and the related [`format` function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/format).

```js
const increment = 1000;
const maxCoinValue = 2000000; // two million
let magicCoinCurrentValue = 0;

const magicalCoinMiner = setInterval(() => {
  if (magicCoinCurrentValue < maxCoinValue) {
    magicCoinCurrentValue = magicCoinCurrentValue + increment;
    const formattedValue = Intl.NumberFormat().format(magicCoinCurrentValue);

    console.log(formattedValue);
  } else {
    clearInterval(magicalCoinMiner);
  }
}, 500);
```

With this change, the output will now look as follows:

```bash
1,000 # one thousand
...
30,000 # thirty thousand
...
400,000 # four hundred thousand
...
1,800,000 # one million eight hundred thousand
```

I am sure that you can agree that this new format is a lot easier to read. Right now, we are using the default `NumberFormat` but we can make this locale aware by specifying the `locale` as the first parameter to `NumberFormat` like so:

```js
const formattedValue = Intl.NumberFormat("no").format(magicCoinCurrentValue);

console.log(formattedValue);
```

The `no` value sets the locale to Norwegian. With this, the numbers will now be formatted as follows:

```bash
1 000 # one thousand
...
30 000 # thirty thousand
```

If we change the locale to `de` for German, the numbers will be formatted as follows:

```bash
1.000 # one thousand
...
30.000 # thirty thousand
```

The numbers we are printing are monetary values so they are missing a decimal value and a currency symbol. One way we can do this is by using [JavaScript template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) to append and prepend the pieces we are missing.

```js
console.log(`$${formattedValue}.00`);
```

This is not ideal for several reasons. Our decimal value is hard coded as is our currency symbol. It is also hard to read and error-prone. In addition, the hard-coded decimal value is especially problematic.

## Currencies

One of the many things `NumberFormat` can help us with is with currencies. To get both the currency symbol and our decimals without the need for the template literal or hard coding, we can specify the `style` and `currency` parameters for the `NumberFormat` constructor:

```js
const formattedValue = Intl.NumberFormat("en", {
  currency: "USD",
  style: "currency",
}).format(magicCoinCurrentValue);

console.log(formattedValue);
```

> NOTE: You need to specify the `locale` or `undefined` (which will use the default locale) or the options object will be ignored.

With this configuration, we will get the following output:

```bash
$1,000.00 # one thousand
...
$30,000.00 # thirty thousand
```

Pretty neat, right?! There are a couple of things to be aware of though. Making our output locale aware can result in surprising output if you are not used to how monetary values are displayed in different locales.

What do I mean by that?

Well, if we change the example above to use the `de` locale and the Euro currency symbol you might expect output like, `€1.000.00`.

```js
const formattedValue = Intl.NumberFormat("de", {
  currency: "EUR",
  style: "currency",
}).format(magicCoinCurrentValue);

console.log(formattedValue);
```

However, this is the output you will get:

```bash
1.000,00 € # one thousand
...
30.000,00 € # thirty thousand
```

There is nothing wrong with this and it is the way currencies are commonly displayed in countries that are part of the European Union. However, if you want the currency symbol displayed on the left, keep the `en` locale.

```js
const formattedValue = Intl.NumberFormat("en", {
  currency: "EUR",
  style: "currency",
}).format(magicCoinCurrentValue);

console.log(formattedValue);
```

Now the output will be as follows:

```bash
€1,000.00 # one thousand
...
€30,000.00 # thirty thousand
```

Do note that the number separators have also changed to match the locale. What happens if we do something like this?

```js
const formattedValue = Intl.NumberFormat("en", {
  currency: "CAD",
  style: "currency",
}).format(magicCoinCurrentValue);
```

This will result in the following:

```bash
CA$1,000.00 # one thousand
...
CA$30,000.00 # thirty thousand
```

What happens if we change the locale to `ca` for Canada?

```js
const formattedValue = Intl.NumberFormat("ca", {
  currency: "CAD",
  style: "currency",
}).format(magicCoinCurrentValue);
```

Now we get:

```bash
1.000,00 CAD # one thousand
...
30.000,00 CAD # thirty thousand
```

> NOTE: The number separator has also changed above.

But what if you wanted it to display just the dollar symbol? That is where the `currencyDisplay` property comes into play:

```js
const formattedValue = Intl.NumberFormat("en", {
  currency: "CAD",
  currencyDisplay: "narrowSymbol",
  style: "currency",
}).format(magicCoinCurrentValue);
```

> NOTE: I have also changed the locale above to `en`.

Now we get:

```bash
$1,000.00 # one thousand
...
$30.000.00 # thirty thousand
```

## Conclusion

As you can tell from the above, and this only touches the surface, `Intl.NumberFormat` is incredibly powerful especially its ability to ease the localization of number formatting and currencies.

I hope you found this quick look at the basics of this API helpful and that it sparked your curiosity to learn more. Think about some of the projects you are working on at the moment, are there areas where you can take advantage of this to simplify and make your code more robust?

Until the next one! Keep making the web awesome, open, and accessible. 🙏

### Resources

- Here is a quick and dirty utility to [play with what you learned](https://codepen.io/schalkneethling/pen/ZEZvMYM).
- [How to Format 30+ Currencies from Countries All Over the World](https://fastspring.com/blog/how-to-format-30-currencies-from-countries-all-over-the-world/)
- [Current currency & funds code list](https://en.wikipedia.org/wiki/ISO_4217#List_of_ISO_4217_currency_codes)
