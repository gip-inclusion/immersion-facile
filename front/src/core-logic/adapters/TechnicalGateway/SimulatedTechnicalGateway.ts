import { Observable, of } from "rxjs";
import { AbsoluteUrl, FeatureFlags } from "shared";
import { makeStubFeatureFlags } from "src/core-logic/domain/testHelpers/test.helpers";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";

export class SimulatedTechnicalGateway implements TechnicalGateway {
  public getAllFeatureFlags$ = (): Observable<FeatureFlags> =>
    of(makeStubFeatureFlags());

  // eslint-disable-next-line @typescript-eslint/require-await
  public uploadLogo = async (file: File): Promise<AbsoluteUrl> => {
    // eslint-disable-next-line no-console
    console.log("file uploaded : ", file);
    return `http://${file.name}-url`;
  };
}
