---
layout: ../../layouts/MarkdownPostLayout.astro
title: Typed Objects in v-for - Vue3 with TypeScript
pubDate: 2024-03-03
canonical: "https://dev.to/schalkneethling/typed-objects-in-v-for-vue3-with-typescript-6l8"
description: How do I handle type inference challenges with v-for in Vue 3 templates using TypeScript? Let's find out more.
author: "Schalk Neethling"
tags: ["vuejs", "typescript"]
---

I just ran into the following situation in Vue3 and prayed at the altar of the TypeScript gods for an answer. After much beard-pulling and some choice phrases, I found something that works. Is this _the_ way? I cannot confirm nor deny that 😃 but it works and makes sense as well.

## Problem

```vue
<td v-for="value in currentRecord" :key="recordId">
  {{ value.displayText ? value.displayText : value }}
</td>
```

Seems innocent enough right? Well, TypeScript had something to say about that, quote: `'value' is of type 'unknown'. ts(18046)`. My first thought was to type `value` but there seems to be no way to do this inside the template portion of a single file component.

So where does `currentRecord` come from? Over here:

```js
const currentRecord = Object.fromEntries(
  Object.entries(props.record).filter(([key]) => key !== "id")
);
```

## The Solution

If I typed `currentRecord`, would TypeScript then be happy inside the template? Yes it will, but there is another problem here. The `currentRecord` object is a bit tricky in that it can contain properties that have a number, or string as the value and some can be an object itself. Something like this:

```js
{
  id: 1,
  word: "Monkey",
  phoneme: "i",
  blendDirection: {
    id: 1,
    displayText: "reverse",
  },
}
```

I could create a type that details every property of the object and where relevant indicates that it can be a string or an object like this:

```ts
type Record = {
  id: number;
  word: string;
  blendDirection:
    | string
    | {
        id: number;
        displayText: string;
      };
  // other properties
};
```

However, there is another way that will be a bit less of a maintenance burden and is then also the type I used in the end:

```
type Record = {
  [key: string]:
    | string
    | number
    | undefined
    | {
        id: number;
        displayText: string;
      };
};
```

With this, we have an object that contains a `key` of type `string` that can have any of the listed values. Because `undefined` is one of those, the property itself can be optional. Now let's type `currentRecord`. Doing it this way will make TypeScript sad:

```ts
const currentRecord: Record = Object.fromEntries(
  Object.entries(props.record).filter(([key]) => key !== "id")
);
```

What you want to do is this:

```ts
const currentRecord = Object.fromEntries(
  Object.entries(props.record).filter(([key]) => key !== "id")
) as Record;
```

OK, now everything should be good, right?

**Wrongo!**

The first thing that TypeScript is going to complain about is that `value` can be undefined. I get why it would say that we told TypeScript that that could be the case. So this should do the trick:

```js
{
  {
    value?.displayText ? value.displayText : value;
  }
}
```

**Big Nope!**

Because the value could be a `string` or a `number`, TypeScript will say, `Property 'displayText' does not exist on type 'string | number | { id: number; displayText: string; }'.
  Property 'displayText' does not exist on type 'string'.ts(2339)`

Fair enough 🥺 - So what to do... The final piece of the puzzle is to check whether `value` is an `object` and only then grab `displayText`, like so:

```js
{
  {
    typeof value === "object" ? value.displayText : value;
  }
}
```

And that is it! Now, your code works (It did already, but we want to ensure TypeScript is happy as well right?) and TypeScript is happy.

I hope you found this helpful and that it will save you some time and hair. Happy coding!
