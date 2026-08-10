---
title: Introducing Ephemeral Pages Action v1
pubDate: 2026-08-10
description: Ephemeral Pages Action publishes a self-contained HTML document from a pull-request workflow and posts the temporary link back as a pull-request comment. Version 1.0.0 is now available.
author: Schalk Neethling
tags: [git, testing]
standardSite:
  publish: true
---

When a pull-request check reports a pass or a fail, it can often generate, or benefit from
generating, a report that details the outcome. Usually that report ends up attached to the workflow
run as a downloadable artifact. Reading it means downloading a ZIP file, extracting it, finding the
entry point, and opening that file locally. Not hard, but it can quickly get tedious, and each
member of the team needs to follow the same process. In addition, the report sits outside the
pull-request conversation, where the discussion happens.

[Ephemeral Pages Action](https://github.com/schalkneethling/ephemeral-pages-action) brings the report
and context to your pull request. Give it a self-contained HTML document, and it publishes that file
temporarily through [Ephemeral Pages](https://ephemeral.schalkneethling.com), then creates or updates
a pull-request comment containing the public link.

Version [`v1.0.0`](https://github.com/schalkneethling/ephemeral-pages-action/releases/tag/v1.0.0) is
now available.

## One Action, One Temporary Report URL

A minimal workflow looks like this:

```yaml
name: Performance report
on:
  pull_request:
permissions:
  contents: read
  pull-requests: write
  id-token: write
jobs:
  report:
    if: github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - name: Generate report
        run: npm run report:performance
      - name: Publish temporary report
        id: publish-report
        uses: schalkneethling/ephemeral-pages-action@v1
        with:
          report-path: reports/performance.html
          report-name: Performance report
          ttl-hours: "24"
          github-token: ${{ github.token }}
```

The Action compresses the report with
[Brotli](https://developer.mozilla.org/en-US/docs/Glossary/Brotli_compression),
[Base64](https://developer.mozilla.org/en-US/docs/Glossary/Base64)-encodes it for transport, uploads
it, and maintains one stable pull-request comment for the normalized report name. Rerunning the
workflow updates that comment with the new URL, expiration time, commit, and workflow-run link
instead of adding another comment.

The step also exposes four outputs:

- `page-id`, the Ephemeral Pages identifier for the published report
- `page-url`, the temporary report URL
- `expires-at`, the expiration timestamp in ISO 8601 format
- `comment-id`, the identifier of the pull-request comment

The upload outputs are set before the comment step runs. If the upload succeeds but commenting
fails, the Action fails with those outputs intact and prints the public URL.

## It Is Not Tied To One Generator

The original use case involved accessibility reports, and "Accessibility report" remains the
default label. The Action itself has no dependency on axe, [Axe Aggregate Reporter](https://github.com/schalkneethling/axe-aggregate-reporter/), Playwright, or any other report producer.

It can publish most single-file HTML reports from accessibility tooling, Lighthouse and other
performance workflows, Playwright, Cypress, or another test reporter, code-coverage and
bundle-analysis tools, visual-regression systems, or a custom script that produces an HTML
dashboard.

The important part is the output, not the producer: one HTML file that can render within the
[Ephemeral Pages](https://github.com/schalkneethling/ephemeral-pages) sandbox and
[Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).

The document should be self-contained. Inline scripts and styles are supported, as are data and blob
images and media, along with a small set of trusted CDNs. Forms, arbitrary network connections,
external images, and other capabilities that do not fit a temporary sandboxed report are blocked.
Never include credentials, secrets, private source code, or sensitive test data: uploaded reports
are public until they expire.

## Authentication Without Another Secret

When the workflow grants `id-token: write`, the Action requests a
[GitHub Actions OIDC token](https://docs.github.com/en/actions/concepts/security/openid-connect)
scoped to the normalized Ephemeral Pages service origin and sends it as a bearer token. The API can
then apply repository-scoped identity and quota behavior without requiring a personal access token
or an Ephemeral Pages API secret.

If OIDC permission is absent, the Action warns and falls back to the anonymous service quota. The
ordinary `github-token` input is still required, because it creates or updates the pull-request
comment.

Tokens and report contents are never included in Action errors.

## Fork Safety Comes Before File Access

HTML generated by pull-request code is untrusted input, and the workflow that processes it holds
permission to write comments and request an OIDC token.

Before the Action resolves or reads `report-path`, it requires all of the following:

- the event is `pull_request`, and not `pull_request_target`
- a pull-request payload and number exist
- the head repository, the base repository, and the workflow repository all match

Fork pull requests, non-PR events, and `pull_request_target` are unsupported by design. Do not
change a consuming workflow to `pull_request_target` to work around the restriction: an elevated
upstream token must not process fork-controlled HTML.

The report path receives its own defense-in-depth checks. It must resolve inside
`GITHUB_WORKSPACE`, refer to a regular file, and remain inside the workspace after symlink
resolution. The Action checks the file size before allocating its contents and checks it again
after reading to account for races.

Raw HTML is limited to 20 MiB, and the Brotli-compressed payload to 2 MiB.

## Temporary By Design

The default lifetime is 12 hours. Supported TTL values range from one hour to seven days:

```text
1, 3, 5, 7, 12, 24, 72, 120, 168
```

The comment displays the exact expiration time, and expired pages are removed automatically. This
keeps the service focused on review-time collaboration rather than permanent site hosting.

Uploads are idempotent within one workflow run attempt. Network failures, rate limits, and
transient server errors are retried across up to three attempts, honoring
[`Retry-After`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Retry-After) up
to a 30-second ceiling and otherwise using bounded exponential backoff with jitter. Permanent client
errors fail immediately. Upload redirects are rejected so that report content cannot be replayed to
a different origin, and the returned page URL must belong to the configured service origin.

## How To Pin The Release

You can pin the immutable version:

```yaml
uses: schalkneethling/ephemeral-pages-action@v1.0.0
```

Or follow compatible fixes through the floating major tag:

```yaml
uses: schalkneethling/ephemeral-pages-action@v1
```

Both tags currently resolve to the exact source commit used to publish the immutable `v1.0.0`
release. Future `v1.x` releases may move `v1`. The `v1.0.0` tag will not move.

The release itself is produced by a protected GitHub Actions workflow. It validates a clean,
synchronized `main`, requires same-repository pull-request and production smoke-test evidence,
reruns the full quality suite on the exact release SHA, verifies a short-lived maintainer preflight
attestation, and places the only write-capable job behind a protected environment.

That process took longer to get right than I expected. The failed runs, the surprising API
responses, the lesson about pagination, and a GitHub outage along the way deserve a post of their
own. 😁

## Try It

The repository contains the complete input reference, security constraints, example workflow, and
release documentation:

- [Ephemeral Pages Action repository](https://github.com/schalkneethling/ephemeral-pages-action)
- [`v1.0.0` release](https://github.com/schalkneethling/ephemeral-pages-action/releases/tag/v1.0.0)
- [Ephemeral Pages service](https://ephemeral.schalkneethling.com)

If your pull-request workflow already produces one self-contained HTML document, publishing it for
review takes one additional step and no additional secret.
