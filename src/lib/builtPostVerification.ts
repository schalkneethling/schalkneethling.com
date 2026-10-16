export type BuiltPostEvidence = {
  readonly slug: string;
  readonly hasPostPage: boolean;
  /** The contents of dist/rss.xml, or undefined when the build did not emit it. */
  readonly rssXml: string | undefined;
};

/**
 * Confirms a production build actually published a post: its page exists and
 * the RSS feed links to it. A post can pass schema validation and still be
 * missing here, for example when its pubDate is after the build time.
 */
export function findBuiltPostProblems({
  slug,
  hasPostPage,
  rssXml,
}: BuiltPostEvidence) {
  const problems: string[] = [];
  const postPath = `/posts/${slug}/`;

  if (!hasPostPage) {
    problems.push(`The build did not produce dist/posts/${slug}/index.html.`);
  }

  if (rssXml === undefined) {
    problems.push("The build did not produce dist/rss.xml.");
  } else if (!rssXml.includes(`${postPath}<`)) {
    problems.push(`dist/rss.xml does not link to ${postPath}.`);
  }

  return problems;
}
