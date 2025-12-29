---
title: Cancelling asynchronous operations with AbortController
pubDate: 2022-07-01
description: How to cancel asynchronous operations with the AbortController API.
author: "Schalk Neethling"
tags: ["javascript"]
---

I have worked on a few projects where client side fetching of data was required. One of the challenges we ran into a number of times, is what to do about a request if the user navigates away from the current view. Turns out there is actually a well supported Web API to do just that. This API is available in the browser and in Node.js. Let’s have a look.

Let’s say you have a select drop down with a list of cities. When a user selects a city, you make a call to the WeatherDB API to get the current weather for that city. Normally the time between the request and the response will be pretty quick and you will most likely not be concerned about aborting the request. For the purposes of our discussion here though, let’s create two possible scenarios.

1. The response from the server hangs for a long time
2. The time between the request and the response is long enough, that the user could choose a different city before the response is received.

## A long server response time

Looking at the first scenario, we can implement a timeout, abort the request, and provide the user with some feedback.

```js
// The URL below explicitly waits for 3 seconds before sending a response
const url = "https://simple-node-server.vercel.app/slow-response";
const abortController = new AbortController();
const { signal } = abortController;
const response = fetch(url, { signal });

const outputContainer = document.getElementById("output");

const timeout = setTimeout(() => {
  abortController.abort();
  console.warn("request cancelled after 2 seconds");
}, 2000);

response
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  })
  .then((json) => {
    outputContainer.textContent = JSON.stringify(json);
    clearTimeout(timeout);
  })
  .catch((err) => {
    if (err.name === "AbortError") {
      outputContainer.textContent = `${err.name}: ${err.message}`;
      console.error(`${err.name}: ${err.message}`);
    } else {
      // if it was not an AbortError, throw the error so it propagates
      throw err;
    }
  });
```

That is a _lot_ of code. Let’s break it down.

