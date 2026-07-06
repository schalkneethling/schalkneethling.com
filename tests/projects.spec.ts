import { expect, test } from "@playwright/test";

test("/projects keeps project cards visible after masonry upgrade", async ({
  page,
}) => {
  await page.goto("/projects");

  const firstProject = page.getByRole("heading", {
    name: "css-community-reset",
  });

  await expect(firstProject).toBeVisible();
});
