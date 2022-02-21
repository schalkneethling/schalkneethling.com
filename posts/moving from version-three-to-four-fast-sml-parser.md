---
title: Moving from fast-xml-parser 3 to 4 - parser.parse is not a function
description: Documents the resolution to the fast-xml-parser error, parser.parse is not a function
---

With version 3 of the [fast-xml-parser](https://www.npmjs.com/package/fast-xml-parser) package you would commonly import and use it as follows:

```js
import parser from "fast-xml-parser";
...
const feed = parser.parse(feedText);
```

This no longer works with version 4 and will throw the error: "parser.parse is not a function". To resolve this you need to specifically import the `XMLParser` and instantiate it before using it.

```js
import { XMLParser } from "fast-xml-parser";
...
const parser = new XMLParser();
const feed = parser.parse(feedText);
```

You can find the [new documentation here](https://github.com/NaturalIntelligence/fast-xml-parser). Just look for the example section. I hope if you ran into this, this post saved yu a little time and frustration.
