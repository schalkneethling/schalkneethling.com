---
title: Deploy an Expressjs app to Vercel
description: A quick guide on deploying a Expressjs app to Vercel
draft: true
---

Want to deploy an Expressjs app? I highly recommend using [Vercel](https://vercel.com/). From their landing page:

> Vercel combines the best developer experience with an obsessive focus on end-user performance.

The app I will be deploying uses [Expressjs](http://expressjs.com/) and connects to a MongoDB database on [MongoDB Atlas](https://www.mongodb.com/atlas). To follow along there is no need for you to have a database or an account on MonDB Atlas. This post focuses on the deployment process on Vercel and will only lightly touch on the database aspect.

## Create and account

To get started create an account on Vercel if you do not already have one. You have a couple of options here so, go ahead and choose the one that works the best for you.

## Get the CLI

There are a couple of ways to [deploy to Vercel](https://vercel.com/docs/concepts/deployments/overview) but I am going to focus on using the [Vercel CLI](https://vercel.com/cli). When installing the CLI you have the option of installing it globally or locally to the current project. Here again, choose the option that you are most comfortable with. As I have an existing project, I will be installing it locally to the current project. This is so that I know whomever else works on the project will use the same version of the CLI as myself when depoying.

> NOTE: If you are starting a new project, you can bootstrap the project by installing the Vercel CLI globally and then use `vercel init` to create a new project. Read more in [the official docs](https://vercel.com/docs/cli#commands/init).

In the project root run:

```bash
npm i --save-dev vercel
```

Once installed, add the following to the `scripts` section of your `package.json`:

```json
"vercel:login": "vercel login"
```

You can now run the following command and follow the prompts to login to your Vercel account:

```bash
npm run vercel:login
```

Once the authentication process completes, you are ready to deploy.

## Deploying

I set up the following script target in `package.json`:

```json
"vercel:deploy": "vercel .",
```

I can now run:

```bash
npm run vercel:deploy
```

The first time you run the command, the CLI will ask you a couple of questions.

1. Firstly it should ask you whether you want to set up and deploy the current working directory. Go ahead and type `Y` and press enter.
2. Next it will ask you which [scope to use](https://vercel.com/docs/cli#introduction/global-options/scope). Unless you want to execute the command as a different user or account than the one your logged in with earlier, you can simply accept the default.
3. The next question will ask whether you want to link an existing Vercel project. If you [created a project](https://vercel.com/docs/concepts/projects/overview) using the web interface, you can link it here. If you have not created a project, answer "No" here and the CLI will create a project for you.
4. Enter a name for the project or accept the default.
5. Next, you will be asked in which directory your code is located. If you are running this from the root of the project, simply accept the default that will be suggested.

Vercel will now create a new project for you and try to detect which framework, if any, you are using. If it could not detect a framework or you are not using a framework it will prompt with the following:

```bash
- Build Command: `npm run vercel-build` or `npm run build`
- Output Directory: `public` if it exists, or `.`
- Development Command: None
```

You will now also be asked whether you want to accept these setting or override them.

> NOTE: You can edit these options later so, if you are unsure, accept the defaults.
