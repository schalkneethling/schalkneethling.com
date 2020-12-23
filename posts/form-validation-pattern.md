---
title: Form Validation Patterns
description: A simple framework for form validation
template: _base.html
---

# Form Validation Patterns

Completing forms can be challenging, especially on mobile devices. We, therefore, want to be as clear as possible when
requesting data from our users and, if there is an error, present feedback to the user in the context of the error. A
number, perhaps even most, backend framework comes with a form of form validation that makes it easy to accomplish this. One does not always want to reach for a big framework simply to have this capability.

Personally, I have run into this a number of times over the last couple of months with a stack that is typically,

1. Expressjs on the back-end
2. HTML(Pug), CSS(Sass) and minimal flavorless JavaScript on the front-end

Uncertainty and frustration are two experiences we want to avoid for our users. Whenever we ask a user to provide us
with data the onus is on us to ensure that we provide consistent and clear feedback to the user in the context of the
problem. After some experimentation, I have come to a pattern that I feel works really well and thought I would share my
pattern and see what the wider community thinks, and what others have come up with to solve the same problem.

tl;dr - It’s all about naming conventions

When this aspect of the user experience is not addressed, it is generally not done out of malice or simply because
developers and designers do not care about the user experience. It is more often than not, because of time pressure and,
sometimes, it is done because: "We will come back and do it better later". We are all guilty of that last one.

As with accessibility and writing tests, if we can make this something that simply slots into our workflow, everybody
wins.

## The pieces of the puzzle

Let us look at what we want to achieve then.

[[screenshot of final form]]

The above screenshot then shows the form with:

1. The errors in the context of the field or fields they apply to
2. A clear and concise message

## The front end

This is where we start our journey and where solid naming conventions are going to make all the difference. For our
example we will use the following form:

```
<form id="contact-us" name="contact-us" action="/contact" method="post">
    <fieldset>
        <legend>Personal details</legend>

        <div class="field-container">
            <label for="title">Title:</label>
            <input type="text" id="title" name="title" required />
        </div>

        <div class="field-container-group">
            <label for="surname">Surname:</label>
            <input type="text" id="surname" name="surname" required />
        </div>

        <div class="field-container">
            <label for="name">Name:</label>
            <input type="text" id="name" name="name" required />
        </div>

        <div class="field-container">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" />
        </div>

        <div class="field-container">
            <label for="contact-number">Contact number:</label>
            <input type="tel" id="contact-number" name="contactNumber" />
        </div>

        <div class="field-container">
            <label for="address">Address:</label>
            <textarea id="address" name="address" cols="50" rows="5" required></textarea>
        </div>
    </fieldset>

    <input type="submit" class="form-submit">Submit
</form>
</form>
```

Next, we need to add the elements that will display our error messages. Seeing that we want to present this information
in context, we will add our container elements just below the relevant input.

```
<div class="field-container">
    <label for="title">Title:</label>
    <input type="text" id="title" name="title" required />
    <div id="title-error" class="user-feedback error hidden"></div>
</div>
```

The first field to address is the `title` field. We are using the `id` attribute of our element here to do double duty.
First of all, it provides an easy way to get to the element from JavaScript using `document.getElementById`, and
secondly, it gives us some basic information with regards to the field. We will also always append `-error` to all of
these for consistency. Lastly, we add some classes we can use to style our messages.

Let’s proceed to the remaining fields of the form.

```
<div class="field-container-group">
    <label for="surname">Surname:</label>
    <input type="text" id="surname" name="surname" required />
    <div id="surname-error" class="user-feedback error hidden"></div>
</div>

<div class="field-container">
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" required />
    <div id="name-error" class="user-feedback error hidden"></div>
</div>

<div class="field-container">
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" />
    <div id="email-error" class="user-feedback error hidden"></div>
</div>

<div class="field-container">
    <label for="contact-number">Contact number:</label>
    <input type="tel" id="contact-number" name="contactNumber" />
    <div id="contactNumber-error" class="user-feedback error hidden"></div>
</div>
```

