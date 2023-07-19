import type { FeatureFlags, SetFeatureFlagParam } from "shared";

export interface FeatureFlagRepository {
  getAll: () => Promise<FeatureFlags>;
  set: (params: SetFeatureFlagParam) => Promise<void>;
}
