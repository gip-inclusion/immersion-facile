import test, { expect, type Page } from "@playwright/test";
import { domElementIds } from "shared";
import { testConfig } from "../../custom.config";
import {
  createConventionTemplate,
  deleteConventionTemplate,
  goToDashboard,
  goToEstablishmentDashboardTab,
  initiateConvention,
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
      await expect(page.locator(".im-exchange-message")).toHaveCount(2);
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
      await expect(await badgeLocator.getAttribute("class")).toContain(
        "fr-badge",
      );
      await expect(page.locator(".im-exchange-message")).toHaveCount(3);
    });
  });

  test.describe("Initiate convention", () => {
    test("should initiate from a convention template", async ({ page }) => {
      await createConventionTemplate(page, "establishment");
      await initiateConvention({
        page,
        dashboardKind: "establishment",
        fromConventionTemplate: true,
      });
      await deleteConventionTemplate(page, "establishment");
    });

    test("should initiate from establishment informations", async ({
      page,
    }) => {
      await initiateConvention({
        page,
        dashboardKind: "establishment",
        fromConventionTemplate: false,
      });
    });
  });
});

const goToDiscussion = async (page: Page, discussionId: string) => {
  await goToDashboard(page, "establishment");
  await expectLocatorToBeVisibleAndEnabled(page.locator(".fr-tabs__list"));
  await goToEstablishmentDashboardTab(page, "discussions");
  await page.click(
    `#${domElementIds.establishmentDashboard.manageDiscussion.goToDiscussionButton}--${discussionId}`,
  );
  await expect(page.locator(".im-discussion-meta")).toBeVisible();
};
