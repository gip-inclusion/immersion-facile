import { Observable } from "rxjs";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { FeatureFlags } from "shared/src/featureFlags";

export interface TechnicalGateway {
  getAllFeatureFlags: () => Observable<FeatureFlags>;
  uploadLogo: (file: File) => Promise<AbsoluteUrl>;
}
