import { describe, expect, it } from "vitest";

import { getProjectPath, getProjectStaticPaths } from "../src/lib/projectPages";

const projects = [
  { id: "css-community-reset", data: { title: "css-community-reset" } },
  { id: "web-platform-pulse", data: { title: "web-platform-pulse" } },
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
        props: { project: projects[1] },
      },
    ]);
  });
});
