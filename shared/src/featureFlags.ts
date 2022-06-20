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
