import test, { expect, type Page } from "@playwright/test";
import { domElementIds } from "shared";
import { testConfig } from "../../custom.config";
import {
  goToDashboard,
  goToEstablishmentDashboardTab,
} from "../../utils/dashboard";
import { expectLocatorToBeVisibleAndEnabled } from "../../utils/utils";

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
        `#${domElementIds.establishmentDashboard.discussion.handleDiscussionButton}`,
      );

      page.click(
        `#${domElementIds.establishmentDashboard.discussion.rejectDiscussionOpenModalButton}`,
      );

      await page
        .locator(
          `[for=${domElementIds.establishmentDashboard.discussion.rejectDiscussionIsCandidateWarned}-1]`,
        )
        .click();

      await page.selectOption(
        `#${domElementIds.establishmentDashboard.discussion.rejectDiscussionJustificationKindInput}`,
        {
          index: 1,
        },
      );
      await page.click(
        `#${domElementIds.establishmentDashboard.discussion.rejectDiscussionSubmitPreviewButton}`,
      );
      await page.click(
        `#${domElementIds.establishmentDashboard.discussion.rejectDiscussionSubmitButton}`,
      );
      const badgeLocator = await page.locator(
        `#${domElementIds.establishmentDashboard.discussion.statusBadge}`,
      );
      await expect(badgeLocator).toBeVisible();
      await expect(badgeLocator).toHaveClass("fr-badge");
      await expect(
        await page.locator(".im-exchange-message").all(),
      ).toHaveLength(3);
    });
  });
});

const goToDiscussion = async (page: Page, discussionId: string) => {
  await goToDashboard(page, "establishment");
  await expectLocatorToBeVisibleAndEnabled(page.locator(".fr-tabs__list"));
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
