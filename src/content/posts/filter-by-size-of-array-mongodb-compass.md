---
title: Filter by size of Array - MongoDB Compass
pubDate: 2022-07-01
description: Learn how to filter documents in a MongoDB collection by the size of an array field.
author: "Schalk Neethling"
tags: ["byte-sized"]
---

I recently wanted to filter documents in a [MongoDB](https://www.mongodb.com) collection based on the number of entries in one of the fields, which was an `Array` type, using [MongoDB Compass](https://www.mongodb.com/products/compass). For example, a document would look like this:

```jsx
_id: ObjectId('63ae02088bba43f3ac0c89cb')
type: "PUBLIC"
connections: [
    0: {
        origin: "INVITE"
        provider: ObjectId('639a75f138a3513166742cb9')
    },
    1: {
        origin: "INVITE"
        provider: ObjectId('63ae02088bba43f3ac0c89cb')
    }
]
```

Normally, you would get the number of items with something like `connections.length`. However, trying `{ connection: { connections.length == 2 } })` is not the correct syntax. After looking at the MongoDB docs, I discovered that the correct syntax is to use the `$size` query operation.

```jsx
{
  connection: {
    $size: 2;
  }
}
```

That's it! The example document would be returned with the query above. I found out while looking up the documentation that there are many ways to find and filter documents based on Array field aspects. It's worth taking a moment to [read the documentation](https://www.mongodb.com/docs/manual/tutorial/query-arrays/) and get familiar with what's available.

I hope this quick tip was useful. Happy coding!
