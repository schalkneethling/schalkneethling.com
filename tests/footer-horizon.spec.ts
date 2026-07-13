import { expect, test } from "@playwright/test";

test("winter horizon loads as it approaches the viewport", async ({ page }) => {
  await page.goto("/");

  const horizon = page.locator("[data-winter-horizon]");
  await expect(horizon).not.toHaveAttribute("data-loaded", "true");
  await expect(horizon.locator(".winter-scene")).toHaveCount(0);

  await page.locator("footer.page-footer").scrollIntoViewIfNeeded();

  await expect(horizon).toHaveAttribute("data-loaded", "true");
  await expect(horizon.locator(".winter-scene")).toHaveCount(2);
});

test("winter horizon remains static when reduced motion is requested", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("footer.page-footer").scrollIntoViewIfNeeded();

  const horizon = page.locator("[data-winter-horizon]");
  await expect(horizon).toHaveAttribute("data-loaded", "true");
  await expect(horizon).not.toHaveAttribute("data-motion", "ready");
  await expect(horizon.locator(".winter-scene--day img")).toHaveCSS(
    "animation-name",
    "none",
  );
});

test("winter horizon keeps its focal scene across responsive widths", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("footer.page-footer").scrollIntoViewIfNeeded();

  const horizon = page.locator("[data-winter-horizon]");
  await expect(horizon.locator(".winter-scene--day img")).toBeVisible();

  for (const width of [390, 768, 1440, 2048]) {
    await page.setViewportSize({ width, height: 900 });

    const layout = await page.evaluate(() => {
      const stage = document.querySelector("[data-winter-horizon]")?.getBoundingClientRect();
      const image = document
        .querySelector(".winter-scene--day img")
        ?.getBoundingClientRect();
      return {
        image,
        overflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
        stage,
      };
    });

    expect(layout.overflow).toBe(false);
    expect(layout.stage).toBeTruthy();
    expect(layout.image).toBeTruthy();
    expect(layout.image!.left).toBeCloseTo(layout.stage!.left, 0);
    expect(layout.image!.right).toBeCloseTo(layout.stage!.right, 0);
    expect(layout.image!.bottom).toBeCloseTo(layout.stage!.bottom, 0);
    expect(layout.image!.width / layout.image!.height).toBeCloseTo(1.5, 2);

    if (width >= 768) {
      expect(layout.stage!.height).toBeLessThanOrEqual(layout.image!.height);
      expect(layout.image!.top).toBeLessThanOrEqual(layout.stage!.top);
      expect(layout.stage!.top - layout.image!.top).toBeLessThanOrEqual(
        layout.image!.height * 0.15,
      );
    } else {
      expect(layout.image!.top).toBeCloseTo(layout.stage!.top, 0);
    }
  }
});

test("winter scene stays full-width while anchoring the diorama on ultrawide screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 2048, height: 900 });
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto("/posts/you-might-not-need-chalk-anymore/");
  await page.locator("footer.page-footer").scrollIntoViewIfNeeded();

  const horizon = page.locator("[data-winter-horizon]");
  await expect(horizon).toHaveAttribute("data-loaded", "true");

  const hostBox = await horizon.boundingBox();
  const backdrop = horizon.locator(".winter-scene--day img");
  const backdropStart = await backdrop.boundingBox();

  expect(hostBox).not.toBeNull();
  expect(backdropStart).not.toBeNull();
  expect(hostBox!.width).toBeCloseTo(2048, 0);
  expect(backdropStart!.width).toBeCloseTo(hostBox!.width, 0);
  expect(backdropStart!.y + backdropStart!.height).toBeCloseTo(
    hostBox!.y + hostBox!.height,
    0,
  );
  expect(backdropStart!.y).toBeLessThan(hostBox!.y);

  await page.waitForTimeout(500);
  const backdropLater = await backdrop.boundingBox();
  expect(backdropLater).not.toBeNull();
  expect(backdropLater!.y).toBeCloseTo(backdropStart!.y, 0);
});

test("winter horizon reserves its own space below article content", async ({
  page,
}) => {
  await page.goto("/posts/you-might-not-need-chalk-anymore/");

  const layout = await page.evaluate(() => {
    const main = document.querySelector("main");
    const horizon = document.querySelector("[data-winter-horizon]");
    if (!main || !horizon) return null;

    const mainRect = main.getBoundingClientRect();
    const horizonRect = horizon.getBoundingClientRect();
    return { horizonTop: horizonRect.top, mainBottom: mainRect.bottom };
  });

  expect(layout).not.toBeNull();
  expect(layout!.horizonTop).toBeGreaterThanOrEqual(layout!.mainBottom);
});

test("small screens keep the horizon before the social footer panel", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const horizon = page.locator("[data-winter-horizon]");
  const footerPanel = page.locator(".footer-panel");
  const horizonBox = await horizon.boundingBox();
  const footerPanelBox = await footerPanel.boundingBox();

  expect(horizonBox).not.toBeNull();
  expect(footerPanelBox).not.toBeNull();
  expect(horizonBox!.y + horizonBox!.height).toBeLessThanOrEqual(
    footerPanelBox!.y,
  );
});

test("winter horizon stays rendered after its one-time lazy load", async ({
  page,
}) => {
  await page.goto("/");

  const horizon = page.locator("[data-winter-horizon]");
  await expect(horizon).not.toHaveAttribute("data-loaded", "true");

  await page.locator("footer.page-footer").scrollIntoViewIfNeeded();

  await expect(horizon).toHaveAttribute("data-loaded", "true");
  await expect(horizon.locator(".winter-scene")).toHaveCount(2);

  await page.locator("header.page-header").scrollIntoViewIfNeeded();

  await expect(horizon).toHaveAttribute("data-loaded", "true");
  await expect(horizon.locator(".winter-scene")).toHaveCount(2);
});

test("winter horizon reacts to theme changes without being recreated", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto("/");
  await page.locator("footer.page-footer").scrollIntoViewIfNeeded();

  const horizon = page.locator("[data-winter-horizon]");
  const scenes = horizon.locator(".winter-scene");
  const dayScene = horizon.locator(".winter-scene--day");
  const nightScene = horizon.locator(".winter-scene--night");
  await expect(scenes).toHaveCount(2);
  await expect(dayScene).toHaveCSS("display", "block");
  await expect(nightScene).toHaveCSS("display", "none");

  await page.getByRole("radio", { name: "Dark" }).check();

  await expect(dayScene).toHaveCSS("display", "none");
  await expect(nightScene).toHaveCSS("display", "block");
  await expect(scenes).toHaveCount(2);
});
