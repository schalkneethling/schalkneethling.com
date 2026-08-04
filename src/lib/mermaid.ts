const MERMAID_FENCE_PATTERN =
  /^ {0,3}(?:`{3,}[ \t]*mermaid(?:[ \t][^`\r\n]*)?|~{3,}[ \t]*mermaid(?:[ \t][^\r\n]*)?)$/m;

export function hasMermaidFence(markdown: string) {
  return MERMAID_FENCE_PATTERN.test(markdown);
}
