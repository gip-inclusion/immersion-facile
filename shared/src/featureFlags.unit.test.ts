import { makeBooleanFeatureFlag, makeTextFeatureFlag } from "./featureFlags";

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
});
