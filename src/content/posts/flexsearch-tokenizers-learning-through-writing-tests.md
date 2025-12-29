---
title: Flexsearch tokenizers - Learning through writing tests
pubDate: 2022-07-01
description: An introduction to Flexsearch and its tokenizers through writing and interpreting tests.
author: "Schalk Neethling"
tags: ["javascript"]
---

[Flexsearch](https://github.com/nextapps-de/flexsearch/) is a full-text search implementation for use in [the browser and Nodejs](https://github.com/nextapps-de/flexsearch/#load-library). I use it on the [DeveloperToolchest](https://developer-toolchest.com/), but I have been getting underwhelming search results. I knew the reason was not Flexsearch, but my lack of knowledge of the library.

There is quite a lot of [documentation](https://github.com/nextapps-de/flexsearch/tree/master/doc) on the [GitHub repository](https://github.com/nextapps-de/flexsearch/), but again, I felt that just reading the docs was not giving me a clear picture. I decided that the best way for me to learn how to use this was by experimenting with Flexsearch [through writing tests](https://github.com/schalkneethling/learning-flexsearch).

This post is a deep dive into some of the learnings from my experimentation.

## Jest

For the test runner I decided on [Jest](https://jestjs.io/) as I am pretty familiar with it. For my test data, I am using the following object.

```json
const data = [
  {
    id: 1,
    title: "Mozilla Firefox",
    engine: "Gecko",
    tag: ["servo", "rust", "spider monkey"],
  },
  {
    id: 2,
    title: "Google Chrome",
    engine: "Chromium",
    tag: ["blink", "v8"],
  },
  {
    id: 3,
    title: "Microsoft Edge",
    engine: "Chromium",
    tag: ["blink", "chakra"],
  },
  {
    id: 4,
    title: "Apple Safari",
    engine: "Webkit",
    tag: ["JavaScriptCore", "SquirrelFish", "nitro"],
  },
];
```

Here is the `main` function that is called by the tests.

```jsx
function main(searchIndex, searchString) {
  // uses the search string passed to the function or,
  // the string passed as an argument via the terminal
  const q = searchString || process.argv.slice(2).join(" ");

  const resultSet = searchIndex.search(q, { tag: q });
  const allMatches = resultSet.flatMap(({ result }) => result);
  const uniqueMatches = new Set(allMatches);
  const results = Array.from(uniqueMatches).map((result) =>
    data.find((item) => item.id === result),
  );

  return results;
}
```

> NOTE: We will dig into the reasons for using `flatMap` and `Set` a bit later.

In our test file `index.test.js` we import this `main` function and some helper functions. We will import the helper functions one by one as we talk about them.

```js
import main, { indexTitleData } from "./index.js";
```

### Search on the title property

We start our exploration by indexing and searching on a single property from our data object. In this case, the `title` property.

```js
export const indexTitleData = () => {
  const index = new Document({ document: "title" });
  data.forEach((item) => index.add(item));

  return index;
};
```

There are three types of indexes, `Index`, `Worker` / `WorkerIndex` and `Document`. For our purposes we are going to use a `Document` index. [From the docs](https://github.com/nextapps-de/flexsearch#load-library):

> Document is multi-field index which can store complex JSON documents (could also exist of worker indexes).

In the above function we pass in a document descriptor that tells it to only index content from the `title` property. We loop through the data object, add each item to the index, and return the `index`.

```jsx
describe("search indexTitleData index", () => {
  let index;

  beforeEach(() => {
    index = indexTitleData();
  });
});
```

Before each test is run in this suite of tests we will call our `indexTitleData` function to get our index ready.

```jsx
describe("search indexTitleData index", () => {
  let index;

  beforeEach(() => {
    index = indexTitleData();
  });

  test("should return a single result", () => {
    const expected = [{ id: 1, title: "Mozilla Firefox", engine: "Gecko" }];
    const response = main(index, "mozilla");

    expect(response).toEqual(expected);
  });
});
```

In the above test we are expecting a search for the string “mozilla” to return a single result, which is the entry for the Firefox browser. We call `main` passing our index and the search string. In `package.json` we have the following npm script:

```json
"test": "node --experimental-vm-modules node_modules/jest/bin/jest.js"
```

> NOTE: The reason we call Jest this way is because the code we are testing is written using ES6 modules. At the time of writing, support is still experimental in Jest. The above is equivalent to the more common `"test": "jest"`.

To run our test we execute `npm t` from the command line.

> NOTE: `npm t` is short for `npm test` which is one of the command that can be called without also specifying `run`, for example: `npm run dev`.

When running the test, the response matches what we expected, and the test passes.

```jsx
test("searching for partial query string returns no results", () => {
  const expected = [];
  const response = main(index, "mozi");

  expect(response).toEqual(expected);
});
```

The next test expects that the search will not return any results. When using a partial string using the current index there will be no match as the default option for the [tokenizer](https://www.techtarget.com/searchsecurity/definition/tokenization) is strict. In strict mode, it will only return a match for matches on the entire word. We will explore how the tokenizer works at a high level a little later.

```jsx
test("shoud return no results", () => {
  const expected = [];
  const response = main(index, "gecko");

  expect(response).toEqual(expected);
});
```

The next test again expects no results to be returned, but for a different reason. This time we are searching for a whole word, but using a value that is not present in the title but in the `tags` array. When executing the tests now, they should all pass.

## Indexing and searching against two properties

The next function will index both the `title`, and the `engine` properties.

```jsx
export const indexData = () => {
  const index = new Document({ index: ["engine", "title"] });
  data.forEach((item) => index.add(item));

  return index;
};
```

The following test will confirm that indexing works as expected.

```jsx
beforeEach(() => {
  index = indexData();
});
```

In the `beforeEach` function the `indexData` function is called.

```jsx
test("searching for engine returns a result", () => {
  const expected = [{ id: 1, title: "Mozilla Firefox", engine: "Gecko" }];
  const response = main(index, "gecko");

  expect(response).toEqual(expected);
});
```

The last test of the first suite ended with a test against values that are stored in the `engine` data property. In that test no results was expected, which was indeed the case. Now that the `engine` property is part of the index, we do expect a match to be returned for the Mozilla Firefox browser. Running the test, does indeed return the expected result.

```jsx
test("searching for partial engine name returns no results", () => {
  const expected = [];
  const response = main(index, "gec");

  expect(response).toEqual(expected);
});
```

Because the tokenizer is still in its default strict mode, searching for a partial string will still return no results.

```jsx
test("searching for title keyword returns a result", () => {
  const expected = [{ id: 2, title: "Google Chrome", engine: "Chromium" }];
  const response = main(index, "chrome");

  expect(response).toEqual(expected);
});
```

Lastly we confirm that the `title` property is indeed still indexed by searching for a search string that should match the Google Chrome browser. Running the tests confirms that this is indeed the case.

## Searching using a custom tokenizer

The time has come to start customising our tokenizer to see how the different options impact our results.

```jsx
export const indexDataCustomTokenizer = (tokenizerType = "strict") => {
  const index = new Document({
    document: { index: ["engine", "title"], tag: "tag" },
    tokenize: tokenizerType,
  });
  data.forEach((item) => index.add(item));

  return index;
};
```

Unlike the other indexer function this one takes a parameter that defines the type of tokenizer to use, falling back to the default of `strict` if a custom value was not provided. Let’s put this to the test.

### Using a forward tokenizer

The first set of tests uses a forward tokenizer.

```jsx
beforeEach(() => {
  index = indexDataCustomTokenizer("forward");
});
```

Before looking at the tests, what does a forward tokenizer do? Let’s take the search string `gecko` as an example. With the `strict` tokenizer, the only time a results will be returned is when the search string is `gecko`, nothing less and nothing more. Well, maybe more.

What the forward tokenizer will allow is for matches to be returned for the string `geck`,for example. Why? The tokenizer will index the strings starting from the first character and then expand the index by building on that character one character at a time, in a forward direction. In other words, all of the following will be in the index, `g`, `ge`, `gec`, `geck`, and `gecko`. Let’s confirm that this is in fact the case.

```jsx
test("searching for full engine name returns a result", () => {
  const expected = [{ id: 1, title: "Mozilla Firefox", engine: "Gecko" }];
  const response = main(index, "gecko");

  expect(response).toEqual(expected);
});
```

Here we confirm that our previous test case still works.

```jsx
test("searching for partial engine name returns a result", () => {
  const expected = [{ id: 1, title: "Mozilla Firefox", engine: "Gecko" }];
  const response = main(index, "ge");

  expect(response).toEqual(expected);
});
```

Running the tests will all pass, confirming our understanding of the tokenizer. In the following test a partial string is used that should return multiple results.

```jsx
test("searching for partial engine name that should return multiple results", () => {
  const expected = [
    { id: 2, title: "Google Chrome", engine: "Chromium" },
    { id: 3, title: "Microsoft Edge", engine: "Chromium" },
  ];

  const response = main(index, "chr");

  expect(response.length).toEqual(2);
  expect(response).toEqual(expected);
});
```

Running the tests confirms the expected results. The description for the following test contains a spoiler.

```jsx
test("search using a query string that starts in the middle of the word returns no results", () => {
  const response = main(index, "hro");

  expect(response.length).toEqual(0);
});
```

In the above we use a search string that uses some characters that are found in the middle of the word `chrome`. With a forward tokenizer this yield no results as the string `hro` will not be in the index. The only possible matches will be `c`, `ch`, `chr`, `chro`, `chrom`, `chromi`, `chromiu`, and `chromium`. Running the test suite confirms that no results are returned for this final test.

### Using a reverse tokenizer

Next we will experiment with a reverse tokenizer. The `beforeEach` call is updated to call our `indexDataCustomTokenizer` with a value of `reverse`.

```jsx
beforeEach(() => {
  index = indexDataCustomTokenizer("reverse");
});
```

As before, the first test serves as a baseline and confirms that a search for `gecko` still returns the expected result.

```jsx
test("searching for full engine name returns a result", () => {
  const expected = [{ id: 1, title: "Mozilla Firefox", engine: "Gecko" }];
  const response = main(index, "gecko");

  expect(response).toEqual(expected);
});
```

Before looking at the next tests, how does the reverse tokenizer work? It starts by following the exact same algorithm as the forward tokenizer so, the following will be in the index, `c`, `ch`, `chr`, `chro`, `chrom`, `chromi`, `chromiu`, and `chromium`. What the tokenizer will do next is start dropping characters from the front of the word until only the final character is left. This means that the index will contain all of the following, `c`, `ch`, `chr`, `chro`, `chrom`, `chromi`, `chromiu`, `chromium`, `hromium`, `romium`, `omium`, `mium`, `ium`, `um`, and `m`.

The following test is another baseline test.

```jsx
test("searching for partial engine name that should return multiple results", () => {
  const expected = [
    { id: 2, title: "Google Chrome", engine: "Chromium" },
    { id: 3, title: "Microsoft Edge", engine: "Chromium" },

  const response = main(index, "chr");

  expect(response.length).toEqual(2);
  expect(response).toEqual(expected);
});
```

Here is the first test that puts the new tokenizer to the test.

```jsx
test("search using a query string that starts with the last 3 characters of a word should return multiple results", () => {
    const expected = [
      { id: 2, title: "Google Chrome", engine: "Chromium" },
      { id: 3, title: "Microsoft Edge", engine: "Chromium" },

    const response = main(index, "ium");

    expect(response.length).toEqual(2);
    expect(response).toEqual(expected);
  });
```

All the tests will pass when running the test suite at this stage. The following test will return no results as the search string uses characters found in the middle of a string.

```jsx
test("search using a query string that starts in the middle of a word should return no results", () => {
  const response = main(index, "hro");

  expect(response.length).toEqual(0);
});
```

What if we _wanted_ to get results for these search strings? That is where a full tokenizer comes into play.

### Let’s talk about memory

Before we look at a full tokenizer it is important to understand the impact on memory usage and as a result the speed at which results will be returned. The [Flexsearch documentation](https://github.com/nextapps-de/flexsearch#tokenizer-prefix-search) defines four kinds of tokenizers, three of which we have looked at already. As the documentation states, using a tokenizer towards to top of the table will be faster and use less memory than to the bottom of the table.

But why is this? Well, for each character that is stored in memory, the application will use 1 byte (8 bits) of data. This is based on the most basic aspects of [memory storage calculations](http://eckstein.rutgers.edu/mis/handouts/storage-calcs.pdf). If you are indexing characters from one of the Asian languages, it will generally use 2 bytes (16 bits) to store a character. Let’s look at an example using the word `Firefox`.

When using the default strict tokenizer, it will tokenise entire words only. That means the only item in the index will be the word, Firefox. With that said, let’s look at how much memory this will use. The word contains seven characters which means it will use 7 bytes (56 bits) of memory.

What if you index a sentence like, Firefox is a Gecko based browser? In this case the following will be in the index. The tokenizer will split on spaces and store each word in memory.

```jsx
Firefox (7 bytes)
is (2 bytes)
a (1 byte)
Gecko(5 bytes)
based (5 bytes)
browser (7 bytes)
```

The entire index will take up 27 bytes (216 bits) of memory. As mentioned, the more we move towards the bottom of the table the more expensive the tokenizer. Let’s look at what will be in the index if we use the forward tokenizer with the word, `firefox`.

```jsx
f (1 byte)
fi  (2 bytes)
fir  (3 bytes)
fire  (4 bytes)
firef  (5 bytes)
firefo  (6 bytes)
firefox  (7 bytes)
```

Therefore, the word `firefox` will use a total of 28 bytes (224 bits) of memory. Which is interestingly more memory then the entire sentence will take up with a strict tokenizer. Using the reverse tokenizer, will result in the following index.

```jsx
f (1 byte)
fi  (2 bytes)
fir  (3 bytes)
fire  (4 bytes)
firef  (5 bytes)
firefo  (6 bytes)
firefox  (7 bytes)
irefox  (6 bytes)
refox  (5 bytes)
efox  (4 bytes)
fox  (3 bytes)
ox  (2 bytes)
x  (1 byte)
```

Therefore, the word `firefox` will use a total of 49 bytes (392 bits) of memory. That is 21 bytes (168 bits) more than a forward tokenizer. Therefore, be careful when choosing a tokenizer. I am not going to dig into the full tokenizer here as I am still understanding it myself. Suffice it to say that it will use even more memory than any of those that have been discussed.

### Using a full tokenizer

Before closing, we will take a quick look at using the full tokenizer.

```jsx
beforeEach(() => {
  index = indexDataCustomTokenizer("full");
});
```

With the above configuration all the baseline tests will pass as expected. As mentioned at the end of the reverse tokenizer discussion, using a search string like `"omi"`, which is in the middle of the word `chromium`, will not return any results.

```jsx
response = main(index, "omi");

expect(response.length).toEqual(2);
expect(response).toEqual(expected);
```

With the new configuration, the above will return the same results as searching for `chr`, for example. Depending on your use case and the size of you dataset, this might be what you need, and the tradeoffs worth it.

### Conclusion

The above only scratches the surface of what is possible with Flexsearch and the array of options available. I hope that this article serves as a decent introduction into some of the functionality and demonstrates one way of exploring the library further.

I am not done exploring the library and will write more as I learn more, but this is already going to improve the search results on the DeveloperToolchest and I look forward to improving even more.
