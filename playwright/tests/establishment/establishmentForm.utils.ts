import { expect, type Page } from "@playwright/test";
import { domElementIds, type FormEstablishmentDto } from "shared";
import { waitForVisibleLoaderHidden } from "../../utils/utils";

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
  await waitForVisibleLoaderHidden(page, ".im-loader__overlay");

  const nextButton = page.locator(
    `#${domElementIds.establishment[mode].nextButtonFromStepAndMode({
      currentStep,
      mode,
    })}`,
  );
  await expect(nextButton).toBeEnabled();
  await nextButton.click();
};

export const closeModal = async (page: Page) => {
  await page.locator("#siret .fr-btn--close").click();
};
