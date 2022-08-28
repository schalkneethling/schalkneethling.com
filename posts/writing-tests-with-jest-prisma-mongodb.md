---
title: Writing tests with Jest, Prisma, and MongoDB
description: How do you write tests using Jest for a Prisma and MongoDB API? This is a quick guide on how to do this.
draft: true
---

When writing an API it is critical to have a test suite that puts your API through the same scenarios as that of a user of the API. This ensures that:

- All API functions return data in the format the user would expect.
- That the API returns an appropriate response when the response fails or, the user has passed invalid data.
- Can easily be run during development and as part of your continuous integration process.
- Help identify bugs and avoid regressions.
- Provide peace of mind to the author and user when making changes, or improvements to the API.

In this post I will cover the basics of setting up [Jest](https://jestjs.io/) with a [MongoDB](https://www.mongodb.com/) and [Prisma based API](https://www.prisma.io/) and writing a test for an API endpoint.

## Getting started

If you are reading this I am making an assumption that you have a working knowledge of using Nodejs, JavaScript, MongoDB, and Prisma. I also do not want to restate what is already in the getting started docs for Jest so, I will simply point you to the [Jest docs](https://jestjs.io/docs/getting-started) for getting started.

> Note: If you are using Typescript to write your API, you will also need [`ts-jest](https://kulshekhar.github.io/ts-jest/docs/getting-started/installation). Also take special note of generating a [Jest config file using `ts-jest`](https://kulshekhar.github.io/ts-jest/docs/getting-started/installation#jest-config-file).
> NOTE: ESM: If you are using EcmaScript Modules there is some more configuration needed as [ESM support in Jest](https://jestjs.io/docs/ecmascript-modules) is still exprimental. There is also some additional configuration needed for [`ts-jest` to work with ESM](https://kulshekhar.github.io/ts-jest/docs/guides/esm-support).

### Sidenote

If you are using both Typescript and ESM, I am going to save you some time here. Here is the configuration I use that I can attest works.

First you will need to have a `jest.config.ts` file with the following contents:

```ts
import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest/presets/default-esm",
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

export default config;
```

Next you will need a `tsconfig.json` with the following:

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "module": "ES2020",
    "moduleResolution": "NodeNext"
  }
}
```

In `package.json` call Jest as documented in the [Jest docs](https://jestjs.io/docs/ecmascript-modules):

```json
"test": "NODE_OPTIONS=--experimental-vm-modules npx jest"
```

If you are _not_ using TypeScript but as using ES modules, the configuration is very similar for Jest, but there is a small gotacha to be aware off. First you will need to call Jest the same way in `package.json` and you would not need a `tsconfig` file.

If your Jest configuration file uses the `.js` extension you _need_ to use the following syntax and _not_ the `module.exports` syntax:

```js
const config = {
  preset: "ts-jest/presets/default-esm",
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

export default config;
```

This is the exact same code as with TypeScript but, without the type information. You _can_ type the above using JSDoc comments as follows:

```js
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  verbose: true,
};
```

This is completely optional and not needed to get Jest to work with ESM. If you for any reason _need_ to use the `module.exports` syntax, you will either need to [configure Jest via `package.json`](https://jestjs.io/docs/configuration) or name your file using the `.cjs` file extension. Using the `.cjs` will tell the system to treat this specific file as commonJS.

### Writing tests

Alrighty, with all of that out of the way, we can write some tests. Let’s start with the most basic test as used by the Jest documentation. Here we are simply verifying that everything does indeed work. Create a file caled `index.ts`(I a using TypeScript here but feel free to stick with `.js` and JavaScript):

```ts
export function sum(a: number, b: number): number {
  return a + b;
}
```

Next, create your test file. We will use the common naming scheme: `index.test.ts`:

```ts
import { sum } from "./index.js";

test("adds 1 + 2 to equal 3", () => {
  expect(sum(1, 2)).toBe(3);
});
```

If you have set up your `test` target in `package.json` as discussed earlier you can now run your test with, `npm test`. If all is right with the world, you should end up with a successful test run.

## Testing our Prisma API

I am not going to work directly with MongoDB here but through Prisma as mentioned at the start of the post. I will the set up that worked for me here, but you can also [reference the same Prisma docs](https://www.prisma.io/docs/guides/testing/unit-testing) I used for additional details.

We need to update our Jest configuration a little bit.

```ts
const config = {
  preset: "ts-jest/presets/default-esm",
  clearMocks: true,
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  setupFilesAfterEnv: ["./singleton.ts"],
};

export default config;
```

The additions are `clearMocks` and `setupFilesAfterEnv`. The Prisma docs explains the need for `setupFilesAfterEnv` as follows:

> The module the path points towards is the code that runs setting up the testing framework before each test file is executed.

Setting [`clearMocks` to true](https://jestjs.io/docs/configuration#clearmocks-boolean) is "equivalent to calling `jest.clearAllMocks()` before each test". We also need to pass the `-i` flag, which is an [alias for the `--runInBand` flag](https://jestjs.io/docs/cli#--runinband), to Jest when calling it. This ensures that tests are run serially in the current process instead of using a worker pool. This can lead to your tests running slower, but according to the Prisma docs it is needed to avoid [race conditions](https://techterms.com/definition/race_condition).

There are [two approaches mentioned in the Prisma docs](https://www.prisma.io/docs/guides/testing/unit-testing#mocking-the-prisma-client) for mocking our client when unit testing. The one uses a singleton pattern and the other dependency injection. Both are valid and have their pros and cons. I will here be using the [singleton pattern](https://www.prisma.io/docs/guides/testing/unit-testing#singleton).

The first thing we want to do is intall the [Jest mock extended](https://github.com/marchaos/jest-mock-extended) package.

```bash
npm install jest-mock-extended --save-dev
```

If you do not already have a Prisma client file, create a file called `client.ts` at the root of your project with the following contents:

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
```

You can type out or copy and paste the code for the singleton from the [Prisma docs](https://www.prisma.io/docs/guides/testing/unit-testing#singleton). I recommend typing it out as a means of getting familiar with the code.
