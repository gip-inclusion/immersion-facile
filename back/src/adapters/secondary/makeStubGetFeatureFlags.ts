import { GetFeatureFlags } from "../../domain/core/ports/GetFeatureFlags";
import { FeatureFlags } from "../../shared/featureFlags";

const defaultFlags: FeatureFlags = {
  enableAdminUi: true,
  enableByPassInseeApi: false,
  enablePeConnectApi: false,
};

export const makeStubGetFeatureFlags =
  (customFlags: Partial<FeatureFlags> = {}): GetFeatureFlags =>
  async () => ({
    ...defaultFlags,
    ...customFlags,
  });
