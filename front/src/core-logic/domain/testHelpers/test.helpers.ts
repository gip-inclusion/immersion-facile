import {
  FeatureFlags,
  makeBooleanFeatureFlag,
  makeTextImageAndRedirectFeatureFlag,
  makeTextWithSeverityFeatureFlag,
} from "shared";

const defaultFlagsInFront: FeatureFlags = {
  enableTemporaryOperation: makeTextImageAndRedirectFeatureFlag(false, {
    imageAlt: "imageAlt",
    imageUrl: "https://imageUrl",
    message: "message",
    redirectUrl: "https://redirect-url",
    overtitle: "overtitle",
    title: "title",
  }),
  enableMaintenance: makeTextWithSeverityFeatureFlag(false, {
    message: "My maintenance message",
    severity: "warning",
  }),
  enableSearchByScore: makeBooleanFeatureFlag(false),
  enableProConnect: makeBooleanFeatureFlag(false), // si tu veux check le rendu proconnect en in-memory
  enableBroadcastOfConseilDepartementalToFT: makeBooleanFeatureFlag(false),
  enableBroadcastOfCapEmploiToFT: makeBooleanFeatureFlag(false),
  enableBroadcastOfMissionLocaleToFT: makeBooleanFeatureFlag(false),
};

export const makeStubFeatureFlags = (
  flags: Partial<FeatureFlags> = {},
): FeatureFlags => ({ ...defaultFlagsInFront, ...flags });
