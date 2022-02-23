import { FeatureFlags } from "../../../shared/featureFlags";

export type GetFeatureFlags = () => Promise<FeatureFlags>;
