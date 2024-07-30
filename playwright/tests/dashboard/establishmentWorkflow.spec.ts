import test, { expect, Page } from "@playwright/test";
import { domElementIds } from "shared";
import { goToEstablishmentDashboardTab } from "../../utils/dashboard";
import { loginWithInclusionConnect } from "../../utils/inclusionConnect";

test.describe.configure({ mode: "serial" });

test.describe("Establishment dashboard workflow", () => {
  test.describe("Discussions", () => {
    test("should be able to reject candidate on a discussion", async ({
      page,
    }) => {
      await goToDiscussion(page, "aaaaaaaa-9c0a-1aaa-aa6d-aaaaaaaaaaaa");
      await expect(
        await page.locator(".im-exchange-message").all(),
      ).toHaveLength(2);
      await page.click(
        `#${domElementIds.establishmentDashboard.discussion.rejectApplicationOpenModal}`,
      );
      await page.selectOption(
        `#${domElementIds.establishmentDashboard.discussion.rejectApplicationJustificationKindInput}`,
        {
          index: 1,
        },
      );
      await page.click(
        `#${domElementIds.establishmentDashboard.discussion.rejectApplicationSubmitPreviewButton}`,
      );
      await page.click(
        `#${domElementIds.establishmentDashboard.discussion.rejectApplicationSubmitButton}`,
      );
      const badgeLocator = page.locator(
        ".im-discussion-meta__item .fr-badge--error",
      );
      await badgeLocator.waitFor({ timeout: 10_000 });
      await expect(badgeLocator).toBeVisible();
      await expect(
        await page.locator(".im-exchange-message").all(),
      ).toHaveLength(3);
    });
  });
});

const goToDiscussion = async (page: Page, discussionId: string) => {
  await page.goto("/");
  await loginWithInclusionConnect(page, "establishmentDashboard");
  await expect(page.locator(".fr-tabs__list")).toBeVisible();
  await goToEstablishmentDashboardTab(page, "discussions");
  await expect(
    page.locator(
      `#${domElementIds.establishmentDashboard.manageDiscussion.discussionIdInput}`,
    ),
  ).toBeVisible();
  await page.fill(
    `#${domElementIds.establishmentDashboard.manageDiscussion.discussionIdInput}`,
    discussionId,
  );
  await page.click(
    `#${domElementIds.establishmentDashboard.manageDiscussion.submitButton}`,
  );
  await expect(page.locator(".im-discussion-meta")).toBeVisible();
};
