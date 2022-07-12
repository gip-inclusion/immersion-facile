import { z } from "zod";

export const featureFlagsSchema: z.Schema<FeatureFlags> = z.object({
  enableAdminUi: z.boolean(),
  enableInseeApi: z.boolean(),
  enablePeConnectApi: z.boolean(),
  enableLogoUpload: z.boolean(),
  enablePeConventionBroadcast: z.boolean(),
});

export const featureFlagsResponseSchema: z.Schema<{ data: FeatureFlags }> =
  z.object({
    data: featureFlagsSchema,
  });

export type FeatureFlags = {
  enableAdminUi: boolean;
  enableInseeApi: boolean;
  enablePeConnectApi: boolean;
  enableLogoUpload: boolean;
  enablePeConventionBroadcast: boolean;
};

const defaultFlags: FeatureFlags = {
  enableAdminUi: true,
  enableInseeApi: true,
  enablePeConnectApi: true,
  enableLogoUpload: false,
  enablePeConventionBroadcast: true,
};

export const makeStubFeatureFlags = (
  customFlags: Partial<FeatureFlags> = {},
): FeatureFlags => ({
  ...defaultFlags,
  ...customFlags,
});

export const makeStubGetFeatureFlags =
  (customFlags: Partial<FeatureFlags> = {}): (() => Promise<FeatureFlags>) =>
  // eslint-disable-next-line @typescript-eslint/require-await
  async () =>
    makeStubFeatureFlags(customFlags);
