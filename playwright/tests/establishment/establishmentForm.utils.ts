import { type Page, expect } from "@playwright/test";
import { type FormEstablishmentDto, domElementIds } from "shared";

export type MakeFormEstablishmentFromRetryNumber = (
  retryIndex: number,
) => FormEstablishmentDto;

export const checkAvailabilityButtons = async (
  page: Page,
  mode: "edit" | "admin",
  expectedAvailability: "Oui" | "Non",
) => {
  const availibilityRadioButton = page.locator(
    `#${domElementIds.establishment[mode].availabilityButton}-${expectedAvailability === "Oui" ? "1" : "0"}`,
  );
  await expect(availibilityRadioButton).toBeChecked();
};

export const goToNextStep = async (
  page: Page,
  currentStep: 1 | 2 | 3 | 4,
  mode: "create" | "edit",
) => {
  const nextButton = page.locator(
    `#${domElementIds.establishment[mode].nextButtonFromStepAndMode({
      currentStep,
      mode,
    })}`,
  );
  await expect(nextButton).toBeEnabled();
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
