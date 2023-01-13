import { z } from "zod";

export type FeatureFlag = typeof featureFlags[number];
const featureFlags = [
  "enableAdminUi",
  "enableInseeApi",
  "enablePeConnectApi",
  "enableLogoUpload",
  "enablePeConventionBroadcast",
  "enableTemporaryOperation",
] as const;

export type FeatureFlags = Record<FeatureFlag, boolean>;

export const featureFlagsSchema: z.Schema<FeatureFlags> = z.object({
  enableAdminUi: z.boolean(),
  enableInseeApi: z.boolean(),
  enablePeConnectApi: z.boolean(),
  enableLogoUpload: z.boolean(),
  enablePeConventionBroadcast: z.boolean(),
  enableTemporaryOperation: z.boolean(),
});

export type SetFeatureFlagParams = { flagName: FeatureFlag; value: boolean };

export const setFeatureFlagSchema: z.Schema<SetFeatureFlagParams> = z.object({
  flagName: z.enum(featureFlags),
  value: z.boolean(),
});
