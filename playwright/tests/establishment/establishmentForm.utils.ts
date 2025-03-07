import { Page, expect } from "@playwright/test";
import { SiretDto, domElementIds } from "shared";

export type TestEstablishments = {
  siret: SiretDto;
  expectedAddress: string;
}[];

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
