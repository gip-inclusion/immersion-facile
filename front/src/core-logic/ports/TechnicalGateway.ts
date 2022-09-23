import { Observable } from "rxjs";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { AdminToken } from "shared/src/admin/admin.dto";
import { FeatureFlags, SetFeatureFlagParams } from "shared/src/featureFlags";

export interface TechnicalGateway {
  setFeatureFlag: (
    params: SetFeatureFlagParams,
    adminToken: AdminToken,
  ) => Observable<void>;
  getAllFeatureFlags: () => Observable<FeatureFlags>;
  uploadLogo: (file: File) => Promise<AbsoluteUrl>;
}
