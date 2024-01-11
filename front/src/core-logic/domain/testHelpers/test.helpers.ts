import {
  FeatureFlags,
  makeBooleanFeatureFlag,
  makeTextFeatureFlag,
} from "shared";

const defaultFlagsInFront: FeatureFlags = {
  enableInseeApi: makeBooleanFeatureFlag(true),
  enablePeConnectApi: makeBooleanFeatureFlag(true),
  enablePeConventionBroadcast: makeBooleanFeatureFlag(true),
  enableTemporaryOperation: makeBooleanFeatureFlag(false),
  enableMaxContactPerWeek: makeBooleanFeatureFlag(false),
  enableMaintenance: makeTextFeatureFlag(false, {
    message: "My maintenance message",
  }),
};

export const makeStubFeatureFlags = (
  flags: Partial<FeatureFlags> = {},
): FeatureFlags => ({ ...defaultFlagsInFront, ...flags });
