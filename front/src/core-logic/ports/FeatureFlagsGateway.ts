import { Observable } from "rxjs";
import { FeatureFlags } from "shared/src/featureFlags";

export interface FeatureFlagsGateway {
  getAll: () => Observable<FeatureFlags>;
}
