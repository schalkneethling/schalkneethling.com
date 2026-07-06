export type ProjectCategory = "main" | "demo";

type OrderedProject = {
  data: {
    category: ProjectCategory;
    order: number;
  };
};

export function sortProjectsByOrder<TProject extends OrderedProject>(
  projects: readonly TProject[],
) {
  return [...projects].sort((projectA, projectB) => {
    return projectA.data.order - projectB.data.order;
  });
}

export function getProjectsByCategory<TProject extends OrderedProject>(
  projects: readonly TProject[],
  category: ProjectCategory,
) {
  return sortProjectsByOrder(
    projects.filter((project) => project.data.category === category),
  );
}
