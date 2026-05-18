import type { FeatureFlags } from "shared";
import type { WithCache } from "../../caching-gateway/port/WithCache";
import type { FeatureFlagQueries } from "../ports/FeatureFlagQueries";

const featureFlagsCacheDurationInHours = 2 / 60;
const featureFlagsCacheKeyParam = "all";
const featureFlagsCacheKey = "feature_flags_get_all_v1";

export const makeCachedFeatureFlagQueries = ({
  featureFlagQueries,
  withCache,
}: {
  featureFlagQueries: FeatureFlagQueries;
  withCache: WithCache;
}): FeatureFlagQueries => {
  const getAllWithCache = withCache<
    FeatureFlags,
    typeof featureFlagsCacheKeyParam
  >({
    overrideCacheDurationInHours: featureFlagsCacheDurationInHours,
    getCacheKey: () => featureFlagsCacheKey,
    cb: () => featureFlagQueries.getAll(),
  });

  return {
    getAll: () => getAllWithCache(featureFlagsCacheKeyParam),
  };
};
