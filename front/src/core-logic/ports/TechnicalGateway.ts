import { Observable } from "rxjs";
import {
  AbsoluteUrl,
  AdminToken,
  FeatureFlags,
  SetFeatureFlagParams,
} from "shared";

export interface TechnicalGateway {
  setFeatureFlag: (
    params: SetFeatureFlagParams,
    adminToken: AdminToken,
  ) => Observable<void>;
  getAllFeatureFlags: () => Observable<FeatureFlags>;
  uploadLogo: (file: File) => Promise<AbsoluteUrl>;
}
