import { Page, expect } from "@playwright/test";
import { SiretDto, domElementIds } from "shared";
import { expectLocatorToBeVisibleAndEnabled } from "../../utils/utils";

export type TestEstablishments = {
  siret: SiretDto;
  expectedAddress: string;
}[];

export const fillEstablishmentFormFirstStep = async (
  page: Page,
  siret: string,
) => {
  await page.goto("/");
  await page.click(`#${domElementIds.home.heroHeader.establishment}`);
  await page.click(
    `#${domElementIds.homeEstablishments.heroHeader.addEstablishmentForm}`,
  );
  await page.fill(
    `#${domElementIds.homeEstablishments.siretModal.siretFetcherInput}`,
    siret,
  );
  const addEstablishmentButton = page.locator(
    `#${domElementIds.establishment.create.startFormButton}`,
  );
  await expectLocatorToBeVisibleAndEnabled(addEstablishmentButton);
  await addEstablishmentButton.click();
};

export const checkAvailibilityButtons = async (
  page: Page,
  mode: "edit" | "admin",
) => {
  const availibilityRadioButton = page.locator(
    `#${domElementIds.establishment[mode].availabilityButton}`,
  );
  await expect(availibilityRadioButton.getByText("Oui")).toBeChecked();
  await expect(availibilityRadioButton.getByText("Non")).not.toBeChecked();
};

export const goToNextStep = async (
  page: Page,
  currentStep: 1 | 2 | 3 | 4,
  mode: "create" | "edit",
) => {
  await page
    .locator(
      `#${domElementIds.establishment[mode].nextButtonFromStepAndMode({
        currentStep,
        mode,
      })}`,
    )
    .click();
};

export const closeModal = async (page: Page) => {
  await page.locator("#siret .fr-btn--close").click();
};
