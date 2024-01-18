import { expect, test } from "@playwright/test";

test.describe("Check for broken links", () => {
  test("Check for links in error", async ({ page }) => {
    await page.goto("/");
    const links = await page.locator(".fr-footer a, .fr-header a").all();
    const linksUrl = (
      await Promise.all(links.map((link) => link.getAttribute("href")))
    ).filter((href) => !href?.toLowerCase().includes("www.linkedin.com"));
    for (const link of linksUrl) {
      if (!link) return;
      const response = await page.request.get(link);
      await expect(response).toBeOK();
    }
  });
});