I want to take a moment to highlight a difference with the `id` and `name` attributes of the last field here. Here we
have a name that is not a single word but two words separated by a hyphen. In JavaScript, the convention is to use
`camelCase` for variable names that are a combination of two or more words. We, therefore, do the same here and use
`contactNumber-error` as the value for our `id` and `contactNumber` as the value for the `name` attribute.

```
<div class="field-container">
    <label for="address">Address:</label>
    <textarea id="address" name="address" cols="50" rows="5" required></textarea>
    <div id="address-error" class="user-feedback error hidden"></div>
</div>
```

Now our form is set-up and ready. Our next step is to handle the `submit` event of our form.

## Submitting the Form

Go ahead and open the `main.js` file located at `/static/js/main.js`. We are going to start this off by wrapping all the
code we will need inside an [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE) and indicate that we opt into
JavaScript’s [strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode).

```
(function() {
"use strict";
})();
```

Next, we need to get out form DOM node and add an event listener so we can override the browser’s default behavior and
handle form submission ourselves.

```
...
"use strict";
const contactUsForm = document.getElementById("contact-us");

contactUsForm.addEventListener("submit", (event) => {
event.preventDefault();
});
...
```

If you try to submit the form at this point, absolutely nothing will happen other than the built-in browser validation
for the fields marked as required, as well as any fields where the content does not match the type of content we
specified. For example the email field.

Assuming the user has entered all of the data correctly and proceeds to submit the form, we need a way to capture all of
the data and then send it off to the server for processing.

### Getting the `FormData`

