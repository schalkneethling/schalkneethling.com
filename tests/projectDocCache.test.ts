import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  refreshProjectDocCache,
  repoUrlToRawDocUrl,
} from "../scripts/refresh-project-doc-cache.mjs";

const tempWorkspaceRoots: string[] = [];

const projectFrontmatter = (project: {
  id: string;
  repoUrl: string;
  title?: string;
}) => `---
title: "${project.title ?? project.id}"
description: "Test project"
category: "main"
order: 1
repoUrl: "${project.repoUrl}"
imageUrl: "https://example.com/${project.id}.png"
---
`;

async function createFixtureProject(project: {
  contentDirectory: string;
  id: string;
  repoUrl: string;
  title?: string;
}) {
  await mkdir(project.contentDirectory, { recursive: true });
  await writeFile(
    path.join(project.contentDirectory, `${project.id}.md`),
    projectFrontmatter(project),
  );
}

async function createTempWorkspace() {
  const root = await mkdtemp(path.join(os.tmpdir(), "project-doc-cache-"));
  tempWorkspaceRoots.push(root);

  return {
    root,
    contentDirectory: path.join(root, "src/content/projects"),
    cacheDirectory: path.join(root, "src/data/project-doc-cache"),
  };
}

afterEach(async () => {
  await Promise.all(
    tempWorkspaceRoots.splice(0).map((root) =>
      rm(root, {
        force: true,
        recursive: true,
      }),
    ),
  );
});

describe("repoUrlToRawDocUrl", () => {
  it("builds raw GitHub URLs for project docs", () => {
    expect(
      repoUrlToRawDocUrl(
        "https://github.com/schalkneethling/css-expect",
        "GOAL.md",
      ),
    ).toBe(
      "https://raw.githubusercontent.com/schalkneethling/css-expect/main/GOAL.md",
    );
  });

  it("rejects unsupported repository hosts", () => {
    expect(() =>
      repoUrlToRawDocUrl(
        "https://example.com/schalkneethling/css-expect",
        "GOAL.md",
      ),
    ).toThrow("Unsupported repository host: example.com");
  });

  it("rejects malformed GitHub repository paths", () => {
    expect(() =>
      repoUrlToRawDocUrl("https://github.com/schalkneethling", "GOAL.md"),
    ).toThrow(
      "Invalid GitHub repository URL: https://github.com/schalkneethling",
    );
  });
});

