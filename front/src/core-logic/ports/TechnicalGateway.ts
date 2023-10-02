import { Observable } from "rxjs";
import { AbsoluteUrl, ConventionSupportedJwt, FeatureFlags } from "shared";

export interface TechnicalGateway {
  getAllFeatureFlags$: () => Observable<FeatureFlags>;
  uploadLogo: (file: File) => Promise<AbsoluteUrl>;
  htmlToPdf: (
    htmlContent: string,
    jwt: ConventionSupportedJwt,
  ) => Promise<string>;
}
