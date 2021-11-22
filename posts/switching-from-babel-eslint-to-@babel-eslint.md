---
title: Switching from babel-eslint to @babel-eslint
description: There are a couple of steps to take when switching from the older babel-eslint to the newer @babel-eslint. No worries, I'll show you how to do it.
template: _base.html
---

# Switching from `babel-eslint` to `@babel-eslint`

Recently we got a dependabot pull request on [interactive-examples](https://github.com/mdn/interactive-examples) to update our version of `eslint` to `v8.2.0` but, our continues integration tests were failing. The really scary part was, it showed 533 errors. 😱 Thankfully the fix is trivial once you know what to do. Phew!

## The error

```
Parsing error: Must use import to load ES Module: node_modules/eslint/node_modules/eslint-scope/lib/definition.js
require() of ES modules is not supported.
```

The above is referring to a file in the `eslint` package itself though. What gives... Well, if you have the following in your `eslintrc`, then that is the culprit:

```json
"parser": "babel-eslint",
```

This is actually an old and deprecated version. So, the first step is to switch to `@babel-eslint`.

## The steps

First, we need to remove `babel-eslint` and replace it with `@babel-eslint`.

```bash
yarn remove babel-eslint
```

and then:

```bash
yarn add -D @babel-core @babel-eslint
```

Next, update your `eslintrc` to use `@babel-eslint` instead of `babel-eslint`.

```json
"parser": "@babel/eslint-parser",
```

Alrighty! Now if you run your tests again, you just might see something like this:

```bash
Parsing error: No Babel config file detected for [file].js. Either disable config file checking with requireConfigFile: false, or configure Babel so that it can find the config files.
```

Oh boy! 🤔 No worries, let’s fix this. Pop open your `eslintrc` again and add the following:

```json
{
  "parser": "@babel/eslint-parser",
  "parserOptions": {
    "requireConfigFile": false
  }
}
```

Run your linting tests again and you should be golden!
