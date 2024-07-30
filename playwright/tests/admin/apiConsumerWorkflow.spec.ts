import { Page, expect, test } from "@playwright/test";
import { domElementIds } from "shared";
import { goToAdminTab } from "../../utils/admin";

test.describe("Api Consumer Workflow", () => {
  test("Can add an api consumer", async ({ page }) => {
    await goToAdminTab(page, "technical-options");
    await page
      .locator(
        `#${domElementIds.admin.technicalOptionsTab.addApiConsumerButton}`,
      )
      .click();
    await expect(
      page.locator(
        `#${domElementIds.admin.technicalOptionsTab.apiConsumerModal}`,
      ),
    ).toBeVisible();
    await page
      .locator(
        `#${domElementIds.admin.technicalOptionsTab.apiConsumerNameInput}`,
      )
      .fill("apiConsumerName");
    await page
      .locator(
        `#${domElementIds.admin.technicalOptionsTab.apiConsumerContactLastNameInput}`,
      )
      .fill("apiConsumerContactLastName");
    await page
      .locator(
        `#${domElementIds.admin.technicalOptionsTab.apiConsumerContactFirstNameInput}`,
      )
      .fill("apiConsumerContactFirstName");
    await page
      .locator(
        `#${domElementIds.admin.technicalOptionsTab.apiConsumerContactJobInput}`,
      )
      .fill("apiConsumerContactJob");
    await page
      .locator(
        `#${domElementIds.admin.technicalOptionsTab.apiConsumerContactPhoneInput}`,
      )
      .fill("0587548754");
    await page
      .locator(
        `#${domElementIds.admin.technicalOptionsTab.apiConsumerContactEmailsInput}`,
      )
      .fill("api-consumer@fake.com");
    await page
      .locator(
        `#${domElementIds.admin.technicalOptionsTab.apiConsumerDescriptionInput}`,
      )
      .fill("Fake description");
    await page
      .locator(
        `[for=${domElementIds.admin.technicalOptionsTab.apiConsumerRightInput({
          rightName: "searchEstablishment",
        })}-0]`,
      )
      .click();
    await page
      .locator(
        `[for=${domElementIds.admin.technicalOptionsTab.apiConsumerRightInput({
          rightName: "convention",
        })}-0]`,
      )
      .click();

    await page
      .locator(
        `#${domElementIds.admin.technicalOptionsTab.apiConsumerConventionScopeAgencyKindsInput}`,
      )
      .selectOption({
        index: 2,
      });

    await page
      .locator(
        `#${domElementIds.admin.technicalOptionsTab.apiConsumerSubmitButton}`,
      )
      .click();
    await expect(
      page.locator(
        `#${domElementIds.admin.technicalOptionsTab.apiConsumerModal} .fr-alert--success`,
      ),
    ).toBeVisible();
  });
  test("Can edit an api consumer and check that modal returns to initial state", async ({
    page,
  }) => {
    await goToAdminTab(page, "technical-options");
    const editApiConsumerButtonLocator = page.locator(
      `[id^=${domElementIds.admin.technicalOptionsTab.editApiConsumerButton({
        apiConsumerId: "",
      })}]`,
    );
    await editApiConsumerButtonLocator.waitFor({ timeout: 3_000 });
    await editApiConsumerButtonLocator.first().click();

    await page
      .locator(
        `#${domElementIds.admin.technicalOptionsTab.apiConsumerContactFirstNameInput}`,
      )
      .fill("editedFirstName");
    await page
      .locator(
        `#${domElementIds.admin.technicalOptionsTab.apiConsumerSubmitButton}`,
      )
      .click();
    await expect(
      page.locator(
        `#${domElementIds.admin.technicalOptionsTab.apiConsumerModal} .fr-alert--success`,
      ),
    ).toBeVisible();
    await closeApiConsumerModal(page);
    await page
      .locator(
        `#${domElementIds.admin.technicalOptionsTab.addApiConsumerButton}`,
      )
      .click();
    await expect(
      page.locator(
        `#${domElementIds.admin.technicalOptionsTab.apiConsumerModal} .fr-alert--success`,
      ),
    ).not.toBeVisible();
    await closeApiConsumerModal(page);
    await page
      .locator(
        `[id^=${domElementIds.admin.technicalOptionsTab.editApiConsumerButton({
          apiConsumerId: "",
        })}]`,
      )
      .first()
      .click();
    await expect(
      page.locator(
        `#${domElementIds.admin.technicalOptionsTab.apiConsumerModal} .fr-alert--success`,
      ),
    ).not.toBeVisible();
  });
});

const closeApiConsumerModal = async (page: Page) => {
  await page
    .locator(
      `#${domElementIds.admin.technicalOptionsTab.apiConsumerModal} .fr-btn--close`,
    )
    .click();
};
