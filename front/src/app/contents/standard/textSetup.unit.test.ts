import { isValidElement } from "react";
import { standardPageSlugs } from "shared";
import { getStandardContents } from "src/app/contents/standard/textSetup";

describe("getStandardContents", () => {
  it.each(standardPageSlugs)("returns rich JSX content for %s", (slug) => {
    const { page } = getStandardContents(slug);

    expect(isValidElement(page.content())).toBe(true);
  });

  it("keeps historical CGU content as rich JSX", () => {
    const { page } = getStandardContents("cgu", "2023-03-17");

    expect(isValidElement(page.content())).toBe(true);
  });
});
