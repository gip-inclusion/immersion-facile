import type { FeatureFlags } from "shared";

export interface FeatureFlagQueries {
  getAll: () => Promise<FeatureFlags>;
}
