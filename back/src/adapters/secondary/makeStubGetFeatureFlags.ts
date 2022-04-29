import { GetFeatureFlags } from "../../domain/core/ports/GetFeatureFlags";
import { FeatureFlags } from "shared/src/featureFlags";

const defaultFlags: FeatureFlags = {
  enableAdminUi: true,
  enableInseeApi: true,
  enablePeConnectApi: false,
};

export const makeStubGetFeatureFlags =
  (customFlags: Partial<FeatureFlags> = {}): GetFeatureFlags =>
  async () => ({
    ...defaultFlags,
    ...customFlags,
  });