For the purposes of this post I created a [super simple Nodejs server](https://github.com/schalkneethling/simple-node-server) that responds to two routes. The URL we are using here, as the code comment mentions, has an explicit 3 second delay. Next we create an [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) which is the API we are going to use to communicate with our asynchronous function a little later. We destructure the [`signal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) property from the `AbortController` and assign it to a variable. Next we make a call to the [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) function with the URL and the `signal` as the second argument. Doing this, is what will allow us to communicate with the `fetch` request and abort it.

The next line gets a reference to a DOM element with the `id` of `output`. We use this to display the response from the server or a message if we aborted the request.

```html
<p id="output"></p>
```

We can now set up our timeout that will abort the request if it takes longer than 2 seconds to respond.

```js
const timeout = setTimeout(() => {
  abortController.abort();
  console.warn("request cancelled after 2 seconds");
}, 2000);
```

Nothing new here in terms of the `setTimeout` function. We store a reference to it in a variable called `timeout` and schedule the function to be called after 2000 milliseconds(2 seconds) have passed. When the function is called, we call the [`abort` function](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort) on the `AbortController` to abort the `fetch` request. We here call the function without specifying a reason and so, the default reason of `AbortError` will be used. You could also do this for example:

```js
abortController.abort("RequestTimeout");
```

We next start our Promise chain to handle the response that came back from the `fetch` request.

```js
response.then((response) => {
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }
  return response.json();
});
```

We first ensure that our request was successful and throw an `Error` if it wasn’t. We then call the `json` function on the `response` to get the response body as a JSON object.

> NOTE: I am not going to dig into the details of `fetch` here so, you can read more about the [`Response` object](https://developer.mozilla.org/en-US/docs/Web/API/Response) and its [methods](https://developer.mozilla.org/en-US/docs/Web/API/Response#methods) on MDN Web Docs.

```js
response
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  })
  .then((json) => {
    outputContainer.textContent = JSON.stringify(json);
    clearTimeout(timeout);
  });
```

If all is good, we move to the next step of handling our response. Here we `stringify` and output the JSON to the output container. On the next line we call the `clearTimeout` function and pass in the `timeout` variable we created earlier. This will then prevent the callback of our `setTimeout` function from being called as the response was received in a timely manner.

```js
response
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  })
  .then((json) => {
    outputContainer.textContent = JSON.stringify(json);
    clearTimeout(timeout);
  })
  .catch((err) => {
    if (err.name === "AbortError") {
      outputContainer.textContent = `${err.name}: ${err.message}`;
      console.error(`${err.name}: ${err.message}`);
    } else {
      // if it was not an AbortError, throw the error so it propagates
      throw err;
    }
  });
```

Things do not always go as planned though and so, it is best practice to always end an asynchronous operation with a `catch` block to handle errors. In the above code we first check if the error was of type `AbortError`. If it was, we output the error message to the output container and log it to the console. If it wasn’t, we throw the error so it propagates.

And that is it. The way the code is set up now, it will call the `slow-response` route and as a result, the `fetch` request will be aborted after 2 seconds. If you want to also test out the success flow, change the `url` to the following:

```js
const url = "https://simple-node-server.vercel.app/";
```

As mentioned earlier, this API is available both in the browser and in Node.js. In Node.js, the following core APIs support the `AbortController` API, `fs`, `net`, `http`, `events`, `child_process`, `readline` and `stream`.

> NOTE: You can also play around with a [live example in this Codepen](https://codepen.io/schalkneethling/pen/yLPReWX??editors=1111).

## Cancelling a previous request `onchange`

But wait, I mentioned a second scenario earlier, so let’s take a look at how it will work. First, the code:

### HTML

```html
<form id="weather-data" name="weather" action="" method="get">
  <label for="city">Select a city</label>
  <select id="city" name="city">
    <option value="london">London</option>
    <option value="birmingham">Birmingham</option>
    <option value="cambridge">Cambridge</option>
    <option value="sheffield">Sheffield</option>
  </select>
  <button type="submit">Get weather</button>
</form>
```

The HTML is a straight forward HTML `form` element with a `select` dropdown and a `button` element to submit the form.

### JavaScript

```js
const citySelector = document.getElementById("city");
const weatherForm = document.getElementById("weather-data");

let abortController;
let lastSelectedCity;

citySelector.addEventListener("change", (event) => {
  console.log(`Weather data request for ${lastSelectedCity} aborted.`);
  console.log("New selected city is: ", citySelector.value);
  abortController.abort();
});

weatherForm.addEventListener("submit", (event) => {
  event.preventDefault();

  abortController = new AbortController();
  const { signal } = abortController;

  const baseURL = "https://simple-node-server.vercel.app/weather";

  const formData = new FormData(weatherForm);
  const city = formData.get("city");
  lastSelectedCity = city;

  fetch(`${baseURL}/?city=${city}`, { signal })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      return response.json();
    })
    .then((json) => {
      console.log(JSON.stringify(json));
    })
    .catch((err) => {
      if (err.name === "AbortError") {
        console.info("Cancelled previous fetch request");
      } else {
        // if it was not an AbortError, throw the error so it propagates
        throw err;
      }
    });
});
```

The JavaScript is a bit more involved though so, let’s break it down.

```js
const citySelector = document.getElementById("city");
const weatherForm = document.getElementById("weather-data");

let abortController;
let lastSelectedCity;
```

We start by getting a reference to the `city` dropdown and the `weather-data` form. Next we setup two variables we will need a bit later. The one will store our `AbortController` and the other the last selected city.

```js
citySelector.addEventListener("change", (event) => {
  console.log(`Weather data request for ${lastSelectedCity} aborted.`);
  console.log("New selected city is: ", citySelector.value);
  abortController.abort();
});
```

We add an `onchange` event listener to the `city` dropdown. This will allow us to cancel the previous request if the user changes the selected city. We give ourselves a little context of what is happening by logging out the last selected city we are cancelling the request for, and then log the new city we are requesting data for.

```js
weatherForm.addEventListener("submit", (event) => {
  event.preventDefault();

  abortController = new AbortController();
  const { signal } = abortController;
```

Some of the above will look familiar to you. We register an event listener on the `weather-data` form and prevent the default behavior of the form being submitted when the button is clicked. We then create a new `AbortController` and store the reference in the variable we created earlier. Lastly we get a reference to the `signal` property as before.

```js
const baseURL = "https://simple-node-server.vercel.app/weather";

const formData = new FormData(weatherForm);
const city = formData.get("city");
lastSelectedCity = city;
```

We store the base URL we will call to get our weather data. This uses a [new route](https://github.com/schalkneethling/simple-node-server/blob/main/index.js#L21) I added to the [simple Nodejs server](https://github.com/schalkneethling/simple-node-server) I mentioned before. The endpoint will call the [WeatherDB API](https://weatherdbi.herokuapp.com) for the city we pass as a query parameter. The endpoint also takes a delay query parameter that we will use to simulate a slow response.

We next use the super useful [`FormData` API](https://developer.mozilla.org/en-US/docs/Web/API/FormData) to construct a set of key/value pairs representing the form fields. From this we use the `get` method on `FormData` to get the value of the `city` field. For reference, we store the selected city as the last selected city which we will use in our `change` event listener.

```js
fetch(`${baseURL}/?city=${city}`, { signal })
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return response.json();
  })
  .then((json) => {
    console.log(JSON.stringify(json));
  })
  .catch((err) => {
    if (err.name === "AbortError") {
      console.info("Cancelled previous fetch request");
    } else {
      // if it was not an AbortError, throw the error so it propagates
      throw err;
    }
  });
```

This should look very familiar as it is essentially the same thing we did in the earlier example. We make our request, and if all goes well, we log out the JSON response we get back from the server.

```json
{
  "region": "London, UK",
  "currentConditions": {
    "dayhour": "Saturday 6:00 PM",
    "temp": { "c": 7, "f": 44 },
    "precip": "16%",
    "humidity": "81%",
    "wind": { "km": 14, "mile": 9 },
    "iconURL": "https://ssl.gstatic.com/onebox/weather/64/cloudy.png",
    "comment": "Cloudy"
  }
}
```

The way we are currently calling the endpoint should return pretty quickly and so, we cannot test if our abort code works. To test this, update the following line as follows:

```js
fetch(`${baseURL}/?city=${city}&delay=5000`, { signal });
```

Go ahead and click on the "Get weather" button, then change the city and click the "Get weather" button again. You should see output similar to the following.

```bash
"Weather data request for london aborted."

"New selected city is: " "birmingham"

"Cancelled previous fetch request"

"{'region':'Birmingham, AL','currentConditions':{'dayhour':'Saturday 12:00 PM','temp':{'c':26,'f':78},'precip':'0%','humidity':'37%','wind':{'km':21,'mile':13},'iconURL':'https://ssl.gstatic.com/onebox/weather/64/fog.png','comment':'Haze'}}"
```

Neat! Instead of waiting for the previous request to complete, we simply cancelled it and made a request for the new selected city. Again, you can experiment with the code in this [example on Codepen](https://codepen.io/schalkneethling/pen/XWzoRYZ??editors=1011).

I hope you found this interesting and useful. Until next time, keep building an open web, accessible by all.
