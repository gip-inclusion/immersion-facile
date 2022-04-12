import { Observable } from "rxjs";
import { FeatureFlags } from "src/shared/featureFlags";

export interface FeatureFlagsGateway {
  getAll: () => Observable<FeatureFlags>;
}
