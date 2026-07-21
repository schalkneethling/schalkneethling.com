import remarkFrontmatter from "remark-frontmatter";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";

interface MarkdownNode {
  readonly type: string;
  readonly value?: string;
  readonly alt?: string;
  readonly children?: readonly MarkdownNode[];
}

const parser = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(remarkFrontmatter, ["yaml"]);

const ignoredNodeTypes = new Set([
  "code",
  "html",
  "yaml",
  "mdxjsEsm",
  "mdxFlowExpression",
  "mdxTextExpression",
]);

const blockNodeTypes = new Set([
  "root",
  "blockquote",
  "list",
  "listItem",
  "mdxJsxFlowElement",
  "table",
  "tableRow",
]);

function nodeText(node: MarkdownNode): string {
  if (ignoredNodeTypes.has(node.type)) {
    return "";
  }

  if (node.type === "text" || node.type === "inlineCode") {
    return node.value ?? "";
  }

  if (node.type === "image") {
    return node.alt ?? "";
  }

  const separator = blockNodeTypes.has(node.type) ? "\n" : "";
  return node.children?.map(nodeText).join(separator) ?? "";
}

export function extractStandardSiteText(source: string) {
  return nodeText(parser.parse(source) as MarkdownNode)
    .split(/\n+/u)
    .map((line) => line.replace(/\s+/gu, " ").trim())
    .filter(Boolean)
    .join("\n");
}
