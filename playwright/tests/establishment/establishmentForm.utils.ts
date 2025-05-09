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
    `#${domElementIds.establishment[mode].availabilityButton}`,
  );
  await expect(
    availibilityRadioButton.getByText(expectedAvailability),
  ).toBeChecked();
  await expect(
    availibilityRadioButton.getByText(
      expectedAvailability === "Oui" ? "Non" : "Oui",
    ),
  ).not.toBeChecked();
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
