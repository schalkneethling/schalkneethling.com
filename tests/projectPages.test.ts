import { describe, expect, it } from "vitest";

import { getProjectPath, getProjectStaticPaths } from "../src/lib/projectPages";

const projects = [
  {
    id: "css-community-reset",
    data: { category: "main", title: "css-community-reset" },
  },
  {
    id: "little-demos",
    data: { category: "demo", title: "little-demos" },
  },
  {
    id: "web-platform-pulse",
    data: { category: "main", title: "web-platform-pulse" },
  },
] as const;

describe("getProjectPath", () => {
  it("returns the internal detail page URL for a project id", () => {
    expect(getProjectPath("css-community-reset")).toBe(
      "/projects/css-community-reset",
    );
  });
});

describe("getProjectStaticPaths", () => {
  it("maps project entries into Astro static paths with project props", () => {
    expect(getProjectStaticPaths(projects)).toEqual([
      {
        params: { slug: "css-community-reset" },
        props: { project: projects[0] },
      },
      {
        params: { slug: "web-platform-pulse" },
        props: { project: projects[2] },
      },
    ]);
  });
});
