import test, { expect, Page } from "@playwright/test";
import { domElementIds } from "shared";
import { testConfig } from "../../custom.config";
import {
  goToDashboard,
  goToEstablishmentDashboardTab,
} from "../../utils/dashboard";

test.describe.configure({ mode: "serial" });

test.describe("Establishment dashboard workflow", () => {
  test.use({ storageState: testConfig.establishmentAuthFile });
  test.describe("Discussions", () => {
    test("should be able to reject candidate on a discussion", async ({
      page,
    }) => {
      await page.goto("/");
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
      const badgeLocator = await page.locator(
        `#${domElementIds.establishmentDashboard.discussion.statusBadge}`,
      );
      await expect(badgeLocator).toBeVisible();
      await expect(badgeLocator).toHaveClass("fr-badge fr-badge--error");
      await expect(
        await page.locator(".im-exchange-message").all(),
      ).toHaveLength(3);
    });
  });
});

const goToDiscussion = async (page: Page, discussionId: string) => {
  await goToDashboard(page, "establishment");
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
