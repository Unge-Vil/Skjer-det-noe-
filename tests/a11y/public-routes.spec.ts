import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  { path: "/", name: "forsiden" },
  { path: "/utforsk", name: "utforsk" },
  { path: "/logg-inn", name: "innlogging" },
  { path: "/registrer", name: "registrering" },
  { path: "/tilgjengelighet", name: "tilgjengelighet" },
  { path: "/for-kommuner", name: "for kommuner" },
  { path: "/om", name: "om" },
  { path: "/personvern-og-vilkar", name: "personvern og vilkar" },
];

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    for (const route of routes) {
      test(`${route.name} has no WCAG A/AA axe violations`, async ({ page }) => {
        await page.goto(route.path);
        await page.locator("#main").waitFor();

        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .exclude(".leaflet-container")
          .analyze();

        expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
      });
    }
  });
}