import { Observable } from "rxjs";

import {
  AbsoluteUrl,
  BackOfficeJwt,
  FeatureFlags,
  SetFeatureFlagParams,
} from "shared";

export interface TechnicalGateway {
  setFeatureFlag: (
    params: SetFeatureFlagParams,
    adminToken: BackOfficeJwt,
  ) => Observable<void>;
  getAllFeatureFlags: () => Observable<FeatureFlags>;
  uploadLogo: (file: File) => Promise<AbsoluteUrl>;
}
