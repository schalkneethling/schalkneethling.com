# Standard.site adoption policy

This document defines how schalkneethling.com will adopt
[Standard.site](https://standard.site/) during phases 0–2 of the integration.
Standard.site is an AT Protocol metadata, discovery, and verification layer for
the blog. It does not replace the website, RSS, canonical URLs, Open Graph
metadata, or existing Fediverse metadata.

## Canonical source policy

schalkneethling.com remains the canonical reading experience and source of
truth for content published on this domain.

- A post is eligible for a Standard.site document record when it has no
  `canonical` frontmatter value, or when its parsed, normalized URL origin is
  exactly `https://schalkneethling.com`.
- Origin matching ignores the URL path and trailing slash, normalizes hostname
  casing, and treats the default HTTPS port (`443`) as equivalent. A different
  scheme, hostname, or non-default port is not equivalent. For example,
  `https://SCHALKNEETHLING.com/posts/example/` is eligible, while
  `http://schalkneethling.com/` and `https://schalkneethling.com:8443/` are not.
- A post whose `canonical` URL has a different normalized origin—including
  another domain such as DEV or Medium, another scheme, or a non-default
  port—is excluded from phases 0–2. An invalid or unparseable `canonical` value
  is also excluded and must be reported as a validation error.
- External-canonical posts must not be included implicitly by a generator or
  sync command. Supporting them later requires a separate policy decision.
- Standard.site does not change the canonical URL emitted by a page.

## Rollout policy

Adoption will be incremental:

1. Configure and verify one publication record.
2. Generate inspectable, deterministic payloads without remote writes.
3. Pilot document records with 5–10 representative posts that are canonical to
   schalkneethling.com.
4. Validate the publication, document records, and corresponding website
   discovery links locally and after deployment.
5. Decide whether to backfill the remaining eligible archive using evidence
   from the pilot.

New and historical posts are not published automatically until the publishing
workflow, validation, and explicit write mode are implemented. A full archive
backfill is not part of the initial rollout.

## Record identifier storage

- The publication AT-URI will live in the typed Standard.site publication
  configuration introduced by the publication configuration work. It remains
  optional until the publication record exists.
- A document AT-URI will live with its post in an optional nested frontmatter
  object:

  ```yaml
  standardSite:
    publish: true
    documentAtUri: "at://..."
  ```

- The content collection schema will validate this object while allowing all
  existing posts to omit it. When `standardSite` is present, `publish` is
  required and `documentAtUri` is optional. The valid states are:

  - no `standardSite`: the post has no explicit Standard.site publishing
    selection and sync skips it;
  - `standardSite.publish: false` without `documentAtUri`: the post is
    explicitly excluded and sync skips it;
  - `standardSite.publish: false` with `documentAtUri`: the existing identifier
    is retained, but sync neither updates nor deletes the remote record;
  - `standardSite.publish: true` without `documentAtUri`: the post is selected
    for creation; dry-run reports a create and explicit write mode creates the
    record;
  - `standardSite.publish: true` with `documentAtUri`: explicit write mode uses
    the identifier to update the existing record.

  A successful create must persist the returned `documentAtUri` in the same
  post's `standardSite` frontmatter through a reviewable repository change. If
  persistence fails, sync must stop and report the returned identifier so the
  local state can be recovered before further writes.
- Generated artifacts may be used for dry-run review, but they are not the
  durable source of record identifiers.

This nested, optional `standardSite` shape and its `publish` and
`documentAtUri` invariants are the adopted storage model.

## Initial product scope

Phases 0–2 cover:

- publication configuration and record creation;
- publication verification and discovery;
- optional post metadata and document verification links;
- dry-run payload generation;
- an explicit, authenticated PDS sync workflow;
- validation, documentation, and a small pilot backfill.

The following are intentionally deferred beyond phases 0–2, not excluded from
the longer-term integration:

- reader-facing Standard.site controls or badges;
- in-site AT Protocol authentication;
- subscriptions and recommends;
- comments or other social interactions;
- publishing records for external-canonical posts;
- automatically backfilling the full archive.

Replacing RSS, canonical metadata, Open Graph, or Fediverse metadata is not a
goal of the Standard.site integration in any phase.

Reader-facing and social features remain deferred until the pilot demonstrates
that compatible tools can discover or validate the records and there is
evidence that adding visible affordances would benefit readers.

## Operational safeguards

- Payload generation and sync must default to dry-run behavior.
- Remote writes must require an explicit write option.
- Credentials and tokens must be supplied through the existing Varlock and
  1Password workflow, declared as sensitive values in `.env.schema`, and never
  committed to the repository.
- Record creation, updates, skips, and failures must be reported clearly.
- Missing publication or document AT-URIs must not break local builds.

## Publishing workflow

The [publishing and authentication workflow](standard-site-publishing-workflow.md)
defines the accepted tooling, authentication, write safeguards, and recovery
strategy that implementation work must follow.
