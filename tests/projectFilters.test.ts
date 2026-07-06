import { describe, expect, it } from "vitest";

import {
  getProjectsByCategory,
  sortProjectsByOrder,
} from "../src/lib/projectFilters";

const projects = [
  { id: "third", data: { category: "main", order: 3 } },
  { id: "demo", data: { category: "demo", order: 1 } },
  { id: "first", data: { category: "main", order: 1 } },
  { id: "second", data: { category: "main", order: 2 } },
] as const;

describe("sortProjectsByOrder", () => {
  it("sorts project entries by explicit order without mutating the input", () => {
    const sorted = sortProjectsByOrder(projects);

    expect(sorted.map((project) => project.id)).toEqual([
      "demo",
      "first",
      "second",
      "third",
    ]);
    expect(projects.map((project) => project.id)).toEqual([
      "third",
      "demo",
      "first",
      "second",
    ]);
  });
});

describe("getProjectsByCategory", () => {
  it("returns only projects from the requested category in display order", () => {
    expect(
      getProjectsByCategory(projects, "main").map((project) => project.id),
    ).toEqual(["first", "second", "third"]);
    expect(
      getProjectsByCategory(projects, "demo").map((project) => project.id),
    ).toEqual(["demo"]);
  });
});
