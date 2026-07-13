import { expect, test } from "@playwright/test";

test("theme switch defaults to the system theme and supports explicit overrides", async ({ page }) => {
  await page.goto("/");

  const themeGroup = page.getByRole("radiogroup", { name: "Colour theme" });
  const systemTheme = page.getByRole("radio", { name: "System" });
  await expect(themeGroup).toBeVisible();
  await expect(systemTheme).toBeChecked();
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBeNull();

  await page.reload();

  await page.addInitScript(() => {
    localStorage.setItem("theme", "light");
  });
  await page.goto("/");

  const lightTheme = page.getByRole("radio", { name: "Light" });
  const darkTheme = page.getByRole("radio", { name: "Dark" });
  await expect(lightTheme).toBeChecked();
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await darkTheme.check();

  await expect(darkTheme).toBeChecked();
  await expect(page.locator("html")).toHaveClass(/dark/);
  const storedTheme = await page.evaluate(() => localStorage.getItem("theme"));
  expect(storedTheme).toBe("dark");

  await systemTheme.check();

  await expect(systemTheme).toBeChecked();
  const restoredTheme = await page.evaluate(() => localStorage.getItem("theme"));
  expect(restoredTheme).toBeNull();
});
