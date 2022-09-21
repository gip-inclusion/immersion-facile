import { z } from "zod";

export type FeatureFlag =
  | "enableAdminUi"
  | "enableInseeApi"
  | "enablePeConnectApi"
  | "enableLogoUpload"
  | "enablePeConventionBroadcast";

export type FeatureFlags = Record<FeatureFlag, boolean>;

export const featureFlagsSchema: z.Schema<FeatureFlags> = z.object({
  enableAdminUi: z.boolean(),
  enableInseeApi: z.boolean(),
  enablePeConnectApi: z.boolean(),
  enableLogoUpload: z.boolean(),
  enablePeConventionBroadcast: z.boolean(),
});
