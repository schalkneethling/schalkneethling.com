---
title: Why are my table rows rendered outside the table? DOM template parsing caveats in Vuejs
pubDate: 2022-07-01
description: Usng the special Vuejs is attribute to fix common DOM parsing caveats.
author: "Schalk Neethling"
tags: ["byte-sized"]
---

The problem described here might not be something you run into often, as it mainly applies to situations where you write your HTML template directly in your HTML document. If you use a [string template or a single file component](https://vuejs.org/guide/essentials/component-basics.html#dom-template-parsing-caveats), you will not encounter this problem.

When learning or wanting to prototype an idea when using Vuejs quickly, you may opt to place all of your code in a single `.html` document. Something like this:

```html
<div id="app">
  <h1>WaterBear</h1>
  <table>
    <caption>
      Contributors
    </caption>
    <thead>
      <tr>
        <th>Username</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>
</div>

<script src="https://unpkg.com/vue@3"></script>
<script src="https://unpkg.com/axios/dist/axios.min.js"></script>

<script>
  Vue.createApp({
    data() {
      return {
        usernames: ["schalkneethling"],
      };
    },
  })
    .component("github-user-row", {
      template: "#github-user-row-template",
      props: ["username"],
      data() {
        return {
          user: {},
        };
      },
      async created() {
        const userAPI = "https://api.github.com/users";
        try {
          const response = await axios.get(`${userAPI}/${this.username}`);
          this.user = response.data;
        } catch (error) {
          console.log(error);
        }
      },
    })
    .mount("#app");
</script>
```

## Filling in the template

You will notice that the `tbody` is currently empty. For our rows, we might want to use an `x-template`, for example:

```html
<script id="github-user-row-template" type="text/x-template">
  <tr>
      <td><img :src="user.avatar_url" height="100" width="100" />
        <a :href="user.html_url">{{ user.name }}</a>
        </td>
  </tr>
</script>
```

You would then use the template inside the `table`:

```javascript
<github-user-row
  v-for="username in usernames"
  :username="username"
></github-user-row>
```

The above will loop over the `usernames` array and output a row for each.

## The problem

If you open this page in a browser, you will find that the rows are rendered outside the `table` element. Why is this? You have just experienced a DOM parsing caveat when using Vue this way.

What is happening is that the browser sees the following when it parses the document.

```html
<table>
  <caption>
    Contributors
  </caption>
  <thead>
    <tr>
      <th>Username</th>
    </tr>
  </thead>
  <tbody>
    <github-user-row
      v-for="username in usernames"
      :username="username"
    ></github-user-row>
  </tbody>
</table>
```

Later in [Vuejs’s lifecycle](https://vuejs.org/api/options-lifecycle.html#options-lifecycle), it will replace the component with our HTML but right now, the browser does not recognize the component, marks it as invalid, and hoists it outside of the table, producing the following HTML:

```html
<github-user-row
  v-for="username in usernames"
  :username="username"
></github-user-row>
<table>
  <caption>
    Contributors
  </caption>
  <thead>
    <tr>
      <th>Username</th>
    </tr>
  </thead>
  <tbody></tbody>
</table>
```

When Vue reaches the stage in its lifecycle where it will replace the component with the HTML, you end up with the following:

```html
<tr>
  <td>
    <img :src="user.avatar_url" height="100" width="100" />
    <a :href="user.html_url">{{ user.name }}</a>
  </td>
</tr>
<table>
  <caption>
    Contributors
  </caption>
  <thead>
    <tr>
      <th>Username</th>
    </tr>
  </thead>
  <tbody></tbody>
</table>
```

## The solution

The way to address this problem is to use the special [`is` attribute](https://vuejs.org/api/built-in-special-attributes.html#is) inside the `table` element as follows:

```html
<tbody>
  <tr
    is="vue:github-user-row"
    v-for="username in usernames"
    :username="username"
  ></tr>
</tbody>
```

Note the `vue:` used in front of the template name. If you open the page in a browser, your table will render as expected.