There is a variety of ways to get the data that has been entered into the form but, for the purposes of this post and
because it is honestly the cleanest and simplest way to accomplish this, I am going to use the [`FormData` JavaScript
interface](https://developer.mozilla.org/en-US/docs/Web/API/FormData#Browser_compatibility). Even though I have only
relatively recently discovered this interface, it has been available for a surprisingly long time with support as far
back as Internet Explorer 10.

This, combined with one more
interface[URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams), makes it very simple to
mimic what a plain form submit would do in terms of the format of the data sent to the server. This is great because it
means whether the form was submitted through JavaScript, or directly should JavaScript be disabled in the browser, our
server code will happily handle both scenarios.

Add the following code to the event listener:

```
...
event.preventDefauly();
let formData = new URLSearchParams(new FormData(contactUsForm)).toString();
```

That is it. We can see what our data will look like by logging out the value of `formData`. Add the following just after
the last line from above:

```
console.log(formData);
```

Startup the bundled server with `npm start` and open up `http://localhost:3000` in your browser. Also, open the
dev-tools(Cmd+Option+i/Ctrl+Alt+i) and switch to the `console` tab so you can see the output of our `log` statement. You
should see a pretty ugly but fully functional form. To ease the testing of forms and save you a lot of typing I would
recommend [installing the Form Filler extension](https://github.com/husainshabbir/form-filler) by Hussein Shabbir.

With all of this in place, go ahead and use the extension to fill in all of the form fields and click `Submit`. In your
dev-tools console you should see something like the following:

```
title=Quo+amet+quis+dolor&surname=Fitzpatrick&name=Jillian+Hopkins&email=zofeqigim%40mailinator.com&contact-number=%2B1+%28276%29+129-1368&address=Est+elit+veniam+of
```

Nice! Now let’s get this sent over to the server.

## Posting the data to the server

Now, we could use the `Fetch` API here but, support is not quite as far back as for the other APIs and interfaces we
have used so far, and it is still [marked as experimental on MDN Web
Docs](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API#Browser_compatibility) so, we are to stick with good
old Ajax for this one.

To help you along and save some typing, add the following two helper functions just above the `addEventListener` line:

```
/**
* Initialize and return a new XMLHTTPRequest
* @param {String} method - The HTTP method such as GET or POST
* @param {String} url - The URL to which the request will be made
* @returns And XMLHTTPRequest Object with a `responseType` of json
*/
function initAjaxRequest(method, url) {
let xmlHttpRequest = new XMLHttpRequest();
xmlHttpRequest.open(method, url);
xmlHttpRequest.resposeType = "json";
return xmlHttpRequest;
}

/**
* Wraps the `ajaxRequest` in a `Promise` and returns the `Promise`
* @param {Object} ajaxRequest - The XMLHttpRequest object
* @returns The `ajaxRequest` as a `Promise`
*/
function getAjaxResponse(ajaxRequest) {
return new Promise((resolve, reject) => {
ajaxRequest.onreadystatechange = () => {
if (ajaxRequest.readyState === 4) {
if (ajaxRequest.status === 200 && ajaxRequest.responseText !== "") {
resolve(ajaxRequest.responseText);
} else {
reject(
`Ajax error: ${ajaxRequest.status} : ${ajaxRequest.responseText}`
);
}
}
};
});
}
```

Replace our `console` statement with the following:

```
let ajaxRequest = initAjaxRequest("post", "/contactus");
```

Next we need to set the content type appropriately so that the server knows how to handle and parse the post:

```
ajaxRequest.setRequestHeader(
"Content-Type",
"application/x-www-form-urlencoded"
);
```

And now we are ready to send the data:

```
ajaxRequest.send(formData);
```

Now that the data has been sent, we need to get the response:

```
getAjaxResponse(ajaxRequest).then(response => {
console.log(data);
}
```

At this point we will get an error when we try to submit the form as nothing has been set-up on the server-side. You can
confirm this by filling in the form and clicking on submit. This will result in a 404 error such as:

```
uncaught exception: Ajax error: 404...
```

Time to handle our post data.

## Handling the post on the server

Open up the Routes file at `routes/router.js`. Currently we have only one route configured which is the one that serves
up the landing page with the form. We next need to add a route to handle the form post. If you look back at the
`initAjaxRequest` you will notice that the `url` portion was set to `/contactus` and the method set to `post`. Let’s add
a route to handle this:

```
router.post("/contactus", (req, res) => {
res.json({});
});
```

The above route will handle post requests sent to `/contactus` and respond with `JSON`, in this case an empty object.
Simple right? Save the file, stop the server and start it up again to pick up the route change. Reload the form, fill
the field and click submit. This time, you should not get an error but instead, see the following:

```
XHR POSThttp://localhost:3000/contactus
[HTTP/1.1 200 OK 17ms]

{} main.js:52:15
```

It Works! Let’s log out our form data and have a look at what we get. As `POST` data is added to the `body` of the
request, we can get it from our `request` object via `req.body`. Inside our new route, before the `res` add the
following:

```
console.log(req.body);
```

Stop and start the server and click submit on the form. In your terminal you should now see your form data:

```
{ title: 'Quo amet quis dolor',
surname: 'Fitzpatrick',
name: 'Jillian Hopkins',
email: 'zofeqigim@mailinator.com',
contactNumber: '+1 (276) 129-1368',
address: 'Est elit veniam of'
}
```

And it is already formatted as an object which means, you can get at the individual properties using dot notation, for
example:

```
console.log(req.body.title);
console.log(req.body.contactNumber);
```

Which would output something like:

```
Quo amet quis dolor
+1 (276) 129-1368
```

## Let’s do some validation.

At the root of the project create a new folder and call it `utils`. Inside this new folder create a new file called
`validate.js` and add the following to get us started:

```
const validate = {

};

module.exports = validate;
```

Here we create and export a `validate` object that we can then `require` when we want to do some validation. Next, we
add a function to handle the contact form as follows:

```
const validate = {
contactUs: formData => {
let invalidFields = [];
let valid = true;
return valid;
}
};
```

Before we go any further, let’s call this function in our form route and confirm that it works as expected. Open up
`router.js` again and add the following line after the line that requires express:

```
const validate = require("../utils/validate");
```

Instead of returning the empty object, let’s return the result of calling our validator.

```
res.json({ valid: validate.contactUs(req.body) });
```

Stop and start your server and resubmit the form. This time you should see the following in your console:

```
XHR POSThttp://localhost:3000/contactus
[HTTP/1.1 200 OK 16ms]

{"valid":true} main.js:52:15
```

Now that we know that all the pieces work together we can implement the actual validation.

We will start by simply ensuring that none of our fields are empty. Add the following to the `contactUs` function inside
`validate.js`:

```
Object.keys(formData).forEach(entry => {
if (formData[entry].trim() === "") {
invalidFields.push(entry);
valid = false;
}
});
```

We use `Object.keys` to turn our object’s properties, our form field names, into an `Array` and then loop over them
using `forEach`. For each of our form fields we get the input, strip of any white space, and then confirm that what the
user submitted is not an empty string.

If it is, we push the field name onto the `Array` of invalid fields, and mark the form is invalid by setting `valid` to
false. Once the loop is complete, we return our results in the following form:

```
return {
valid,
invalidFields
};
```

Now, back in our router, we need to change what we pass to `res.json` as follows:

```
res.json(validate.contactUs(req.body));
```

As we are returning an Object from our validator, we can simply return its return value. To test our validation we are
going to tell the browser to not validate on submit by adding the `novalidate` attribute to the form element as follows:

````
<form id="contact-us" name="contact-us" action="/contact" method="post" novalidate>
    ```

    Refresh the page, and fill in the form but, leave the `name` field empty. Click on submit, and you should see the
    following in the console:

    ```
    XHR POSThttp://localhost:3000/contactus
    [HTTP/1.1 200 OK 34ms]

    {"valid":false,"invalidFields":["name"]} main.js:52:15
    ```

    Neato! Let’s add some messaging that we can return to the front-end instead of just the name of the field. Inside
    the `utils` folder add a file called `validation-responses.js`. As with `validate` we will export an `Object` that
    we can then require inside `validate.js`:

    ```
    const validationResponses = {

    }

    module.exports = validationResponses;
    ```

    Let’s add a response message for an empty `name` field. Inside `validationResponses` add the following:

    ```
    contactUs: invalidFields => {
    const messages = {
    name: "Please enter your name"
    };
    }
    ```

    We add a method called `contactUs` that takes in the `Array` of `invalidFields`. We next create an object which will
    contain the validation messages for each field. We also need an object that will only contain messages for the
    fields that were invalid.

    We then loop over all of the `invalidFields`, and for each, we add the relevant property to the object along with
    its validation message. Lastly, we return our validation messages.

    ```
    let responseMesssages = {};

    invalidFields.forEach(field => {
    responseMesssages[field] = messages[field];
    });

    return responseMesssages;
    ```

    Let's head back to `validate.js` and use our new `validationResponses`. At the top of the file import our new
    responses:

    ```
    const validationReponses = require("./validation-responses");
    ```

    And we need to change our return a bit:

    ```
    return {
    valid,
    invalidFields: invalidFields.length
    ? validationReponses.contactUs(invalidFields)
    : invalidFields
    };
    ```

    Alrighty. With those changes made, reload the page and submit the form again. You should now see the following
    output in the console:

    ```
    XHR POSThttp://localhost:3000/contactus
    [HTTP/1.1 200 OK 19ms]

    {"valid":false,"invalidFields":{"name":"Please enter your name"}} main.js:52:15
    ```

    Things are coming together nicely, let’s display this message on our form.

    ## Show validation messages

    Inside `static/js/main.js` add the following inside `getAjaResponse`:

    ```
    let parsedJSON = JSON.parse(data);
    if (!parsedJSON.valid) {
    setFormErrors();
    }
    ```

    The `setFormErrors` function will pass along the form element as well as the object of validation messages so, we
    need to also add the following:

    ```
    setFormErrors(contactUsForm, parsedJSON.invalidFields);
    ```

    All that is left is to write the `setFormErrors` function. And here it is:

    ```
    /**
    * Add and show relevant errors on the specified form
    * @param {Object} form - The HTMLForm object
    * @param {Object} validationErrors - Form validation errors as an Object
    */
    function setFormErrors(form, validationErrors) {
    let objectKeys = Object.keys(validationErrors);
    objectKeys.forEach(function(key) {
    let fieldErrorContainer = form.querySelector(`#${key}-error`);
    fieldErrorContainer.innerText = validationErrors[key];
    fieldErrorContainer.classList.remove("hidden");
    });
    }
    ```

    Let us take a step through the function. As mentioned before, it takes in the `HTMLFormElement` as well as the
    `validationErrors` object. The first thing we do is create an `Array` from the keys of the object and then loop over
    this `Array`. Here the naming conventions really shine ;)

    Our `validationErrors` object looks will look like this:

    ```
    {
    name: "Please enter your name"
    }
    ```

    For each key(aka field), we get the relevant field error container using the `key` and appending `-error`. In this
    case, that means we are looking for an element with the `id` attribute of `name-error` which will find the correct
    container. We then set the `innerText` of this container to the value of property `name` in the object which is
    "Please enter your name", and lastly we remove the `hidden` class.

    Reloading the form and clicking submit, results in the error message being displayed in the context of the field it
    refers to. For good measure, let’s add another field, and this time let’s use the contact number field.

    ## Validating an additional field

    We are already checking all of the fields to ensure they are not empty so, we need not add anything additional here
    so, out first stop is `validation-responses.js`. Here, we add another entry to the message object for the contact
    number field:

    ```
    const messages = {
    name: "Please enter your name",
    contactNumber: "Please provide a telephone number where we may reach you"
    };
    ```

    Refresh the page in your browser, complete the form leaving both the name and contact number fields empty and click
    the `Submit` button. You should now see both error messages displayed below the relevant field. If you test this
    further by completing the `name` field and submitting or, completing the contact number and submitting you will
    discover a bug in our implementation.

    The previous error messages are still shown. Oh, noes! Not to worry, we just need one more function to reset
    everything every time the user submits the form in order to prevent this problem. Back inside `static/js/main.js`
    add the following function:

    ```
    /**
    * Hides all form error messages
    */
    function hideFormErrors() {
    let validationMessages = [
    ...document.querySelectorAll(".user-feedback.error")
    ];
    validationMessages.forEach(function(msg) {
    msg.classList.add("hidden");
    });
    }
    ```

    The first thing we need to do is get all of the error message containers. Because `querySelectorAll` returns a
    `NodeList` which is not "really" an `Array`, we cannot simply take what it returns and call `forEach` on it.
    Thankfully there is a number of ways to convert a `NodeList` to an `Array`. In the code above I have used the
    [spread operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax). Based
    on some of the other modern JavaScript features we use here, you could do the same, or even use
    [`Array.from`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from). Which
    means you could rewrite the above as follows:

    ```
    /**
    * Hides all form error messages
    */
    function hideFormErrors() {
    let validationMessages = Array.from(
    document.querySelectorAll(".user-feedback.error")
    );
    validationMessages.forEach(function(msg) {
    msg.classList.add("hidden");
    });
    }
    ```

    Or you could go old school and do:

    ```
    let validationMessages = [].slice.call(
    document.querySelectorAll(".user-feedback.error")
    );
    ```

    Which ever method you use to convert the `NodeList` to an `Array` the end result will be the same. We loop over the
    entries in the array, and for each entry, we add the class `hidden`. All that remains is to call our function.
    Change the `setFormErrors` errors function as follows:

    ```
    function setFormErrors(form, validationErrors) {
    let objectKeys = Object.keys(validationErrors);

    hideFormErrors();

    objectKeys.forEach(function(key) {
    ...
    ```

    With all of that in place, go ahead and reload the page and test out the form. Now you will see that, if both fields
    are empty, the two error messages show up but, should you fix one or both and click submit, only the relevant
    message is displayed.
````
