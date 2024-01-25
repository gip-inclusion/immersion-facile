import {
  makeBooleanFeatureFlag,
  makeTextFeatureFlag,
  makeTextImageAndRedirectFeatureFlag,
} from "./featureFlags.dto";

describe("feature flag utils tests", () => {
  it("should return a boolean feature flag", () => {
    const flag = makeBooleanFeatureFlag(true);
    expect(flag).toEqual({
      isActive: true,
      kind: "boolean",
      value: undefined,
    });
  });

  it("should return a text feature flag", () => {
    const flag = makeTextFeatureFlag(true, { message: "Maintenance message" });
    expect(flag).toEqual({
      isActive: true,
      kind: "text",
      value: {
        message: "Maintenance message",
      },
    });
  });

  it("should return a textImageAndRedirect feature flag", () => {
    const flag = makeTextImageAndRedirectFeatureFlag(true, {
      message: "yolo",
      imageUrl: "http://image.url",
      redirectUrl: "https://redirect.url",
      imageAlt: "YoloAlt",
      overtitle: "overtitle",
      title: "title",
    });
    expect(flag).toEqual({
      isActive: true,
      kind: "textImageAndRedirect",
      value: {
        message: "yolo",
        imageUrl: "http://image.url",
        redirectUrl: "https://redirect.url",
        imageAlt: "YoloAlt",
        overtitle: "overtitle",
        title: "title",
      },
    });
  });
});
