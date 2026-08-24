---
title: An MCP server for Ephemeral Pages
pubDate: 2026-08-24
description: Ephemeral Pages is now available as a public MCP server. A look at what the new MCP specification stateless protocol core changed, and why this allowed me to add MCP support to the service.
author: Schalk Neethling
tags: ["typescript", "nodejs"]
standardSite:
  publish: true
---

When I first started building Ephemeral Pages, I always intended to have it available as an MCP server as well. After reviewing the specification at the time and getting a better understanding of the deployment requirements, I decided against it. The deployment story pointed toward a financial investment I could not justify for what is still entirely a hobby project.

The [2026-07-28 revision of the specification](https://blog.modelcontextprotocol.io/posts/2026-07-28/) changed that. The headline of the release is a stateless protocol core: the `initialize` and `initialized` exchange and the `Mcp-Session-Id` header are retired, and each request now carries its protocol version, client identity, and client capabilities in `_meta`. A server no longer needs to hold a session or keep a bidirectional stream open, which means a request can land on any instance behind a plain load balancer. For me, that is the difference between needing a long-lived process and being able to serve the whole thing from a serverless function on infrastructure I already pay little to nothing for (Thanks, Netlify).

Ephemeral Pages is therefore now also available through a public MCP server at [https://ephemeral.schalkneethling.com/mcp](https://ephemeral.schalkneethling.com/mcp), which lets agents upload and retrieve self-contained HTML pages through the service.

The MCP server is built on the existing REST API that already backs the Ephemeral Pages GitHub Action, which saved a considerable amount of time. The implementation uses the [official TypeScript MCP SDK](https://ts.sdk.modelcontextprotocol.io/v2/), which keeps the code aligned with the standard and handles most of the protocol details.

## The Server

The server is created by calling the `McpServer` constructor, which accepts two objects: the [server information](https://ts.sdk.modelcontextprotocol.io/v2/api/@modelcontextprotocol/server/server/mcp.html#mcpserver) and the [server options](https://ts.sdk.modelcontextprotocol.io/v2/api/@modelcontextprotocol/server/server/server.html#serveroptions).

```typescript
const server = new McpServer(
  {
    name: "ephemeral-pages",
    title: "Ephemeral Pages",
    version: "0.5.0",
    description:
      "Publish short-lived public HTML pages that expire automatically.",
    websiteUrl: `https://${PRODUCTION_HOST}`,
  },
  {
    instructions: `Use ${CREATE_PAGE_TOOL_NAME} with a full HTML document, then share the returned URL. Use ${GET_PAGE_TOOL_NAME} to look up metadata for a known id.`,
    cacheHints: {
      "tools/list": { ttlMs: 24 * 60 * 60 * 1000, cacheScope: "public" },
      "prompts/list": { ttlMs: 24 * 60 * 60 * 1000, cacheScope: "public" },
    },
  },
);
```

The server information is primarily human-readable output for display in a user interface. The `instructions` property is exactly what it says: guidance for the agent on how to use this server as a whole, rather than any individual tool.

The `cacheHints` property comes from the 2026-07-28 revision, which made the results of `tools/list`, `prompts/list`, `resources/list`, and `resources/read` cacheable by attaching a `ttlMs` and a `cacheScope` to each. This matters more than it first appears, because the default is not "no hint, so cache sensibly." A result without a hint carries `ttlMs: 0`, and no client will ever serve it from cache. Declining to set `cacheHints` is therefore a decision that makes every client refetch the tool catalog on every connection.

The tool and prompt lists here change infrequently, so I set a lifetime of one day. That happens to sit exactly at the ceiling: the SDK caps any `ttlMs` at twenty-four hours on the client side. The `cacheScope` of `public` allows shared caches to hold the result, and it is the right choice here for a specific reason. A `public` scope is only correct when the result is identical for every caller. Ephemeral Pages exposes the same two tools and the same prompt to everyone with no authorization-dependent variation, so nothing derived from one caller's context can leak into another's cache. Anything that varies by caller belongs in the `private` scope, which is the default.

## The Tools And The Prompt

The server exposes two tools and one prompt: `create_page`, `get_page`, and `publish-html-page`. Tools are registered by calling [`registerTool`](https://ts.sdk.modelcontextprotocol.io/v2/api/@modelcontextprotocol/server/server/mcp.html#registertool) on the server instance, which takes a name, a configuration object, and a callback.

Because the protocol no longer carries a session, the pieces a handler needs for a given request have to reach it some other way. Everything above, including the constructor call, therefore lives inside a factory that takes the incoming request and the page store and returns a fully registered server:

```typescript
export function createEphemeralPagesMcpServer({
  incoming,
  store,
  dependencies,
}: CreateEphemeralPagesMcpServerOptions): McpServer {
  const server = new McpServer(/* as above */);

  server.registerTool(
    CREATE_PAGE_TOOL_NAME,
    {
      title: "Create ephemeral page",
      description: CREATE_PAGE_TOOL_DESCRIPTION,
      inputSchema: createPageInputSchema,
      outputSchema: pageMetadataOutputSchema,
      annotations: CREATE_PAGE_TOOL_ANNOTATIONS,
    },
    async (args) =>
      toolResponse(await publishPage(incoming, args, store, dependencies)),
  );

  // get_page and the prompt register the same way

  return server;
}
```

The handler is what turns that factory into an HTTP endpoint, and it is where the stateless model becomes concrete.

```typescript
function createRequestHandler(incoming: Request) {
  return createMcpHandler(
    () =>
      createEphemeralPagesMcpServer({
        incoming,
        store: createPageStore(),
      }),
    {
      legacy: "reject",
      responseMode: "json",
      onerror: (error) => {
        captureException(error);
      },
    },
  );
}
```

A whole server instance is constructed for every request and discarded afterward. Under the previous revision that would have been incoherent, because the server was the thing holding the session. Setting `responseMode` to `json` means responses go back as plain JSON rather than as a server-sent event stream, and `legacy: "reject"` declines 2025-era clients outright rather than maintaining a second code path for them. Both are choices a hobby project can afford and a larger deployment might not, but together they are what let this run as an ordinary function invocation with no persistent process behind it.

For both tools the input schema is a [Zod](https://zod.dev/) object schema, which gives the SDK something to validate incoming arguments against and gives me a TypeScript type to infer. The `outputSchema` does the same for the `structuredContent` a tool returns alongside its text.

The annotations differ between the two tools, and they are worth setting deliberately, because clients use them to decide whether a call needs explicit confirmation or can proceed in an automatic mode.

```typescript
export const CREATE_PAGE_TOOL_ANNOTATIONS = Object.freeze({
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
});

export const GET_PAGE_TOOL_ANNOTATIONS = Object.freeze({
  readOnlyHint: true,
  openWorldHint: false,
});
```

`readOnlyHint` is the one that does the most work, because the other two behavioral hints are defined relative to it. The specification treats `destructiveHint` and `idempotentHint` as meaningful only when `readOnlyHint` is `false`. On `create_page`, both are therefore live and both say something useful: publishing a page is additive rather than destructive, and calling it twice produces two pages rather than one. On `get_page`, `readOnlyHint: true` already tells a client everything the other two would.

The default posture is worth knowing as well. A tool with no annotations at all is assumed to be potentially destructive, non-idempotent, and open-world, so a client honoring the specification will treat an unannotated tool with maximum caution. One caveat belongs alongside all of this. Annotations are hints and not contracts, and the specification is explicit that clients must consider them untrusted unless they come from a trusted server. Nothing at the protocol level stops a server from claiming `readOnlyHint: true` and deleting data anyway. They are a risk vocabulary for approval interfaces, not a security mechanism, and a client that uses them to bypass review rather than to inform it has misread them.

Finally, the prompt.

```typescript
server.registerPrompt(
  PUBLISH_HTML_PAGE_PROMPT_NAME,
  {
    title: "Publish an HTML page",
    description: PUBLISH_HTML_PAGE_PROMPT_DESCRIPTION,
    argsSchema: publishHtmlPagePromptArgs,
  },
  ({ path }) => ({
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: publishHtmlPagePromptText(path),
        },
      },
    ],
  }),
);
```

The difference between a tool and a prompt is a difference in who invokes it. A tool is model-controlled: the model decides to call it partway through a turn, which is why the configuration surface carries schemas and behavioral annotations. A prompt is user-controlled, typically surfaced as a slash command, and the handler returns messages for the host to insert into the conversation rather than a result. Nothing has happened when a prompt handler returns. The model has simply been given better framing.

That framing is where the two meet. The `argsSchema` is a Zod schema expecting a file path, and the text returned by `publishHtmlPagePromptText` points the model at the tool:

```javascript
`Publish HTML to Ephemeral Pages using the ${CREATE_PAGE_TOOL_NAME} tool.

The caller provided a file path. Read the file at that path, then call ${CREATE_PAGE_TOOL_NAME} with its contents (or a corrected full page). If you can't read the file, inform the user and stop.

Path: ${path}

Requirements:

- html must be a complete, self-contained HTML document (doctype plus html, head, and body). Do not send Markdown, fragments, or a bare body.
- The page URL will be public and will expire. Never include secrets, credentials, private source, or sensitive test data.
- Scripts, styles, and fonts may load only from the service allowlist (jsDelivr, unpkg, cdnjs, Google Fonts). fetch, XHR, and WebSocket are blocked.
- Choose expirationHours from 1, 3, 5, 7, 12, 24, 72, 120, or 168. Default is 12 hours.
- After publishing, share the returned url with the user.
`;
```

Interpolating the tool name rather than writing it as a literal is a small thing that pays for itself. The prompt cannot compel a tool call, but interpolating the tool name from a constant ensures the name in one context does not drift from another. As such, when the model does call the tool, the tool name is guaranteed to correct.

## Serving it

The function declares its own public path and rate limit:

```typescript
export const config = {
  path: "/mcp",
  rateLimit: NETLIFY_EDGE_RATE_LIMIT,
} satisfies Config;
```

In principle that is enough to route the function at `/mcp`. In practice it was not, and I still have a redirect in `netlify.toml` doing the same job:

```toml
[[redirects]]
from = "/mcp"
to = "/.netlify/functions/mcp"
status = 200
```

Without the redirect the path did not resolve. I have not worked out why, so I am recording it as an observation rather than an explanation. If you hit the same thing, the redirect is a reliable fallback.

### How I plan to debug this

Netlify reads in-source function configuration at build time, so the first question is whether that step succeeded at all. The Functions tab in the Netlify interface shows the route it actually registered. If it lists the default `/.netlify/functions/mcp` rather than `/mcp`, extraction failed, and the deploy log will usually carry a warning about it rather than an error, which is exactly the kind of line that scrolls past unnoticed.

If extraction is the problem, my first suspect is the `rateLimit` value. It is `NETLIFY_EDGE_RATE_LIMIT`, an imported binding rather than an inline literal, and a build step that reads the config by static analysis has no way to resolve an import. The plausible failure mode is that it discards the entire config object, `path` included, rather than the single field it could not read. That is cheap to test: inline the rate limit as a literal on a deploy preview, drop the redirect, and see whether the path resolves.

My second suspect applies if the build step evaluates the module instead of parsing it. The function imports its Sentry and storage modules at the top level, and if either throws during evaluation, perhaps because an environment variable is absent in the build sandbox, the export is never read. The same test applies, moving the config export into a module with no side-effecting imports.

The one piece I would not skip on a public endpoint is the host and origin guard that runs before anything else in the request handler. A browser-reachable MCP endpoint that accepts any `Origin` is open to DNS rebinding, where a page on an attacker's domain resolves to a local or trusted host and then talks to the server with the user's network position. Before the handler sees anything, the guard inspects two headers. A `Host` that is neither `localhost` nor the production host is rejected outright. So is an `Origin` pointing anywhere other than those same hosts, and for production it must be over HTTPS. The allowed CORS headers are worth a look as well, because the list now includes `Mcp-Method` and `Mcp-Name`. Those are the 2026-07-28 routing headers, and a browser client cannot reach the server without them.

There are more implementation details around preparing and calling the REST API endpoints, but from the MCP server perspective that is the whole surface. The details are in [the pull request on GitHub](https://github.com/schalkneethling/ephemeral-pages/pull/15). For testing and inspecting an MCP server implementation, the MCP Inspector is the tool I reach for, and it is documented in the [MCP tools documentation](https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector).

## Using It

The server is a public Streamable HTTP endpoint. There is no API key, bearer token, or OAuth flow to set up, and nothing to install or run locally. Point a client at it and it connects:

```text
https://ephemeral.schalkneethling.com/mcp
```

With Codex, that is one command:

```bash
codex mcp add ephemeral-pages --url https://ephemeral.schalkneethling.com/mcp
```

Claude Code has an equivalent, and it is the path I would take, because the CLI writes the file for you:

```bash
claude mcp add --transport http ephemeral-pages https://ephemeral.schalkneethling.com/mcp
```

If you prefer to write the configuration by hand, it goes in `.mcp.json` at the project root, or `~/.claude.json` for something you want available everywhere. Note that neither is `settings.json`, and Claude Code does not read `claude_desktop_config.json` either, which belongs to the desktop application.

```json
{
  "mcpServers": {
    "ephemeral-pages": {
      "type": "http",
      "url": "https://ephemeral.schalkneethling.com/mcp"
    }
  }
}
```

The `type` field is the part to get right. Claude Code treats an entry with a `url` but no `type` as a stdio server, which is a configuration error rather than a silent fallback, so the connection simply will not come up. It accepts `streamable-http` as an alias for `http` if you would rather match the name the specification uses.

Cursor reads the same shape from `.cursor/mcp.json` in the project or `~/.cursor/mcp.json` globally, and it infers the transport from the presence of a `url`:

```json
{
  "mcpServers": {
    "ephemeral-pages": {
      "url": "https://ephemeral.schalkneethling.com/mcp"
    }
  }
}
```

That difference is worth knowing if you copy a block from one to the other. The Cursor entry above will not work in Claude Code without adding `type`.

The one constraint worth repeating is the `legacy: "reject"` decision from earlier. The server speaks `2026-07-28` and nothing else, so a client pinned to a 2025-era protocol version will not connect at all rather than degrading to a partial experience.

Once connected, an agent discovers the two tools and the prompt described above. In practice the workflow is to ask it to publish a complete HTML document, pick one of the supported expiration periods if twelve hours is not what you want, and share the URL it returns. That URL is public for as long as the page lives, so nothing sensitive should ever go into a page: no secrets, no credentials, no private source, no real customer data.

Configuration examples for OpenCode, Pi, VS Code, and the Inspector, along with the full tool arguments, limits, and security model, are in [the MCP guide in the repository](https://github.com/schalkneethling/ephemeral-pages/blob/main/docs/mcp.md).

## A Server Looking For A Client

The server runs, and it responds correctly. A hand-rolled request returns both tools with their schemas, the cache hints attached, and the server information in `_meta`. What it will not do is talk to a single client I can find.

Claude Code and Codex both negotiate `2025-11-25`, and because I set `legacy: "reject"`, my server tells them so rather than falling back:

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32022,
    "message": "Unsupported protocol version: 2025-11-25",
    "data": { "supported": ["2026-07-28"], "requested": "2025-11-25" }
  },
  "id": 1
}
```

