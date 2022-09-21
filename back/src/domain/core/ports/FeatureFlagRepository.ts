import type { FeatureFlags, FeatureFlag } from "shared/src/featureFlags";

export interface FeatureFlagRepository {
  getAll: () => Promise<FeatureFlags>;
  set: (params: { flagName: FeatureFlag; value: boolean }) => Promise<void>;
}
