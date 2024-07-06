---
layout: ../../layouts/MarkdownPostLayout.astro
title: Using EventEmitter in Node.js
pubDate: 2022-08-01
description: Using the Nodejs EventEmitter with GitHub webhooks
author: "Schalk Neethling"
tags: ["javascript", "nodejs"]
---

The event system in Nodejs is the functional backbone of much of the Node core APIs. HTTP and TCP servers written in Node are event emitters. A TCP socket is an event emitter. The request and response objects of HTTP are both event emitters. We as developers can take advantage of the same event system in our work via the `EventEmitter` constructor in the Node `events` module. Let’s explore how what is exposed by Node and how we can use it.

> NOTE: I had a pretty tough time coming up with some sort of example to demonstrate using `EventEmitter` in a non-contrived way. I believe I ended up with something that is not half bad in the end 🙃. If you have a more concrete use-case I would love to read about it.

At its most basic, you can use the `EventEmitter` as follows:

```js
import EventEmitter from "events";

const event = new EventEmitter();
event.emit("my-event", some, args);
```

While the above is valid and will work just fine, it is much more common to create your own `class` that `extends` from `EventEmitter`:

```js
class MyEmitter extends EventEmitter {
    constructor(opts = {}) {
        super(opts);
    }
}

...

const emitter = new MyEmitter();
emitter.emit("my-event", some, args);
```

Enough theory, let’s jump into the example.

## Working with GitHub Webhooks

As the heading suggests, we are going to work with [GitHub’s webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks) as an example of using `EventEmitter`. Essentially what we are going to do is:

1. Create a simple HTTP server
2. Setup a `/payload` route that GitHub will call
3. Depending on the data we get, emit custom events
4. Listen for these custom events
5. Log some information about the request to the console

