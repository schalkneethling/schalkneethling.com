# Standard.site publishing and authentication workflow

- Status: Accepted
- Date: 2026-07-17
- Tracks: [GitHub issue #1333](https://github.com/schalkneethling/schalkneethling.com/issues/1333)

## Decision

schalkneethling.com will use a repository-local, dry-run-first command to create
and update Standard.site records on the publishing account's AT Protocol
Personal Data Server (PDS).

The command will use the official TypeScript tooling:

- [`@atproto/lex`](https://www.npmjs.com/package/@atproto/lex) for pinned
  Lexicon schemas, validation, generated types, and authenticated record calls;
- [`@atproto/lex-password-session`](https://www.npmjs.com/package/@atproto/lex-password-session)
  for the owner-operated command's password session.

The `site.standard.publication` and `site.standard.document` Lexicons will be
installed into a committed `lexicons/` directory with their resolved CIDs
pinned in `lexicons.json`. Generated TypeScript output may remain uncommitted
when it can be reproduced from that manifest.

Payload generation and remote synchronization remain separate operations. The
generator produces a deterministic, inspectable offline plan without
authentication or network access. The sync command validates and refines that
plan against the PDS, and writes only when an explicit `--write` option is
present.

## Why this workflow

The [Standard.site implementations list](https://standard.site/docs/implementations/)
currently includes a validator, migration tools, publishing platforms, and
discovery services, but not a generic tool that maps an Astro content
collection to records and safely persists returned AT-URIs in post
frontmatter.

Manual record creation would work for initial experimentation, but it would
duplicate field mapping, make updates difficult to reproduce, and increase the
risk that remote records and local identifiers drift apart.

The repository-local approach is also established by the
[AT Protocol website's own Standard.site workflow](https://github.com/bluesky-social/atproto-website#publishing-blog-posts-to-at-protocol),
which creates publication and document records from project commands, stores
returned document AT-URIs with the source posts, and updates existing records.

## Authentication

The publishing command is an owner-operated command-line tool, not an end-user
login flow. It will therefore use a dedicated AT Protocol app password. The
[AT Protocol authentication guidance](https://atproto.com/guides/sdk-auth)
allows password authentication for command-line tools and recommends app
passwords instead of primary account passwords. OAuth is deferred unless this
becomes a hosted or multi-user application.

The required environment variables will be:

| Variable | Sensitive | Purpose |
| --- | --- | --- |
| `ATPROTO_SERVICE_URL` | No | Entryway or PDS service used to start the password session. |
| `ATPROTO_HANDLE` | No | Handle of the account that owns the Standard.site records. |
| `ATPROTO_APP_PASSWORD` | Yes | Revocable app password used only for this publishing workflow. |

These variables will be declared in `.env.schema` and resolved by Varlock from
the personal 1Password account at `my.1password.com`. Create a dedicated item
named `atproto-schalkneethling-com` in the `dev` vault with fields matching the
environment-variable names. The intended references are:

```dotenv
ATPROTO_SERVICE_URL=op(op://dev/atproto-schalkneethling-com/ATPROTO_SERVICE_URL)
ATPROTO_HANDLE=op(op://dev/atproto-schalkneethling-com/ATPROTO_HANDLE)
ATPROTO_APP_PASSWORD=op(op://dev/atproto-schalkneethling-com/ATPROTO_APP_PASSWORD)
```

The app password field is sensitive. No credential, access token, or refresh
token will be committed or written to a local environment file. The command
logs in once per sync run and keeps session tokens in memory only.

The typed publication configuration will store the expected publisher DID and
publication AT-URI. Before the first write, the command must confirm that the
authenticated session DID matches that configured publisher DID. This prevents
valid records from being created under the wrong account.

Dry-run generation must not require any of the authentication variables.

## Command behavior

The eventual command names may be refined during implementation, but their
contract is:

- `pnpm standard-site:generate` performs local selection, mapping, Lexicon
  validation, and action planning without authentication or network access.
- `pnpm standard-site:sync` performs an authenticated, read-only PDS preflight
  and is a dry run by default.
- `pnpm standard-site:sync -- --write` is the only mode permitted to create or
  update PDS records.

### Offline planning dry-run

`standard-site:generate`:

1. Loads publication configuration and Astro post metadata.
2. Applies canonical eligibility and the `standardSite.publish` state rules.
3. Maps selected content to publication and document payloads and validates
   them against the pinned Lexicons.
4. Classifies each record from durable local state: `create` when publishing is
   enabled without an AT-URI, `update` when publishing is enabled with an
   AT-URI, and `skip` when it is absent, disabled, or ineligible.
5. Prints a stable JSON plan and a human-readable summary containing each
   action and its reason.

This command does not load authentication variables, start a password session,
make network requests, modify frontmatter, or write PDS records. It exits
non-zero on selection, mapping, or Lexicon validation errors.

### Authenticated sync dry-run

`standard-site:sync` builds the same offline plan in memory, authenticates once,
verifies the publisher DID, and performs read-only requests for records that
already have an AT-URI. It verifies record ownership, fetches current payloads
and CIDs, and shows the exact creates, field-level updates, unchanged records,
and skips that write mode would perform.

The command must display a prominent `DRY RUN` marker. Without `--write`, it
must not call create, put, or delete record endpoints, change frontmatter, or
write recovery state. A successful dry-run exits zero; authentication,
ownership, validation, missing-record, or conflict checks exit non-zero.

Both dry-runs must honor the `standardSite.publish` and `documentAtUri` state
invariants in the [adoption policy](standard-site-adoption.md).

### Write mode

Write mode processes records one at a time:

1. Authenticate and verify the publisher DID before any write.
2. Create or update the publication record before document records.
3. For a create, persist the returned AT-URI before starting the next write.
4. For an update, parse the existing AT-URI and update that exact repository,
   collection, and record key.
5. Fetch the current record CID and use compare-and-swap where supported so a
   concurrent remote change is not silently overwritten.
6. Report created, updated, skipped, and failed records without exposing
   credentials or session tokens.

Records with `standardSite.publish: false` are skipped. The initial workflow
does not delete remote records.

## Failure recovery and rollback

- A validation, authentication, DID, or planning failure stops the command
  before remote writes.
- Writes are sequential rather than batched, so each successful result can be
  persisted before continuing.
- If a record is created but its AT-URI cannot be persisted locally, the command
  stops immediately and reports the source file, AT-URI, and CID as recovery
  information. A subsequent run must refuse to create a duplicate until that
  identifier is recovered into the source post.
- An update conflict or network failure leaves the local `documentAtUri`
  unchanged and reports the record as failed. Retrying regenerates the plan
  from current local and remote state.
- Automatic rollback and deletion are out of scope. To reverse an update,
  restore the previous payload from Git history and run an explicit update.
  Deleting a remote record requires a separate, deliberately designed command.
- Revoking the dedicated app password immediately removes the command's future
  write access.

## Consequences for follow-up issues

- Publication configuration must include the expected publisher DID and an
  optional publication AT-URI.
- The post schema remains the durable source for document AT-URIs.
- Record generation must validate against pinned Standard.site Lexicons and
  remain usable without credentials.
- The PDS sync implementation must use the Varlock variables and safety
  contract defined here.
- Validation must cover publisher identity, AT-URI ownership, verification
  links, and create/update/skip planning.

## Sources

- [Standard.site quick start](https://standard.site/docs/quick-start/)
- [Standard.site permissions](https://standard.site/docs/permissions/)
- [Standard.site implementations](https://standard.site/docs/implementations/)
- [AT Protocol SDK authentication](https://atproto.com/guides/sdk-auth)
- [AT Protocol writing data](https://atproto.com/guides/writing-data)
- [`com.atproto.repo.putRecord`](https://docs.bsky.app/docs/api/com-atproto-repo-put-record)
- [AT Protocol website Standard.site workflow](https://github.com/bluesky-social/atproto-website#publishing-blog-posts-to-at-protocol)
