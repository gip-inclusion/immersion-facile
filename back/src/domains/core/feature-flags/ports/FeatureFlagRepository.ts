import type { FeatureFlags, SetFeatureFlagParam } from "shared";

export interface FeatureFlagRepository {
  update: (params: SetFeatureFlagParam) => Promise<void>;
  insertAll: (featureFlags: FeatureFlags) => Promise<void>;
}
