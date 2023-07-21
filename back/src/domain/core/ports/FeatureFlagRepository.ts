import type { FeatureFlags, SetFeatureFlagParam } from "shared";

export interface FeatureFlagRepository {
  getAll: () => Promise<FeatureFlags>;
  update: (params: SetFeatureFlagParam) => Promise<void>;
  insert: (featureFlags: FeatureFlags) => Promise<void>;
}
