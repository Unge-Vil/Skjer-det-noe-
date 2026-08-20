import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const email = process.env.A11Y_ADMIN_EMAIL;
const password = process.env.A11Y_ADMIN_PASSWORD;
const route = process.env.A11Y_ADMIN_ROUTE ?? "/admin";

test.describe("authenticated admin route", () => {
  test.skip(!email || !password, "Set A11Y_ADMIN_EMAIL and A11Y_ADMIN_PASSWORD to run admin accessibility checks.");

  test("has no WCAG A/AA axe violations", async ({ page }) => {
    await page.goto("/logg-inn");
    await page.locator("#email").fill(email!);
    await page.locator("#password").fill(password!);
    await page.locator("button[type='submit']").click();
    await expect(page).toHaveURL(/\/admin/);

    await page.goto(route);
    await page.locator("#main").waitFor();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
});