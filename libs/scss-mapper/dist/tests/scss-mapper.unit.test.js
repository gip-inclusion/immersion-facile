import { makeTsFileContent } from "..";
const withoutSpacesAndNewLines = (string) => string.replace(/\s+/g, "").trim();
describe("scss-mapper", () => {
  it("getScssData should map Scss content to JS object", () => {
    const fileContentMapped = makeTsFileContent(
      "im-section-convention-next-steps",
      `${__dirname}/data/test.scss`,
    );
    const expected = `import './test.scss';

    export default {
      root: 'im-section-convention-next-steps',
      col: 'im-section-convention-next-steps__col',
illustration: 'im-section-convention-next-steps__illustration',
illustrationWrapper: 'im-section-convention-next-steps__illustration-wrapper',
illustrationWrapperLeft: 'im-section-convention-next-steps__illustration-wrapper--left',
title: 'im-section-convention-next-steps__title',
selector:'im-section-convention-next-steps-selector'
}`;
    expect(withoutSpacesAndNewLines(fileContentMapped)).toEqual(
      withoutSpacesAndNewLines(expected),
    );
  });
});
