import { Subject } from "rxjs";
import { AbsoluteUrl } from "shared/src/AbsoluteUrl";
import { AdminToken } from "shared/src/admin/admin.dto";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";
import { FeatureFlags, SetFeatureFlagParams } from "shared/src/featureFlags";

export class TestTechnicalGateway implements TechnicalGateway {
  getAllFeatureFlags = () => this.featureFlags$;
  setFeatureFlag = (params: SetFeatureFlagParams, _adminToken: AdminToken) => {
    this.setFeatureFlagLastCalledWith = params;
    return this.setFeatureFlagResponse$;
  };

  // eslint-disable-next-line @typescript-eslint/require-await
  uploadLogo = async (file: File): Promise<AbsoluteUrl> => {
    // eslint-disable-next-line no-console
    console.log("file uploaded : ", file);
    return `http://${file.name}-url`;
  };

  // test purposes only
  public featureFlags$ = new Subject<FeatureFlags>();
  public setFeatureFlagResponse$ = new Subject<void>();
  public setFeatureFlagLastCalledWith: SetFeatureFlagParams | undefined =
    undefined;
}
