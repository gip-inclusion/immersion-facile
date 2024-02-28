import type { FeatureFlags, SetFeatureFlagParam } from "shared";

export interface FeatureFlagRepository {
  getAll: () => Promise<FeatureFlags>;
  update: (params: SetFeatureFlagParam) => Promise<void>;
  insertAll: (featureFlags: FeatureFlags) => Promise<void>;
}
