import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DEFAULT_CONTENT_DIRECTORY = "src/content/projects";
const DEFAULT_CACHE_DIRECTORY = "src/data/project-doc-cache";
const DEFAULT_BRANCH = "main";
const DOC_BRANCHES = [DEFAULT_BRANCH, "master"];
const FETCH_TIMEOUT_MS = 10_000;

const DOCS = [
  { key: "goal", filename: "GOAL.md" },
  { key: "roadmap", filename: "ROADMAP.md" },
];

function parseFrontmatter(contents) {
  const match = contents.match(/^---\n(?<frontmatter>[\s\S]*?)\n---/);

  if (!match?.groups?.frontmatter) {
    return {};
  }

  return Object.fromEntries(
    match.groups.frontmatter
      .split("\n")
      .map((line) =>
        line.match(/^(?<key>[A-Za-z][A-Za-z0-9]*):\s+"?(?<value>[^"]+)"?\s*$/),
      )
      .filter((match) => match?.groups)
      .map((match) => [match.groups.key, match.groups.value]),
  );
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

export function repoUrlToRawDocUrl(
  repoUrl,
  filename,
  branch = DEFAULT_BRANCH,
) {
  const url = new URL(repoUrl);

  if (url.hostname !== "github.com") {
    throw new Error(`Unsupported repository host: ${url.hostname}`);
  }

  const [owner, repo] = url.pathname.replace(/^\/|\/$/g, "").split("/");

  if (!owner || !repo) {
    throw new Error(`Invalid GitHub repository URL: ${repoUrl}`);
  }

  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filename}`;
}

async function readProjectEntries(contentDirectory) {
  const filenames = await readdir(contentDirectory);
  const markdownFiles = filenames
    .filter((filename) => filename.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));

  const projects = [];

  for (const filename of markdownFiles) {
    const id = path.basename(filename, ".md");
    const contents = await readFile(path.join(contentDirectory, filename), "utf8");
    const frontmatter = parseFrontmatter(contents);

    if (!frontmatter.repoUrl) {
      continue;
    }

    projects.push({
      id,
      repoUrl: frontmatter.repoUrl,
      title: frontmatter.title ?? id,
    });
  }

  return projects;
}

async function fetchDoc(project, doc, fetchImpl) {
  let sourceUrl = "";

  try {
    let missingResult;

    for (const branch of DOC_BRANCHES) {
      sourceUrl = repoUrlToRawDocUrl(project.repoUrl, doc.filename, branch);
      const response = await fetchImpl(sourceUrl, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (response.status === 404) {
        missingResult = {
          filename: doc.filename,
          sourceUrl,
          status: "missing",
          statusCode: response.status,
          content: "",
        };
        continue;
      }

      if (!response.ok) {
        return {
          filename: doc.filename,
          sourceUrl,
          status: "failed",
          statusCode: response.status,
          content: "",
          error: `GitHub returned ${response.status}`,
        };
      }

      return {
        filename: doc.filename,
        sourceUrl,
        status: "fetched",
        statusCode: response.status,
        content: await response.text(),
      };
    }

    return missingResult;
  } catch (error) {
    return {
      filename: doc.filename,
      sourceUrl,
      status: "failed",
      content: "",
      error: getErrorMessage(error),
    };
  }
}

function updateSummary(summary, docResult) {
  if (docResult.status === "fetched") {
    summary.fetched += 1;
  } else if (docResult.status === "missing") {
    summary.missing += 1;
  } else {
    summary.failed += 1;
  }
}

export async function refreshProjectDocCache({
  contentDirectory = DEFAULT_CONTENT_DIRECTORY,
  cacheDirectory = DEFAULT_CACHE_DIRECTORY,
  fetch = globalThis.fetch,
  now = new Date(),
} = {}) {
  if (!fetch) {
    throw new Error("A fetch implementation is required");
  }

  const projects = await readProjectEntries(contentDirectory);
  const refreshedAt = now.toISOString();
  const summary = {
    projects: projects.length,
    fetched: 0,
    missing: 0,
    failed: 0,
  };

  await mkdir(cacheDirectory, { recursive: true });

  for (const project of projects) {
    const docs = {};

    for (const doc of DOCS) {
      const docResult = await fetchDoc(project, doc, fetch);
      docs[doc.key] = docResult;
      updateSummary(summary, docResult);
    }

    await writeFile(
      path.join(cacheDirectory, `${project.id}.json`),
      `${JSON.stringify(
        {
          id: project.id,
          title: project.title,
          repoUrl: project.repoUrl,
          refreshedAt,
          docs,
        },
        null,
        2,
      )}\n`,
    );
  }

  return summary;
}

async function runCli() {
  const summary = await refreshProjectDocCache();

  console.log(
    [
      `Refreshed project doc cache for ${summary.projects} projects.`,
      `Fetched: ${summary.fetched}.`,
      `Missing: ${summary.missing}.`,
      `Failed: ${summary.failed}.`,
    ].join(" "),
  );

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

const currentFileUrl = pathToFileURL(fileURLToPath(import.meta.url)).href;
const executedFileUrl = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : "";

if (currentFileUrl === executedFileUrl) {
  await runCli();
}
