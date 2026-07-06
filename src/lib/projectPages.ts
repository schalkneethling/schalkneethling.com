type ProjectEntryLike = {
  id: string;
};

export function getProjectPath(projectId: string) {
  return `/projects/${projectId}`;
}

export function getProjectStaticPaths<ProjectEntry extends ProjectEntryLike>(
  projects: readonly ProjectEntry[],
) {
  return projects.map((project) => ({
    params: { slug: project.id },
    props: { project },
  }));
}
