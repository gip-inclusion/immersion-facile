import { Observable } from "rxjs";
import { FeatureFlags } from "shared/src/featureFlags";

export interface TechnicalGateway {
  getAllFeatureFlags: () => Observable<FeatureFlags>;
  uploadFile: (file: File) => Promise<void>;
}
