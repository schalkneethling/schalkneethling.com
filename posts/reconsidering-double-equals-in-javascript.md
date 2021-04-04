---
title: Reconsidering double equals in JavaScript
description: Could it be that the == operator in JavaScript had a bad rap and it’s time to reconsider it?
template: _base.html
---

# Should we reconsider the `==` operator in JavaScript?

This is difficult, and something I have not even considered for what seems like forever. Every now and again I like to revisit the beginnings of a language I have been using for a long time. Recently, I re-watched the updated version of [“Getting started with JavaScript” by Kyle Simpson on FrontendMasters](https://frontendmasters.com/courses/getting-started-javascript-v2/). One topic Kyle touches on is equality, and it got me thinking about an aspect of JavaScript I never really thought about.

## What is the real difference between `==` and `===`?

If someone asked me this question two days ago I would have answered, "The first does a loose comparison between the two operands and the second a strict comparison". I have always thought it kinda strange that just reading that all by itself does not _really_ explain the difference. You need to also provide a code example such as this:

```javascript
const aString = "1";
const aNumber = 1;

function compare(a, b) {
  if (a === b) {
    console.log("strictly equal");
  } else if (a == b) {
    console.log("loosely equal");
  }
}

compare(aString, aNumber);
// output "loosely equal"
compare(1, aNumber);
// output "strictly equal"
```

Another way to state the above is to say that double-equals compares the two operands by value and tripple-equals compares by type _and_ value. That becomes clearer especially in the context of the code example but, there is yet another way to express this 🙃

Once you understand [coercion in JavaScript](https://github.com/getify/You-Dont-Know-JS/blob/59d33b0c47c214270b87e7afd5670ad864d8a465/up%20%26%20going/ch2.md#coercion) you can explain it. Quoting Kyle, “double-equals allows coersion of the operands while tripple-equals does not”. I like this way of explaining it. It sounds clear an concise.

This does mean that if you _know_ the types of your operands, there is zero difference between how double and tripple euals will behave. In a world where more and more JavaScript developers are turning to [TypeScript](https://www.typescriptlang.org/) or adopting a mindset of being clear about your intended types through [JSDoc type annotations](https://ricostacruz.com/til/typescript-jsdoc) perhaps it is a moment in time to rethink the all out ban on double equals?

In the course Kyle demonstrated a scenario where using double-equals actually leads to more readable code thanks to coercion. Let's assume we have two `Objects` that each contain a `topic` attribute.

```javascript
const bookOne = {
  title: "You don't know JS Yet",
};
const bookTwo = {
  title: "JavaScript: The Difinitive Guide",
  topic: null,
};
```

We next have a conditional that will only execute its body if the `topic` attribute of both objects are empty. If we use tripple-equals, we will write the conditional as follows:

```javascript
if (
  (bookOne.topic === null || bookOne.topic === undefined) &&
  (bookTwo.topic === null || bookTwo.topic === undefined)
) {
  // do something
}
```

If however we embrace the coersiveness afforded us by using double-equals, we can rewrite the above as follows:

```javascript
if (bookOne.topic == null && bookTwo.topic == null) {
  // do something
}
```

- [Codepen](https://codepen.io/schalkneethling/pen/RwKVMoL?editors=0012)

Whether `topic` is exactly `null` or `undefined` is not really that interesting here. What is important is that the content of the conditional only execute if both properties are empty. Both these code will satisy this requirement.

How many such cases are there in our codebases? That is not a simple question to answer but, it does make you think. Should we reconsider double-equals?
