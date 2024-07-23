import {
  FeatureFlags,
  makeBooleanFeatureFlag,
  makeTextFeatureFlag,
  makeTextImageAndRedirectFeatureFlag,
} from "shared";

const defaultFlagsInFront: FeatureFlags = {
  enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(false, {
    imageAlt: "imageAlt",
    imageUrl: "https://imageUrl",
    message: "message",
    redirectUrl: "https://redirectUrl",
    overtitle: "overtitle",
    title: "title",
  }),
  enableMaintenance: makeTextFeatureFlag(false, {
    message: "My maintenance message",
  }),
  enableSearchByScore: makeBooleanFeatureFlag(false),
};

export const makeStubFeatureFlags = (
  flags: Partial<FeatureFlags> = {},
): FeatureFlags => ({ ...defaultFlagsInFront, ...flags });
