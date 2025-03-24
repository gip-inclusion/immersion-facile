import {
  type Locator,
  type Page,
  type PlaywrightTestArgs,
  type TestInfo,
  expect,
} from "@playwright/test";

export type PlaywrightTestCallback = (
  args: PlaywrightTestArgs,
  info: TestInfo,
) => Promise<void>;

export const phoneRegexp = new RegExp(/[0][1-9][0-9]{8}/);

export const expectElementToBeVisible = async (
  page: Page,
  selector: string,
) => {
  const confirmation = await page.locator(selector).first();
  await confirmation.waitFor();
  await expect(confirmation).toBeVisible();
};

export const fillAutocomplete = async ({
  page,
  locator,
  value,
  endpoint,
}: {
  page: Page;
  locator: string;
  value: string;
  endpoint?: string;
}) => {
  await page.locator(locator).fill(value);
  if (endpoint) {
    await page.waitForResponse(`**${endpoint}**`);
  }
  const listbox = await page.locator(locator);
  await listbox.waitFor();
  const listboxId = await listbox.getAttribute("aria-controls");
  await expect(listboxId).not.toBeNull();
  const firstOption = page
    .locator(
      `#${listboxId} > div:not(.im-select__menu-notice--loading, .im-select__menu-notice--no-options)`,
    )
    .first();
  await firstOption.waitFor();
  await expect(firstOption).toBeVisible();
  await firstOption.click();
};

export const logHttpResponse = ({
  page,
  onlyErrors,
}: {
  page: Page;
  onlyErrors?: boolean;
}) => {
  page.on("response", async (response) => {
    if (
      onlyErrors &&
      response.status() >= 400 &&
      response.url().includes("/api/")
    ) {
      console.info(
        "<<",
        response.request().method(),
        response.status(),
        response.url(),
        (await response.body()).toString(),
      );
    } else if (response.url().includes("/api/")) {
      console.info(
        "<<",
        response.request().method(),
        response.status(),
        response.url(),
        await response.text(),
      );
    }
  });
};

export const expectLocatorToBeVisibleAndEnabled = async (
  locator: Locator,
): Promise<void> => {
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
};

export const expectLocatorToBeReadOnly = async (
  locator: Locator,
): Promise<void> => {
  await expect(locator).toBeVisible();
  await expect(locator).not.toBeEditable();
};