> NOTE: All the code for the example can be found on the [accompanying repository](https://github.com/schalkneethling/event-emitter-and-github-webhooks).

I won’t go into much of the details of creating a simple HTTP server with Nodejs but, the basics are as follows:

```js
import http from "http";

http
  .createServer((req, res) => {
    if (req.url === "/") {
      res.write("Hello World");
      res.end();
    }
  })
  .listen(3000);
```

With the above you can run the server with `node index.js` and then open your browser to `http://localhost:3000`. If all is well, the text "Hello World" should be printed in the browser window. We want another route as mentioned earlier though so, we will add that:

```js
import http from "http";

http
  .createServer((req, res) => {
    if (req.url === "/") {
      res.write("Hello World");
      res.end();
    } else if (req.url === "/payload") {
      console.log("this was made by GitHub, maybe...");
    }
  })
  .listen(3000);
```

I say "maybe" in the console statement above because we are not yet checking what type of request was sent. GitHub webhooks will always send a `POST` request to the `/payload` route. At the moment, our log statement will fire for all request types hitting the `payload` route. Let’s address that.

```js
// inside the `payload` route
if (req.method === "POST") {
  console.log("This was made by GitHub");
} else if (req.method === "GET") {
  res.write("Waiting for webhook events...");
  res.end();
}
```

Ok, now we know when the request was from a GitHub webhook and when it was from someone requesting the route in say a browser. Earlier I mentioned that the request and response objects of the HTTP module are both event emitters. Once we receive a `POST` request we get access to the data that was sent by listening for the `data` and `end` events that will be fired by the request object.

```js
/**
 * Listens for the `data` events on the request as chunks of data arrives. Once
 * all data have been received, the accumulated data is returned.
 * @param {object} req - The request object
 * @returns A Promise that will resolve once all data has been received
 */
function getData(req) {
  let body = "";
  return new Promise((resolve, reject) => {
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      resolve(body);
    });
  });
}
```

A couple of things to note here. We immediately return a `Promise` from the `getData` function. Inside the `Promise` we register two event listeners. The first listens for `data` events and the second listens for the `end` event. Every time the `data` event is fired, we concatenate the new data onto the data we have already received. Once all the data has been transferred, the request object will fire the `end` event. At this point we resolve the `Promise` and pass the accumulated data to the `resolve` function. This is then also our first interaction when the `events` module.

Inside out `POST` conditional we make use of our new function as follows:

```js
getData(req)
  .then((data) => {
    if (data) {
      const jsonData = JSON.parse(data);
    }
  })
  .catch((error) => {
    console.error(`Error while get POST data: ${error.message}`);
    res.end();
  });
```

When the `Promise` resolves, we will move into the `then` portion of the code. As you can see we expect the function to be called with some data. Before we try to work with the data though, we make sure that we did indeed receive data. If all is well, we can start working with the data.

You can create a GitHub webhook for many actions that can happen on a repository, an organization or a GitHub app. In my case, I registered a webhook on the [EventEmitter and GitHub Webhooks repo](https://github.com/schalkneethling/event-emitter-and-github-webhooks) for issues, pull requests, and push events.

Here is what we want to do:

1. When a `POST` request is received, see whether it is for and issue or a pull request event
2. If it was an issue event, see if it was in response to a new issue being created
3. If it was, emit a custom event. If not, ignore for now.
4. If it was a pull request event, see if it was in response to a new pull request being opened
5. If it was, emit a custom event. If not, ignore for now.

## Creating our EventEmitter

Before we can do any of that though, we need to create our `EventEmitter` class. I created a new file and called it `webhook-events.js`. I then created my custom `EventEmitter` class as follows:

```js
import EventEmitter from "events";

export class WebhookEvents extends EventEmitter {
  constructor(opts = {}) {
    super(opts);
    this.name = opts.name;
  }
}
```

One thing to note here is that I provide the option off providing a name for the `WebhookEvents` class when initialized. The only option that is exposed to use by the `EventEmitter` is the `captureRejections` option. This is a boolean that is `false` by default and determines whether or not the `EventEmitter` [will capture rejected promises](https://nodejs.org/api/events.html#capture-rejections-of-promises). Because we have an custom `class`, we can add custom properties to it.

Now that we have our class, we can start to use it inside our server code. We start by importing our class as follows:

```js
import { WebhookEvents } from "./webhook-events.js";
```

With our class imported, we need to initialize it.

```js
//before our call to `createServer`
const webhookEvents = new WebhookEvents({ name: "GitHub Webhook Events" });
console.info(`Listening for ${webhookEvents.name}...`);
```

> NOTE: If you run your code now using `node index.js` you will see the message, "Listening for GitHub Webhook Events..." in the console. Nice!

Now we are all set to start emitting and listening for custom events. After we parsed our JSON to an object, we create our first use-case.

```js
if (jsonData.issue && jsonData.action === "opened") {
  const props = {
    issueName: jsonData.issue.title,
    username: jsonData.issue.user.login,
    openIssueCount: jsonData.repository.open_issues_count,
  };
  webhookEvents.emit("issue-opened", props);
}
```

Having confirmed that someone opened an issue, we create a new `props` object with some information about the new issue, and fire our first custom event. The [`emit` function](https://nodejs.org/api/events.html#emitteremiteventname-args) takes an event name as the first argument, and then a comma separate list of arguments to pass to the event handler. In our case we pass a single argument but, you could have also done something like the following:

```js
webhookEvents.emit("issue-opened", issueName, username, openIssueCount);
```

Next we need a listener to listen for our event. In the `webhook-events.js` file we create a function that our listener will call for the `issue-opened` event as follows:

```js
export function ouputNewIssueInfo(props) {
  console.info(`New issue opened: ${props.issueName}`);
  console.info(`Issue opened by ${props.username}.`);
  console.info(`Total open issues: ${props.openIssueCount}`);
}
```

Back in `index.js` we import our function:

```js
import { ouputNewIssueInfo, WebhookEvents } from "./webhook-events.js";
```

Next, we register our listener just below the lines where we initialized our `WebhookEvents` class.

```js
webhookEvents.on("issue-opened", (props) => {
  ouputNewIssueInfo(props);
});
```

This completed the circle. When we receive a `POST` request at `/payload` which is for a new issue having been created, we will fire the `issue-opened` event, our listener will catch the event, call our function passing our `props` object, and then we will output the information to the console. For example:

```bash
New issue opened: Refactor webhook functions
Issue opened by: schalkneethling
Total open issues: 3
```

I will leave it up to you to add an additional handler for another event that happens on your repository. I would love to see what you come up with.

## Other methods on `EventEmitter`

The `emit` and `on` functions are not the only functions available on `EventEmitter` though. Let’s continue and look at the other available functions. Before we do look at the other functions it is important to know that a listener must be registered after the event is emitted. The following will not work:

```js
emitter.emit("issue-opened", props);
emitter.on("issue-opened", props);
```

It is also important to note that the order in which listeners are registered is important.

```js
emitter.on("issue-opened", "I am called first", props);
emitter.addListener("issue-opened", "I am called second", props);

emitter.emit("issue-opened", props);
```

### `addListener`

In the example above I sneaked in one of the other functions that is available. The `addListener` event might sound a little more familiar to people used to working with the DOM where you add an event listener using `addEventListener`. There is no difference between `on` and `addListener`. The `addListener` function is simply an alias of `on` so they can be used interchangeably. It is best to choose one of these and be consistent in your codebase.

### `prependListener`

As mentioned, listeners are called in the order they are registered. If, however, you are ever in a situation where you have to ensure that a specific listener will be called first, you can use the `prependListener` function:

```js
emitter.on("issue-opened", "I am registered first, but called second", props);
emitter.prependListener(
  "issue-opened",
  "I am registered second, but called first",
  props
);

emitter.emit("issue-opened", props);
```

### `once`

When a listener is registered using either `on`, `prependListener`, or `addListener`, it will be called every time the event is emitted.

```js
emitter.on(
  "issue-opened",
  "I am called every time the event is emitted",
  props
);

emitter.emit("issue-opened", props);
emitter.emit("issue-opened", props);
emitter.emit("issue-opened", props);
```

The above will cause the listener to be called three times. If you want to ensure that the listener is called only once, you can use the `once` function:

```js
emitter.once(
  "issue-opened",
  "I am called only the first time the event is emitted",
  props
);

emitter.emit("issue-opened", props);
emitter.emit("issue-opened", props);
emitter.emit("issue-opened", props);
```

Now, even though the event is emitted three times, the function will only be called once.

### `prependOnceListener`

As with `prependListener` you can also use the `prependOnceListener` function to append a new listener that will be called once, to the beginning of the list of listeners.

```js
emitter.on(
  "issue-opened",
  "I am called every time the event is emitted",
  props
);

emitter.prependOnceListener(
  "issue-opened",
  "I am called first and only the first time the event is emitted",
  props
);

emitter.emit("issue-opened", props);
emitter.emit("issue-opened", props);
emitter.emit("issue-opened", props);
```

### `removeListener`

In the same way you can add listeners, you can also remove them for a specific event. Let’s look at an example:

> NOTE: To test out the code below, create a new file called `remove-listener.js` and paste the code below into the file. You can then run the code with, `node remove-listener.js`.

```js
import EventEmitter from "events";

const emitter = new EventEmitter();
let interval;

function customHandler() {
  console.info("Custom handler called");
}

emitter.on("custom", customHandler);

emitter.on("removeListener", (event, listener) => {
  console.info(`cleanup running for event name "${event}"`);
  console.info("removed listening function:");
  console.info(listener.toString());

  if (event === "custom") {
    clearInterval(interval);
  }
});

interval = setInterval(() => {
  emitter.emit("custom");
}, 300);

setTimeout(() => {
  emitter.removeListener("custom", customHandler);
}, 1500);
```

> NOTE: To focus on the details regarding the `removeListener` function, I am here not sub-classing `EventEmitter` but instead using the `EventEmitter` class directly.

The first couple of lines should be pretty familiar by now. We import `EventEmitter` and create a new instance of it. We create a variable that will be used to store a reference to a `setInterval` call a little later. We create our custom handler function and register two listeners on the `EventEmitter`.

The first listener will be called once the `custom` event is emitted. The second listener is new, so let’s take a closer look.

```js
emitter.on("removeListener", (event, listener) => {
  console.info(`cleanup running for event name "${event}"`);
  console.info("removed listening function:");
  console.info(listener.toString());

  if (event === "custom") {
    clearInterval(interval);
  }
});
```

When we remove a listener a `removeListener` event is automatically emitted. The function handling the event is passed two arguments, the event name and the listener function. This is a useful place to do some cleanup when our listener is removed. Because we get the name of the listener being removed, we can conditionally call different cleanup operations depending on which listener is being removed.

In our case above, we log out some information about the listener being removed and then check whether the listener being removed is the `custom` event. If it is, we clear the interval that will be set a little later.

```js
interval = setInterval(() => {
  emitter.emit("custom");
}, 300);

setTimeout(() => {
  emitter.removeListener("custom", customHandler);
}, 1500);
```

The final piece of the example sets up our interval to emit the `custom` event every 300 milliseconds. We also set a timeout to remove the `custom` listener after 1500 milliseconds. As you can see, the `removeListener` function takes two arguments, the event name and the listener function.

When you run the example code, you should see the following output:

```bash
Custom handler called
Custom handler called
Custom handler called
Custom handler called
cleanup running for event name "custom"
removed listening function:
function customHandler() {
  console.info("Custom handler called");
}
```

As you can see our listener is run 4 times and then at 1500 milliseconds, we remove the listener, which will trigger the `removeListener` event. In the handler we then clean up by clearing the interval we set earlier. If we do not do this, the interval will continue emitting events but, there is no event listener to handle it so, the program will not exit. You can see this for yourself by commenting out the following code and running the program again:

```js
if (event === "custom") {
  clearInterval(interval);
}
```

> NOTE: As with `on` and `addListener`, there also exists an alias for `removeListener` called `off`. So, you could write `emitter.removeListener("custom", customHandler);` as `emitter.off("custom", customHandler);`

### `removeAllListeners`

There are three reasons you might want to use the `removeAllListeners` function as opposed to the `removeListener` function from before. You might not have a reference to the listener function and so, you simple want to remove all listeners for a specific event. You can do this as follows:

```js
emitter.removeAllListeners("custom");
```

The second reason is that, when using `on` or `addListener` there are no checks in place to ensure that the listener you are trying to add does not already exist. Each time you call these, it will simply add another listener to the end of the list. Here again the example code above will enure that all listeners for the event name specified is removed.

The third reason is for when you simply want to ensure you remove _all_ listeners on the current instance of the `EventEmitter` you are working with. This is done as follows:

```js
emitter.removeAllListeners();
```

This should be used sparingly and is generally bad practice unless you were the one that created the `EventEmitter` instance. So, be careful with this one.

## Error events

When an error occurs inside an `EventEmitter` one typically emits and `error` event:

```js
const emitter = new EventEmitter();

try {
  // some code that triggers and error
} catch (error) {
  emitter.emit("error", new Error(error));
}
```

If your emitter does not have at least one listener for the `error` event, the error will be thrown and the Node process will crash and exit. Maybe that is what you want but, it is unlikely. It is therefore best practice to always have at least once error listener.

```js
const emitter = new EventEmitter();

emitter.on("error", (error) => {
  console.error(error.message);
});

try {
  // some code that triggers and error
} catch (error) {
  emitter.emit("error", new Error(error));
}
```

If you _do_ want the Node process to exit on error but, you still want the opportunity to send the error to a service such as [Rollbar](https://rollbar.com/), you can add a listener using the `events.errorMonitor` symbol. This allows you to do just that:

```js
import { EventEmitter, errorMonitor } from "events";
import { monitor } from "service";

const emitter = new EventEmitter();

emitter.on(errorMonitor, (error) => {
  monitor.log(error);
});

try {
  // some code that triggers and error
} catch (error) {
  emitter.emit("error", new Error(error));
  // the Node process will still exit here
}
```

There is even more to the `EventEmitter` class but, this is where I will end this post for now. If you want to learn more, you can find all the details in the [Nodejs documentation](https://nodejs.org/api/events.html#class-eventemitter).
