const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";
const GITHUB_USERNAME = "schalkneethling";

export interface GitHubRepo {
  name: string;
  description: string;
  url: string;
  language: string | null;
  stargazerCount: number;
  openGraphImageUrl: string;
  isFork: boolean;
  isArchived: boolean;
}

interface GraphQLRepoNode {
  name: string;
  description: string | null;
  url: string;
  primaryLanguage: { name: string } | null;
  stargazerCount: number;
  openGraphImageUrl: string;
  isFork: boolean;
  isArchived: boolean;
}

interface GraphQLResponse {
  data: {
    user: {
      repositories: {
        nodes: GraphQLRepoNode[];
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
      };
    };
  };
}

function buildQuery(afterCursor?: string): string {
  const after = afterCursor ? `, after: "${afterCursor}"` : "";
  return `{
    user(login: "${GITHUB_USERNAME}") {
      repositories(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}, ownerAffiliations: OWNER${after}) {
        nodes {
          name
          description
          url
          primaryLanguage { name }
          stargazerCount
          openGraphImageUrl
          isFork
          isArchived
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }`;
}

function normalizeNode(node: GraphQLRepoNode): GitHubRepo {
  return {
    name: node.name,
    description: node.description ?? "",
    url: node.url,
    language: node.primaryLanguage?.name ?? null,
    stargazerCount: node.stargazerCount,
    openGraphImageUrl: node.openGraphImageUrl,
    isFork: node.isFork,
    isArchived: node.isArchived,
  };
}

async function fetchAllRepos(): Promise<GitHubRepo[]> {
  const token = import.meta.env.GITHUB_TOKEN;
  if (!token) {
    console.warn("[github.ts] GITHUB_TOKEN not set — skipping GitHub API fetch");
    return [];
  }

  const allNodes: GraphQLRepoNode[] = [];
  let afterCursor: string | undefined;

  try {
    do {
      const response = await fetch(GITHUB_GRAPHQL_API, {
        method: "POST",
        headers: {
          Authorization: `bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: buildQuery(afterCursor) }),
      });

      if (!response.ok) {
        console.warn(`[github.ts] GitHub API returned ${response.status}`);
        return allNodes.map(normalizeNode);
      }

      const json = (await response.json()) as GraphQLResponse;
      const { nodes, pageInfo } = json.data.user.repositories;

      allNodes.push(...nodes);

      if (pageInfo.hasNextPage && pageInfo.endCursor) {
        afterCursor = pageInfo.endCursor;
      } else {
        break;
      }
    } while (true);
  } catch (error) {
    console.warn("[github.ts] Failed to fetch repos:", error);
    return allNodes.map(normalizeNode);
  }

  return allNodes.map(normalizeNode);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function fetchRandomProjects(
  excludeNames: string[],
  count: number,
): Promise<GitHubRepo[]> {
  const repos = await fetchAllRepos();
  const excludeSet = new Set(excludeNames);

  const eligible = repos.filter(
    (repo) =>
      !repo.isFork &&
      !repo.isArchived &&
      repo.description &&
      !excludeSet.has(repo.name),
  );

  return shuffleArray(eligible).slice(0, count);
}

export async function fetchFeaturedProjects(
  names: string[],
): Promise<GitHubRepo[]> {
  const repos = await fetchAllRepos();
  const repoMap = new Map(repos.map((r) => [r.name, r]));

  return names
    .map((name) => repoMap.get(name))
    .filter((repo): repo is GitHubRepo => repo !== undefined);
}
