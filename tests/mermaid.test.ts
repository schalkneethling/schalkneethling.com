import { describe, expect, it } from "vitest";
import { hasMermaidFence } from "../src/lib/mermaid";

describe("hasMermaidFence", () => {
  it.each([
    "```mermaid",
    "````mermaid",
    "~~~~~mermaid",
    "``` mermaid",
    "~~~\tmermaid",
    "   ````  mermaid title=Example",
  ])("detects a Mermaid fence in %j", (fence) => {
    expect(hasMermaidFence(`Before\n${fence}\ngraph TD\nAfter`)).toBe(true);
  });

  it.each([
    "``mermaid",
    "~~mermaid",
    "``~mermaid",
    "```mermaidx",
    "    ```mermaid",
    "Before ```mermaid",
  ])("does not treat %j as a Mermaid fence", (fence) => {
    expect(hasMermaidFence(fence)).toBe(false);
  });
});
