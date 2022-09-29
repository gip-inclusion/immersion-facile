import type { FeatureFlag, FeatureFlags } from "shared";

export interface FeatureFlagRepository {
  getAll: () => Promise<FeatureFlags>;
  set: (params: { flagName: FeatureFlag; value: boolean }) => Promise<void>;
}
