import { FeatureFlags } from "shared/src/featureFlags";

export type GetFeatureFlags = () => Promise<FeatureFlags>;
