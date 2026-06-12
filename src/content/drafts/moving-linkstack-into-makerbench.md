---
title: "Merging Two Side Projects Without a Staging Database"
pubDate: 2026-06-15
description: "I recently reached that slightly uncomfortable point where two side projects had started orbiting the same idea closely enough that keeping them separate no longer made sense."
author: "Schalk Neethling"
tags: ["engineering-explained"]
---

I recently reached that slightly uncomfortable point where two side projects had started orbiting the same idea closely enough that keeping them separate no longer made sense.

One was **MakerBench**, a curated directory of tools for makers and developers. The other was **LinkStack**, a place to collect and publish useful resources and stacks of links. The overlap was obvious: both were about discovery, curation, and sharing useful things. The difference was mostly framing.

MakerBench was about **tools**. LinkStack was about **resources**.

So the plan became: merge LinkStack into MakerBench, keep the concepts separate in the UI, and let MakerBench become the home for both.

Simple enough, right?

Well.

## The Goal

The first phase was intentionally narrow. I did not want to rebuild all of LinkStack inside MakerBench in one heroic sweep. That way lies pain, confusion, and probably a few late-night regrets.

The goal was:

- keep MakerBench’s existing tools section
- add a new public resources section powered by LinkStack data
- preserve LinkStack’s Supabase users and public listings
- move MakerBench off Turso/libSQL and onto Supabase Postgres
- use Drizzle as the server-side ORM and migration layer
- standardize validation on Valibot
- migrate existing MakerBench bookmarks/tools into the new shared data model

The larger signed-in LinkStack personal library experience could wait. Phase one was about public data, public pages, and getting the foundation right.

## The Architecture Decision

The merged app now has two public concepts:

- **Tools**, which are MakerBench’s curated tool listings
- **Resources**, which are LinkStack’s public resources and stacks

Under the hood, both share a normalized `resources` table. That table represents the URL identity: canonical URL, normalized URL, title, metadata, and timestamps.

Then separate tables describe how those URLs are used:

- `tool_listings` for MakerBench tools
- `public_listings` for standalone public resources
- `public_stacks` for public collections
- `public_stack_items` for resources inside stacks

That distinction matters. A URL is not automatically a tool, and not every resource is a tool. Keeping the shared URL identity separate from the public listing type gives the system room to grow without turning the data model into soup.

Supabase stays responsible for Auth and browser/session-aware access. Drizzle becomes the canonical server-side ORM and migration tool.

## The Free-Tier Reality Check

The ideal setup would have been:

- one Supabase project for production
- one Supabase project for staging
- Netlify deploy previews connected to staging
- production deploys connected only to production

But this is a side project, and paid staging infrastructure was not in the cards. Supabase’s paid plan was more than I wanted to spend for this project right now, and I already had my two free Supabase projects allocated.

So we made a pragmatic call: use the existing LinkStack Supabase project as the single production database.

That meant Netlify deploy previews were useful for checking builds and UI, but they were not a true staging environment. A real staging environment is not just another URL. It is separate data, separate credentials, and a place where mistakes do not touch production.

Without that, the process had to become the safety net.

## The Production Seatbelts

Before touching production, I created manual database dumps. Supabase Free does not give the same restore comfort as paid backups or point-in-time recovery, so “backup” meant making our own logical export.

The rough shape was:

```bash
supabase db dump --db-url "$SUPABASE_DATABASE_URL" -f backup-schema.sql
supabase db dump --db-url "$SUPABASE_DATABASE_URL" -f backup-data.sql --use-copy --data-only
```

This was not glamorous, but it mattered. Once you are running schema migrations against the only production database, your confidence should come from artifacts, not vibes.

Then came the production sequence:

1. Back up Supabase.
2. Apply the Drizzle migration.
3. Export the old MakerBench Turso database.
4. Convert the Turso export into JSON.
5. Run the import script in dry-run mode.
6. Execute the import.
7. Verify counts and spot-check rows.
8. Only then think about merging the PR.

## Exporting Turso

MakerBench’s old data lived in Turso. The importer expected JSON in this shape:

```json
{
  "bookmarks": [],
  "tags": [],
  "bookmark_tags": []
}
```

So the flow was:

```bash
turso db export makerbench --output-file /tmp/makerbench-migration/makerbench-turso.db --overwrite
```

Then extract the relevant SQLite tables:

```bash
sqlite3 /tmp/makerbench-migration/makerbench-turso.db \
  -json "select * from bookmarks;" \
  > /tmp/makerbench-migration/bookmarks.json

sqlite3 /tmp/makerbench-migration/makerbench-turso.db \
  -json "select * from tags;" \
  > /tmp/makerbench-migration/tags.json

sqlite3 /tmp/makerbench-migration/makerbench-turso.db \
  -json "select * from bookmark_tags;" \
  > /tmp/makerbench-migration/bookmark_tags.json
```

And combine them:

