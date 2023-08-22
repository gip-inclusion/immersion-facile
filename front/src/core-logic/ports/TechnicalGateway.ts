import { Observable } from "rxjs";
import { AbsoluteUrl, FeatureFlags } from "shared";

export interface TechnicalGateway {
  getAllFeatureFlags$: () => Observable<FeatureFlags>;
  uploadLogo: (file: File) => Promise<AbsoluteUrl>;
}
