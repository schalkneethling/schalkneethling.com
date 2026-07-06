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

test("/projects renders image headers for project cards", async ({ page }) => {
  const transparentPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );

  await page.route(
    /https:\/\/(opengraph\.githubassets\.com|repository-images\.githubusercontent\.com)\/.*/,
    async (route) => {
      await route.fulfill({
        body: transparentPng,
        contentType: "image/png",
      });
    },
  );

  await page.goto("/projects");

  const firstProjectImage = page
    .locator("article.project-card")
    .first()
    .locator("img.project-card-image");

  await expect(firstProjectImage).toBeVisible();
  await expect(firstProjectImage).toHaveAttribute(
    "src",
    /opengraph\.githubassets\.com|repository-images\.githubusercontent\.com/,
  );
});

test("project detail pages render project artifacts and links", async ({
  page,
}) => {
  const transparentPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  );

  await page.route(
    /https:\/\/(opengraph\.githubassets\.com|repository-images\.githubusercontent\.com)\/.*/,
    async (route) => {
      await route.fulfill({
        body: transparentPng,
        contentType: "image/png",
      });
    },
  );

  await page.goto("/projects/css-property-type-validator");

  await expect(
    page.getByRole("heading", { name: "css-property-type-validator" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "css-property-type-validator project card" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Technologies used").getByText("TypeScript"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { exact: true, name: "Repository" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/schalkneethling/css-property-type-validator",
  );
  await expect(
    page.getByRole("link", { exact: true, name: "Live project" }),
  ).toHaveAttribute("href", "https://typedcss-validator.schalkneethling.com");
  await expect(
    page.getByRole("link", { exact: true, name: "GOAL.md" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/schalkneethling/css-property-type-validator/blob/main/GOAL.md",
  );
  await expect(
    page.getByRole("link", { exact: true, name: "ROADMAP.md" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/schalkneethling/css-property-type-validator/blob/main/ROADMAP.md",
  );
});