```bash
jq -n \
  --slurpfile bookmarks /tmp/makerbench-migration/bookmarks.json \
  --slurpfile tags /tmp/makerbench-migration/tags.json \
  --slurpfile bookmark_tags /tmp/makerbench-migration/bookmark_tags.json \
  '{
    bookmarks: $bookmarks[0],
    tags: $tags[0],
    bookmark_tags: $bookmark_tags[0]
  }' \
  > /tmp/makerbench-migration/makerbench-export.json
```

The importer defaults to dry-run mode:

```bash
pnpm migrate:makerbench-turso --source=/tmp/makerbench-migration/makerbench-export.json
```

To actually write:

```bash
pnpm migrate:makerbench-turso --source=/tmp/makerbench-migration/makerbench-export.json --execute
```

I am very glad the write mode required an explicit flag.

## The Things That Bit Us

No migration is complete without a few “ah, of course” moments.

### Drizzle Needs More Than SQL

I initially added a manual migration SQL file for Postgres.

That was not enough.

Drizzle migrations are not driven only by the `.sql` files. They also need metadata in `meta/_journal.json`. Without that, `drizzle-kit migrate` does not know how to apply the migration properly.

The fix was to add the missing journal file for the new Postgres migration directory.

Lesson: if you hand-create Drizzle migrations, remember the journal.

### CI Needed `@types/pg`

The app built locally, but Netlify CI failed with:

```txt
Could not find a declaration file for module 'pg'
```

The correct fix was not a custom declaration file. The official types exist, so the fix was:

```bash
pnpm add -D @types/pg
```

Small thing, but exactly the kind of small thing that only shows up when CI gets a turn.

### Varlock’s Generated Types Should Not Be Committed

Varlock generates an `env.d.ts` file from `.env.schema`. On my machine, regenerating it produced noisy output with large inline SVG comments.

The Varlock docs recommend committing `.env.schema`, but ignoring the generated type file because it depends on the local environment hierarchy.

So `env.d.ts` now belongs in `.gitignore`.

That was a good reminder that generated files need a policy. Otherwise they quietly become churn machines.

### SQLite Timestamps Were Not Always Timestamps

The Turso import failed on the first execute with:

```txt
RangeError: Invalid time value
```

Some old `approved_at` values were literal SQL snippets:

```txt
CURRENT_TIMESTAMP
datetime('now')
```

Those are not timestamps. They are strings that used to make sense in a SQLite context, but they cannot be converted to Postgres timestamps.

The importer was updated to report invalid timestamp fields during dry-run and import those specific fields as `null`.

For this dataset, there were 24 bookmarks. The first failed run inserted 4 before crashing. After fixing the importer, the second execute inserted 20 and skipped 4.

That is exactly why import scripts should be idempotent.

## The PR as a Runbook

The PR was not just a code review artifact. It became the deployment plan.

The PR body included:

- infrastructure notes
- a production rollout checklist
- migration steps
- verification commands
- follow-up issues
- known limitations

This was especially important because there was no staging database. The PR had to say, loudly and clearly: do not merge this until the production database is ready for the code.

That changed the PR from “here is some code” into “here is how this lands safely.”

## What Worked Well

A few decisions paid off.

Keeping phase one small was the big one. We did not try to rebuild all of LinkStack. We brought over public resources and stacks, and left the signed-in personal library for later.

The importer being explicit about dry-run versus execute also helped. The dry-run output exposed duplicate URLs and later timestamp issues before we committed fully to the write path.

The schema design also feels like a good foundation. Having a shared `resources` table with separate public concepts on top gives MakerBench more flexibility than simply stuffing everything into one “links” table.

And opening follow-up issues kept the migration from ballooning. There are still things to improve:

- cleanup naming from “bookmarks” to “tools” where appropriate
- revisit React data fetching patterns
- audit temporary performance logs
- improve card semantics
- decide what to do with user preferences and theming

But those are follow-up projects, not reasons to hold the first phase hostage.

## What I Learned

The biggest lesson is that free-tier infrastructure is workable, but it shifts responsibility back onto process.

If you cannot afford a full staging setup, you need other seatbelts:

- manual backups
- dry-run scripts
- idempotent imports
- additive migrations
- clear PR checklists
- careful sequencing
- immediate smoke tests

Another lesson: staging is not a deploy preview. A deploy preview is useful, but if it points at production data, it is not staging. It is a preview UI connected to production risk.

And finally, migration work is not just data movement. It is naming, ownership, operational discipline, CI friction, docs, generated files, and all the little assumptions that only become visible when two real systems meet.

## The Result

At the end of the process:

- MakerBench runs on Supabase Postgres.
- LinkStack public resources now live inside MakerBench.
- Existing MakerBench tools were imported from Turso.
- Tools and resources have separate UI sections.
- New tool submission works against the new backend.
- The production database survived the trip.

It was a lot for a side project.

But it also feels like the right kind of progress: fewer projects to maintain, a clearer product direction, and a stronger foundation for whatever comes next.
