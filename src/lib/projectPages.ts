type ProjectEntryLike = {
  data: {
    category: "main" | "demo";
  };
  id: string;
};

export function getProjectPath(projectId: string) {
  return `/projects/${projectId}`;
}

export function getProjectStaticPaths<ProjectEntry extends ProjectEntryLike>(
  projects: readonly ProjectEntry[],
) {
  return projects
    .filter((project) => project.data.category === "main")
    .map((project) => ({
      params: { slug: project.id },
      props: { project },
    }));
}
