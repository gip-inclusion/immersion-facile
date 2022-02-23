import { GetFeatureFlags } from "../../domain/core/ports/GetFeatureFlags";
import { FeatureFlags } from "../../shared/featureFlags";

const defaultFlags: FeatureFlags = {
  enableAdminUi: true,
  enableByPassInseeApi: false,
};

export const makeStubGetFeatureFlags =
  (customFlags: Partial<FeatureFlags> = {}): GetFeatureFlags =>
  async () => ({
    ...defaultFlags,
    ...customFlags,
  });
