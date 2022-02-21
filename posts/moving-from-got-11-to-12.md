---
title: Moving from got 11 to 12 - expected plain object got number error
description: Documents the resolution to the got error, RequestError Expected value which is plain object, received value of type number
---

If you have been using the [got](https://www.npmjs.com/package/got) package and have recently upgraded from version 11 to version 12, you just might run into the following error:

```bash
RequestError: Expected value which is `plain object`, received value of type `number`.
```

In version 11 you might have used `got` something like this:

```js
const buffer = await got(url, {
  responseType: "buffer",
  resolveBodyOnly: true,
  timeout: 5000,
  retry: 5,
});
```

With version 12, the above will cause the error mentioned. There are two things you can do. The first will resolve the error:

```js
const buffer = await got(url, {
  timeout: {
    response: 5000,
  },
  retry: {
    limit: 5,
  },
});
```

You can read more about these objects in the documentation for [Timeout options](https://github.com/sindresorhus/got/blob/c8902ba3420b2def5aab68b3f889039469d0b1a8/documentation/6-timeout.md) and the [Retry API](https://github.com/sindresorhus/got/blob/c8902ba3420b2def5aab68b3f889039469d0b1a8/documentation/7-retry.md). The other change you can make, makes the code a little, dare I say, cleaner:

```js
const buffer = await got(url, {
  timeout: {
    response: 5000,
  },
  retry: {
    limit: 5,
  },
}).buffer();
```

Using the `buffer` function as above is the same as setting `responseType` to "buffer", and `resolveBodyOnly` to `true`. I hope if you ran into this, this post saved yu a little time and frustration.
