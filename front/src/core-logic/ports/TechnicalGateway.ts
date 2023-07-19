import { Observable } from "rxjs";
import {
  AbsoluteUrl,
  BackOfficeJwt,
  FeatureFlags,
  SetFeatureFlagParam,
} from "shared";

export interface TechnicalGateway {
  setFeatureFlag: (
    params: SetFeatureFlagParam,
    adminToken: BackOfficeJwt,
  ) => Observable<void>;
  getAllFeatureFlags: () => Observable<FeatureFlags>;
  uploadLogo: (file: File) => Promise<AbsoluteUrl>;
}
