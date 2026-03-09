---
title: "Stop Storing Secrets on Disk — Replace Your .env With Varlock and 1Password"
pubDate: 2026-03-09
description: "How I replaced my local .env file with Varlock and 1Password, gaining type safety, validation, secret scanning, and a single source of truth for environment variables."
author: "Schalk Neethling"
tags: ["security"]
---

If you have been building web applications for any length of time, you are familiar with the `.env` file. It is the de facto standard for storing environment variables and secrets during local development. You copy `.env.example`, fill in your values, and hope nobody accidentally commits the real thing. It works, but it has some rough edges: no validation, no type safety, secrets sitting in plaintext on disk, and a constant risk of leaking sensitive data through AI agents that can read your local files.

I recently discovered [Varlock](https://varlock.dev) and spent some time migrating my project, MakerBench, to use it alongside 1Password. The result is a setup where no secrets exist in the codebase at all, everything is validated against a schema, and the entire team can share the same source of truth.

## Getting started

Varlock uses a schema file (`.env.schema`) instead of a traditional `.env.example`. To generate one from an existing `.env.example`, run:

```bash
pnpm dlx varlock init
```

This produces a `.env.schema` file pre-populated with your existing variables and some helpful annotations based on the [env-spec](https://varlock.dev/env-spec) format. The generated file is a starting point, not a finished product. You will want to review it and add the appropriate annotations.

Here is what mine looked like after editing:

```bash
# This env file uses @env-spec - see https://varlock.dev/env-spec for more info
#
# @defaultRequired=infer @defaultSensitive=false
# @generateTypes(lang=ts, path=env.d.ts)
# ----------

# Turso Database
# @type=url(startsWith=libsql://) @required
TURSO_DATABASE_URL=
# @sensitive @required
TURSO_AUTH_TOKEN=

# Cloudinary (image storage)
# @required
CLOUDINARY_CLOUD_NAME=
# @sensitive @required
CLOUDINARY_API_KEY=
# @sensitive @required
CLOUDINARY_API_SECRET=

# Browserless (screenshot service)
# @sensitive @required
BROWSERLESS_API_KEY=
```

The annotations are straightforward. `@required` marks variables that must have a value. `@sensitive` tells Varlock that a variable contains a secret, which enables redaction in terminal output and powers secret scanning later on. `@type=url(startsWith=libsql://)` adds validation beyond just "is this a string" — it ensures the value is a URL that begins with the expected protocol.

With the schema in place, I deleted my `.env.example`. The schema now serves as both documentation and validation in one file.

## Pulling secrets from 1Password

The real power of this setup comes from combining Varlock with the [1Password plugin](https://varlock.dev/plugins/1password/). Instead of storing secret values in a local `.env` file, you reference them directly from a 1Password vault.

I created a dedicated vault in 1Password for development secrets and added entries for each service: `makerbench-db`, `makerbench-cloudinary`, and `makerbench-browserless`. Each entry contains the relevant fields such as API keys, tokens, and URLs.

To enable the plugin, add the following to your `.env.schema`:

```bash
# @plugin(@varlock/1password-plugin)
# @initOp(allowAppAuth=true, account=YOUR_ACCOUNT_ID)
```

The `allowAppAuth=true` option means authentication happens through the 1Password desktop app via the [1Password CLI](https://developer.1password.com/docs/cli/secret-references/), so there is no need to manage separate CLI credentials.

With the plugin loaded, each variable references a 1Password item using the `op()` function. The pattern follows `vault/item-name/field-name`:

```bash
# @type=url(startsWith=libsql://) @required
TURSO_DATABASE_URL=op(op://dev/makerbench-db/db-url)
# @sensitive @required
TURSO_AUTH_TOKEN=op(op://dev/makerbench-db/auth-token)

# Cloudinary (image storage)
# @required
CLOUDINARY_CLOUD_NAME=op(op://dev/makerbench-cloudinary/cloud-name)
# @sensitive @required
CLOUDINARY_API_KEY=op(op://dev/makerbench-cloudinary/api-key)
# @sensitive @required
CLOUDINARY_API_SECRET=op(op://dev/makerbench-cloudinary/api-secret)

# Browserless (screenshot service)
# @sensitive @required
BROWSERLESS_API_KEY=op(op://dev/makerbench-browserless/api-key)
```

With this in place, I deleted my local `.env` file entirely. No secrets exist anywhere in the codebase.

## Verifying the setup

To confirm everything works, run:

```bash
pnpm exec varlock load
```

This authenticates against 1Password, pulls the values, and validates them against your schema definitions. Any sensitive values are masked in the terminal output.

## Team workflows

If the 1Password vault is shared across a team, every team member with vault access gets the same secrets without any manual copying or syncing. In a team context, you should omit the `account` parameter from `@initOp` so that [authentication is not tied to a specific user](https://varlock.dev/plugins/1password/#initop).

## Why this matters

Beyond the convenience of not managing `.env` files, there are some meaningful wins here.

Because Varlock knows which variables are sensitive through the `@sensitive` annotation, it does not rely on pattern matching to detect secrets. This means it can reliably redact sensitive data in terminal output and scan your codebase and client-facing bundles for leaked secrets. You can run this manually with `varlock scan` or, better yet, [install it as a pre-commit hook](https://varlock.dev/guides/secrets/#automatic-setup):

```bash
varlock scan --install-hook
```

There is also the matter of AI agents. Tools like Cursor and Claude Code routinely read local files as part of their workflow. A local `.env` file is an easy target. With Varlock and 1Password, there is simply nothing sensitive on disk for an agent to read.

Varlock also offers an [MCP server](https://varlock.dev/guides/mcp/#docs-mcp) you can add to your AI tools, giving agents awareness of your schema without exposing the actual secrets.

I have only scratched the surface here. Varlock supports [multiple languages and frameworks](https://varlock.dev) including Vite, Astro, and Cloudflare Workers, and its `auto-load` feature is a drop-in replacement for `dotenv`. If you are still managing secrets with `.env` files, it is worth exploring what varlock can offer.
