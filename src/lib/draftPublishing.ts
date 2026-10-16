import { isScalar, parse, parseDocument } from "yaml";

import { isPublishedPost } from "./postFilters.ts";
import { postSchema } from "./postSchema.ts";

export const DRAFTS_DIRECTORY = "src/content/drafts";
export const POSTS_DIRECTORY = "src/content/posts";

const DRAFT_FILE_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\.mdx?$/;
const PUBLISH_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const FRONTMATTER_PATTERN =
  /^(?<opening>---[ \t]*\r?\n)(?<yaml>[\s\S]*?)(?<closing>\r?\n---[ \t]*(?:\r?\n|$))/;

export type DraftPublicationInput = {
  readonly draftFileName: string;
  readonly draftSource: string;
  readonly existingPostFileNames: readonly string[];
  /** The publication date as YYYY-MM-DD. */
  readonly publishDate: string;
  readonly now: Date;
};

export type DraftPublicationPlan = {
  readonly slug: string;
  readonly draftFileName: string;
  readonly postFileName: string;
  readonly title: string;
  readonly previousPubDate: string;
  readonly pubDate: string;
  /** The post source to write, identical to the draft except for pubDate. */
  readonly source: string;
};

export type DraftPublicationResult =
  | { readonly ok: true; readonly plan: DraftPublicationPlan }
  | { readonly ok: false; readonly errors: readonly string[] };

export type DraftResolutionResult =
  | { readonly ok: true; readonly draftFileName: string }
  | { readonly ok: false; readonly errors: readonly string[] };

function refuse(error: string): DraftPublicationResult {
  return { ok: false, errors: [error] };
}

function slugFromFileName(fileName: string) {
  return fileName.replace(/\.mdx?$/, "");
}

/**
 * The calendar date of `now` in UTC. The posts collection reads a YAML date
 * as midnight UTC, so a UTC calendar date is never in the future.
 */
export function formatUtcDate(now: Date) {
  return now.toISOString().slice(0, 10);
}

function isValidCalendarDate(value: string) {
  const match = PUBLISH_DATE_PATTERN.exec(value);

  if (!match) {
    return false;
  }

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function formatSchemaIssues(
  issues: readonly { path: PropertyKey[]; message: string }[],
) {
  return issues.map((issue) => {
    const field = issue.path.map(String).join(".") || "frontmatter";

    return `Invalid frontmatter field "${field}": ${issue.message}`;
  });
}

/**
 * Accepts a draft slug, a draft file name, or a path ending in a draft file
 * name, and resolves it to exactly one file in the drafts directory.
 */
export function resolveDraftFileName(
  input: string,
  draftFileNames: readonly string[],
): DraftResolutionResult {
  const requestedName = input.split(/[\\/]/).at(-1) ?? input;
  const requestedSlug = slugFromFileName(requestedName);
  const hasExtension = requestedName !== requestedSlug;

  const matches = draftFileNames.filter((fileName) =>
    hasExtension
      ? fileName === requestedName
      : slugFromFileName(fileName) === requestedSlug,
  );

  if (matches.length === 1) {
    return { ok: true, draftFileName: matches[0] };
  }

  if (matches.length > 1) {
    return {
      ok: false,
      errors: [
        `The slug "${requestedSlug}" matches more than one draft: ${matches.join(", ")}`,
      ],
    };
  }

  const availableDrafts = draftFileNames.map(slugFromFileName).join(", ");

  return {
    ok: false,
    errors: [
      `No draft named "${input}" in ${DRAFTS_DIRECTORY}. Available drafts: ${availableDrafts || "none"}`,
    ],
  };
}

/**
 * Plans promoting a draft to a published post without touching the file
 * system. The plan only changes the draft's pubDate; every other byte of the
 * source is preserved.
 */
export function planDraftPublication({
  draftFileName,
  draftSource,
  existingPostFileNames,
  publishDate,
  now,
}: DraftPublicationInput): DraftPublicationResult {
  const hasSlugFileName = DRAFT_FILE_NAME_PATTERN.test(draftFileName);

  if (!hasSlugFileName) {
    return refuse(
      `The draft file name "${draftFileName}" must be a lowercase kebab-case slug ending in .md or .mdx.`,
    );
  }

  if (!isValidCalendarDate(publishDate)) {
    return refuse(
      `The publication date "${publishDate}" is not a valid YYYY-MM-DD calendar date.`,
    );
  }

  const frontmatter = FRONTMATTER_PATTERN.exec(draftSource);

  if (!frontmatter?.groups) {
    return refuse("The draft does not start with a YAML frontmatter block.");
  }

  const { opening, yaml } = frontmatter.groups;
  const document = parseDocument(yaml, { keepSourceTokens: true });

  if (document.errors.length > 0) {
    return {
      ok: false,
      errors: document.errors.map(
        (error) => `The draft frontmatter is not valid YAML: ${error.message}`,
      ),
    };
  }

  const pubDateNode = document.get("pubDate", true);
  const pubDateRange = isScalar(pubDateNode) ? pubDateNode.range : undefined;

  if (!pubDateRange) {
    return refuse("The draft frontmatter has no pubDate field to update.");
  }

  const body = draftSource.slice(frontmatter[0].length);

  if (body.trim() === "") {
    return refuse("The draft has no content after its frontmatter.");
  }

  const [valueStart, valueEnd] = pubDateRange;
  const updatedYaml = `${yaml.slice(0, valueStart)}${publishDate}${yaml.slice(valueEnd)}`;

  // Astro reads frontmatter as YAML 1.1, where an unquoted date is a Date.
  const validation = postSchema.safeParse(
    parse(updatedYaml, { schema: "yaml-1.1" }),
  );

  if (!validation.success) {
    return { ok: false, errors: formatSchemaIssues(validation.error.issues) };
  }

  const isVisibleAtBuildTime = isPublishedPost({ data: validation.data }, now);

  if (!isVisibleAtBuildTime) {
    return refuse(
      `The publication date ${publishDate} is after the current UTC time, so the build would hide this post until a later deploy.`,
    );
  }

  const slug = slugFromFileName(draftFileName);
  const conflictingPost = existingPostFileNames.find(
    (fileName) => slugFromFileName(fileName) === slug,
  );

  if (conflictingPost) {
    return refuse(
      `A post with the slug "${slug}" already exists: ${POSTS_DIRECTORY}/${conflictingPost}`,
    );
  }

  const frontmatterYamlOffset = frontmatter.index + opening.length;
  const source =
    draftSource.slice(0, frontmatterYamlOffset) +
    updatedYaml +
    draftSource.slice(frontmatterYamlOffset + yaml.length);

  return {
    ok: true,
    plan: {
      slug,
      draftFileName,
      postFileName: draftFileName,
      title: validation.data.title,
      previousPubDate: String(document.get("pubDate")),
      pubDate: publishDate,
      source,
    },
  };
}