This is the server behaving exactly as specified and exactly as configured. It is also, for the moment, a server with no clients — and not only the two I tried. Apify maintains a machine-readable dataset of MCP clients and their capabilities, published as `mcp-client-capabilities` on npm and PyPI. It currently tracks forty-two clients. Thirty-eight of them report `2025-06-18` and the remaining four report `2025-03-26`. Not one is on `2026-07-28`, and not one is even on the revision before it.

That dataset is community-maintained and lags reality, which its own documentation is careful about: it lists Claude Code at `2025-06-18` while the error above shows Claude Code negotiating `2025-11-25`. So treat those numbers as a floor rather than a census. The direction is not in doubt, though. Nothing out there speaks this revision yet.

I do not think adopting it anyway was the wrong call. Supporting the older era means reintroducing the entire mechanism this revision removed: the initialize handshake, sessions keyed by `Mcp-Session-Id`, the standalone GET stream, resumable streams via `Last-Event-ID`. That machinery is the reason a 2025-era MCP server needed a persistent process, and dropping it is the reason this one fits in a function invocation I pay nothing for. Adding it back to reach clients that will support the new revision soon enough seems like the wrong trade for a hobby project.

What did surprise me is how hard that was to find out in advance. The specification publishes a client feature matrix, but it tracks which primitives a client implements, not which revision it speaks, and the same is true of the extension matrix. [There is a proposal open for something more comprehensive, modeled on caniuse](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1814), whose stated motivation is that developers lose hours to debugging what turns out to be an unsupported feature. There is currently an early start at [something like this by Brandon Satrom](https://github.com/blues/canimcp) that is worth supporting.
