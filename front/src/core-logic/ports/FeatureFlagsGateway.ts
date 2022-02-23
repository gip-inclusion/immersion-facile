import { FeatureFlags } from "src/shared/featureFlags";

export interface FeatureFlagsGateway {
  getAll: () => Promise<FeatureFlags>;
}
