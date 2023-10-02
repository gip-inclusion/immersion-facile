import { Subject } from "rxjs";
import { AbsoluteUrl, ConventionSupportedJwt, FeatureFlags } from "shared";
import { TechnicalGateway } from "src/core-logic/ports/TechnicalGateway";

export class TestTechnicalGateway implements TechnicalGateway {
  // test purposes only
  public featureFlags$ = new Subject<FeatureFlags>();

  public getAllFeatureFlags$ = () => this.featureFlags$;

  public htmlToPdf = (
    _htmlContent: string,
    _jwt: ConventionSupportedJwt,
  ): Promise<string> => Promise.resolve(`YWJjZA==`);

  // eslint-disable-next-line @typescript-eslint/require-await
  public uploadLogo = async (file: File): Promise<AbsoluteUrl> => {
    // eslint-disable-next-line no-console
    console.log("file uploaded : ", file);
    return `http://${file.name}-url`;
  };
}
