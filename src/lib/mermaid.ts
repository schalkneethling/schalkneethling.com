const MERMAID_FENCE_PATTERN =
  /^[ \t]{0,3}(?:`{3,}|~{3,})[ \t]*mermaid(?:[ \t].*)?$/m;

export function hasMermaidFence(markdown: string) {
  return MERMAID_FENCE_PATTERN.test(markdown);
}
