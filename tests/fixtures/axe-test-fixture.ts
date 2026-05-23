import { test as base } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

type AxeTestFixture = {
  makeAxeBuilder: () => AxeBuilder;
};

export const test = base.extend<AxeTestFixture>({
  makeAxeBuilder: async (
    { page },
    use: (r: () => AxeBuilder) => Promise<void>,
  ) => {
    const makeAxeBuilder = () =>
      new AxeBuilder({ page })
        .options({ reporter: "v2" })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
    await use(makeAxeBuilder);
  },
});

export { expect } from "@playwright/test";
