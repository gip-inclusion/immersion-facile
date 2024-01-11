import { Observable } from "rxjs";
import {
  AbsoluteUrl,
  ConventionSupportedJwt,
  Email,
  FeatureFlags,
  ValidateEmailStatus,
} from "shared";

export interface TechnicalGateway {
  getAllFeatureFlags$: () => Observable<FeatureFlags>;
  uploadAnyFile: (file: File) => Promise<AbsoluteUrl>;
  uploadLogo: (file: File) => Promise<AbsoluteUrl>;
  htmlToPdf: (
    htmlContent: string,
    jwt: ConventionSupportedJwt,
  ) => Promise<string>;
  getEmailStatus(email: Email): Promise<ValidateEmailStatus>;
}
