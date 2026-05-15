---
title: "The Security of Ephemeral Pages"
pubDate: 2026-05-15
description: "A walkthrough of the security vulnerabilities flagged by an AI agent skill review of Ephemeral Pages, and the mitigations put in place as a result."
author: "Schalk Neethling"
tags: ["javascript", "security"]
---

I built a [little webapp, or micro-service](https://ephemeral.schalkneethling.com), depending on how you like to think about it. Because of what it does, security was never an afterthought; it was a genuine concern from the start. The surface area for abuse is real: an app that accepts and serves arbitrary HTML from the public internet is exactly the kind of thing that attracts unwanted attention.

After the initial development and design phases were complete, I shifted focus to a structured security review. I have a security agent skill that I have been refining, and this felt like a good opportunity to put it to the test. I asked Codex to review the application using the skill as a reference. I also made a point of telling it not to feel constrained by what the skill covered — if it spotted something else, I wanted to know about it.

The rest of this article walks through the vulnerabilities flagged and the mitigations put in place as a result.

## Uploaded HTML is directly executable on the app origin

This was the critical issue that needed immediate attention.

**Issue:** `/api/pages/:id/content` returns raw uploaded HTML as `text/html` from the primary app origin. The normal UI later injects CSP and loads it in a sandboxed blob iframe, but an attacker can share the direct API URL and bypass that isolation.

**Risk:** Stored same-origin XSS. Even though the app has little user state today, this enables phishing, origin abuse, future privilege escalation, and admin-targeted attacks.

**Proposed fix:** Add HTTP-level protection to content responses: at minimum `Content-Security-Policy` with `sandbox allow-scripts` plus the uploaded-page CSP, and `X-Content-Type-Options: nosniff`. Alternatively, return content as an attachment or move untrusted content to a separate origin.

The first step to address this was to ensure the page routes include the following headers:

```toml
Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
Permissions-Policy = "camera=(), geolocation=(), microphone=(), payment=(), usb=()"
Referrer-Policy = "no-referrer"
X-Content-Type-Options = "nosniff"
```

> **Note**: [Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Permissions_Policy) is not yet widely available, so it will, as of this writing, May 15, 2026, only affect Chromium-based browsers.

The `getPageContent` function now returns the HTML with the following headers set:

```js
{
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex",
  "Content-Security-Policy": buildUploadedPageHttpCsp(),
  "X-Content-Type-Options": "nosniff",
}
```

For the content security policy, we start with:

```js
`sandbox allow-scripts; ${buildUploadedPageCsp()}`;
```

And then also add the result of `buildUploadedPageCsp`:

```js
return [
  "default-src 'none'",
  `script-src ${scripts}`,
  `style-src ${styles}`,
  "font-src https://fonts.gstatic.com",
  "img-src data: blob:",
  "media-src data: blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");
```

For `script-src` and `style-src` we set `'unsafe-inline'` and allow the following content delivery networks:

```js
const TRUSTED_CDN_ORIGINS = [
  "https://cdn.jsdelivr.net",
  "https://unpkg.com",
  "https://cdnjs.cloudflare.com",
] as const;
```

From this list, only `fonts.googleapis.com` is permitted in `style-src` so the CSS can load, and `https://fonts.gstatic.com` is explicitly allowed for the font files themselves. Neither is a valid script source.

It is also important to note that an uploaded page is rendered inside a sandboxed `iframe`:

```html
<iframe
  id="page-iframe"
  class="page-iframe"
  sandbox="allow-scripts"
  title="${`Shared ephemeral page ${pageId}`}"
></iframe>
```

## Medium vulnerabilities

There were also a couple of medium-level vulnerabilities to address:

### No upload/report abuse throttling

**Issue**: Anyone can repeatedly upload 2 MB pages and submit abuse reports.

**Risk**: Storage cost abuse, function invocation abuse, Netlify Forms spam, and moderation noise.

**Proposed Fix**: Add rate limits or quotas for upload/report actions, ideally per IP/user-agent fingerprint at the edge or function layer. Consider CAPTCHA/Turnstile only once abuse is real enough to justify UX friction.

The first item addressed was rate limiting. Whenever a route is called that should be rate-limited, this becomes the first check: should this request be allowed to proceed?

A quick aside. Part of how rate limiting works is based on a `RATE_LIMIT_SECRET` — an application secret generated with OpenSSL and exposed to the app via Netlify's sensitive environment variables. The source of this secret is stored in a 1Password vault and guarded even for local development; it is read from [1Password using Varlock](https://varlock.dev) and never stored in plain text in a `.env` file.

Checking rate limits takes us on quite the journey, so bear with me. The first thing we must do is retrieve the rate limit secret. If the system cannot retrieve it, we hit a hard stop and no actor can proceed. I will be notified via Sentry with a specific `rate_limit_secret_missing` event. Assuming everything is configured correctly, nobody should ever hit this roadblock.

There are a few things we need before we can check whether rate limiting applies:

- our secret
- actorHash
- subjectHash
- key
- policy type
- existing record

We know we have our secret, so we need to calculate our hashes. The reason for hashing is security and privacy — I do not want to store any of this as plain text, particularly the component parts that make up the actor hash.

The function `hashValue` takes two parameters: `value` and `secret`. In the case of both hashes, the secret is the rate limit secret. For the actor hash, the value is a combination of the user's IP and user agent.

Inside the function, we first call [`crypto.subtle.importKey`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey) to turn our secret into a [`CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey) that can be used with the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API):

```js
// importKey(format, keyData, algorithm, extractable, keyUsages)
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign"],
);
```

We specify the raw format, convert our secret from a string into a [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) using [`TextEncoder.encode`](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encode), set `extractable` to `false`, and limit usage to signing. If all goes well, we now have our `CryptoKey`.

The next step is [`crypto.subtle.sign`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign):

```js
// sign(algorithm, key, data)
const signature = await crypto.subtle.sign(
  "HMAC",
  key,
  new TextEncoder().encode(value),
);
```

We specify the same algorithm, pass our `CryptoKey`, and again use `TextEncoder` to convert our value into a `Uint8Array` — the format `sign` expects. The result is an `ArrayBuffer`. We then convert it to a `Uint8Array`, map each byte to a two-character hex string (padding with a leading zero where necessary), and join the result:

```js
return Array.from(new Uint8Array(signature), (byte) =>
  byte.toString(16).padStart(2, "0"),
).join("");
```

This gives us a string like `"0aff0380..."` — our hash.

> **Note**: It was also important to me that these hash records are not held any longer than necessary. Just as with the pages themselves, a cron runs every hour to delete any records that have already expired. A record never remains in the Blob store beyond its useful lifetime.

With our two hashes in hand, the next piece is the `key`:

```js
function rateLimitKey(name: RateLimitName, actorHash: string, subjectHash: string): string {
  return `${RATE_LIMIT_PREFIX}/${name}/${actorHash}/${subjectHash}.json`;
}
```

At first glance this looks like a file path. It is, however, the key used when storing a rate limit entry in [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/). The slash-delimiting is intentional, as it allows us to later list all entries under a given prefix — for example, `store.list({ prefix: "rate-limits/" })`. The `.json` extension is a convention only.

The last three items are more straightforward. The policy is one of three possibilities — `upload`, `report`, or `failedDelete` — defined in a constant called `RATE_LIMITS`, which specifies how many attempts are allowed per window and how long that window lasts.

We then try to get the existing rate limit record by key and pass the result to `activeRecord`:

```js
function activeRecord(
  existing: RateLimitRecord | null,
  now: number,
  windowMs: number,
): RateLimitRecord {
  if (!existing || existing.resetAt <= now) {
    return { count: 0, resetAt: now + windowMs };
  }

  return existing;
}
```

If no record exists or the window has expired, a fresh one is returned. Otherwise the existing record is used. From here the check is straightforward: if the number of attempts would exceed the limit, the request is blocked and a Sentry event is logged. If not, the record is updated and the request is allowed through.

### Admin delete token has no brute-force protection

**Issue**: The delete endpoint accepts unlimited bearer-token attempts and does a direct string comparison.

**Risk**: A weak or leaked token can be attacked repeatedly.

**Potential Fix**: Require a long random token, rate-limit failed deletes, log failed attempts, and use constant-time comparison where practical.

The delete token follows the same pattern as the rate limit secret: generated with OpenSSL, stored in 1Password, never in source control, and exposed to the server via a Netlify environment secret marked as sensitive.

As described above, rate limiting is now in place across page and API routes, and failed attempts are logged to Sentry. The remaining item — constant-time comparison — is a calculated risk I have accepted for now. With all of the other mitigations in place, direct string comparison feels acceptable. Disagree? Let me know.

> **Note**: I am also relying on [Netlify's rate limiting](https://docs.netlify.com/manage/security/secure-access-to-sites/rate-limiting/) for platform-level protection.

### Admin review accepts cross-origin flagged URLs

**Issue**: `pageIdFromUrl` extracts `/p/:id` from any URL origin.

**Risk**: A forged report like `https://evil.example/p/real-id` can make the admin UI authorise deleting a real local page ID if the reviewer trusts the workflow.

**Fix**: Require `url.origin === window.location.origin` before enabling deletion.

The fix required only a small addition to `getIdFromUrl`:

```js
if (url.origin !== window.location.origin) {
  return null;
}
```

If the origins do not match, the function returns `null`, and the rest of the admin template guards against a null `pageId` before binding any events.

## Low / Hardening

Two items were reported here.

### Main app lacks site-wide security headers

**Issue**: No CSP, `frame-ancestors`, `Referrer-Policy`, or `Permissions-Policy` is configured for the app shell or admin UI.

**Proposed Fix**: Add Netlify headers. Especially use `frame-ancestors 'none'` for clickjacking resistance and a tight CSP for the trusted app shell.

As detailed earlier, the app shell now applies the following headers site-wide:

```toml
[headers.values]
Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
Permissions-Policy = "camera=(), geolocation=(), microphone=(), payment=(), usb=()"
Referrer-Policy = "no-referrer"
X-Content-Type-Options = "nosniff"
```

### Accepted HTML can later fail CSP injection

**Issue**: Server validation accepts some doctype-only HTML documents, while `injectCsp` requires `<html>` or `<head>`.

**Risk**: Some accepted uploads render as app errors.

**Fix**: Align validation with rendering requirements or inject via parse/serialisation instead of regex.

This surfaced a larger concern I was already uncomfortable with. While some validation was being run on submitted HTML, it felt non-deterministic. I tightened this up significantly. Submitted HTML now passes through several steps: we first ensure we received a value, that it is a string, and that it is not empty once trimmed. We then check that the total byte size does not exceed the 2 MB limit. Finally, we parse the document with the [parse5 library](https://npmjs.com/package/parse5) and verify that the result contains an author-supplied `html` or `head` element. Only then does the upload proceed.

## Conclusion

Taking the time to work through this properly was worthwhile. The process surfaced real issues — including the critical same-origin XSS risk — that warranted immediate attention. There are likely still things I have missed, and that thought will linger. But the app is meaningfully more robust for having gone through this exercise.

If you want to see how it all fits together, [the source code is available to browse](https://github.com/schalkneethling/ephemeral-pages). If you spot something I have overlooked or have ideas for hardening it further, [please open an issue](https://github.com/schalkneethling/ephemeral-pages/issues) — I would love to make it better together.