describe("refreshProjectDocCache", () => {
  it("writes fetched GOAL.md and ROADMAP.md content to the tracked cache", async () => {
    const workspace = await createTempWorkspace();
    await createFixtureProject({
      contentDirectory: workspace.contentDirectory,
      id: "css-expect",
      repoUrl: "https://github.com/schalkneethling/css-expect",
    });
    const fetch = vi.fn(
      async (input: URL | RequestInfo, init?: RequestInit) => {
        const url = String(input);
        expect(init?.signal).toBeInstanceOf(AbortSignal);

        if (url.endsWith("/GOAL.md")) {
          return new Response("# Goal\nMake CSS expectations readable.");
        }

        return new Response("# Roadmap\n- Ship the assertion runner.");
      },
    );

    const summary = await refreshProjectDocCache({
      contentDirectory: workspace.contentDirectory,
      cacheDirectory: workspace.cacheDirectory,
      fetch,
    });

    expect(summary).toEqual({
      projects: 1,
      fetched: 2,
      missing: 0,
      failed: 0,
    });

    const cache = JSON.parse(
      await readFile(
        path.join(workspace.cacheDirectory, "css-expect.json"),
        "utf8",
      ),
    );

    expect(cache).toMatchObject({
      id: "css-expect",
      repoUrl: "https://github.com/schalkneethling/css-expect",
      docs: {
        goal: {
          filename: "GOAL.md",
          status: "fetched",
          content: "# Goal\nMake CSS expectations readable.",
        },
        roadmap: {
          filename: "ROADMAP.md",
          status: "fetched",
          content: "# Roadmap\n- Ship the assertion runner.",
        },
      },
    });
    expect(cache.refreshedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    );
  });

  it("records missing docs without treating them as failures", async () => {
    const workspace = await createTempWorkspace();
    await createFixtureProject({
      contentDirectory: workspace.contentDirectory,
      id: "css-community-reset",
      repoUrl: "https://github.com/schalkneethling/css-community-reset",
    });
    const fetch = vi.fn(
      async (_input: URL | RequestInfo, _init?: RequestInit) =>
        new Response("Not found", { status: 404 }),
    );

    const summary = await refreshProjectDocCache({
      contentDirectory: workspace.contentDirectory,
      cacheDirectory: workspace.cacheDirectory,
      fetch,
    });

    expect(summary).toEqual({
      projects: 1,
      fetched: 0,
      missing: 2,
      failed: 0,
    });

    const cache = JSON.parse(
      await readFile(
        path.join(workspace.cacheDirectory, "css-community-reset.json"),
        "utf8",
      ),
    );

    expect(cache.docs.goal).toMatchObject({
      status: "missing",
      statusCode: 404,
      content: "",
    });
    expect(cache.docs.roadmap).toMatchObject({
      status: "missing",
      statusCode: 404,
      content: "",
    });
  });

  it("records GitHub failures and continues writing cache files", async () => {
    const workspace = await createTempWorkspace();
    await createFixtureProject({
      contentDirectory: workspace.contentDirectory,
      id: "web-platform-pulse",
      repoUrl: "https://github.com/schalkneethling/web-platform-pulse",
    });
    const fetch = vi.fn(
      async (_input: URL | RequestInfo, _init?: RequestInit) => {
        throw new Error("GitHub is unavailable");
      },
    );

    const summary = await refreshProjectDocCache({
      contentDirectory: workspace.contentDirectory,
      cacheDirectory: workspace.cacheDirectory,
      fetch,
    });

    expect(summary).toEqual({
      projects: 1,
      fetched: 0,
      missing: 0,
      failed: 2,
    });

    const cache = JSON.parse(
      await readFile(
        path.join(workspace.cacheDirectory, "web-platform-pulse.json"),
        "utf8",
      ),
    );

    expect(cache.docs.goal).toMatchObject({
      status: "failed",
      content: "",
      error: "GitHub is unavailable",
    });
    expect(cache.docs.roadmap).toMatchObject({
      status: "failed",
      content: "",
      error: "GitHub is unavailable",
    });
  });

  it("records invalid repository URLs as failed docs without aborting the refresh", async () => {
    const workspace = await createTempWorkspace();
    await createFixtureProject({
      contentDirectory: workspace.contentDirectory,
      id: "invalid-repo",
      repoUrl: "https://example.com/schalkneethling/invalid-repo",
    });
    const fetch = vi.fn();

    const summary = await refreshProjectDocCache({
      contentDirectory: workspace.contentDirectory,
      cacheDirectory: workspace.cacheDirectory,
      fetch,
    });

    expect(summary).toEqual({
      projects: 1,
      fetched: 0,
      missing: 0,
      failed: 2,
    });
    expect(fetch).not.toHaveBeenCalled();

    const cache = JSON.parse(
      await readFile(
        path.join(workspace.cacheDirectory, "invalid-repo.json"),
        "utf8",
      ),
    );

    expect(cache.docs.goal).toMatchObject({
      filename: "GOAL.md",
      sourceUrl: "",
      status: "failed",
      content: "",
      error: "Unsupported repository host: example.com",
    });
  });

  it("retries master before marking docs missing", async () => {
    const workspace = await createTempWorkspace();
    await createFixtureProject({
      contentDirectory: workspace.contentDirectory,
      id: "legacy-project",
      repoUrl: "https://github.com/schalkneethling/legacy-project",
    });
    const fetch = vi.fn(
      async (input: URL | RequestInfo, _init?: RequestInit) => {
        const url = String(input);

        if (url.includes("/main/")) {
          return new Response("Not found", { status: 404 });
        }

        if (url.endsWith("/master/GOAL.md")) {
          return new Response("# Goal\nLegacy default branch.");
        }

        return new Response("Not found", { status: 404 });
      },
    );

    const summary = await refreshProjectDocCache({
      contentDirectory: workspace.contentDirectory,
      cacheDirectory: workspace.cacheDirectory,
      fetch,
    });

    expect(summary).toEqual({
      projects: 1,
      fetched: 1,
      missing: 1,
      failed: 0,
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/schalkneethling/legacy-project/main/GOAL.md",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetch).toHaveBeenCalledWith(
      "https://raw.githubusercontent.com/schalkneethling/legacy-project/master/GOAL.md",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    const cache = JSON.parse(
      await readFile(
        path.join(workspace.cacheDirectory, "legacy-project.json"),
        "utf8",
      ),
    );

    expect(cache.docs.goal).toMatchObject({
      status: "fetched",
      sourceUrl:
        "https://raw.githubusercontent.com/schalkneethling/legacy-project/master/GOAL.md",
      content: "# Goal\nLegacy default branch.",
    });
    expect(cache.docs.roadmap).toMatchObject({
      status: "missing",
      sourceUrl:
        "https://raw.githubusercontent.com/schalkneethling/legacy-project/master/ROADMAP.md",
      statusCode: 404,
    });
  });
});
