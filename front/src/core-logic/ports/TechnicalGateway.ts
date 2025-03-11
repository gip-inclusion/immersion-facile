import type { Observable } from "rxjs";
import type {
  AbsoluteUrl,
  ConnectedUserJwt,
  ConventionSupportedJwt,
  Email,
  FeatureFlags,
  HtmlToPdfRequest,
  ValidateEmailFeedback,
} from "shared";

export interface TechnicalGateway {
  getAllFeatureFlags$(): Observable<FeatureFlags>;
  uploadFile(file: File, jwt: ConnectedUserJwt): Promise<AbsoluteUrl>;
  htmlToPdf(
    params: HtmlToPdfRequest,
    jwt: ConventionSupportedJwt,
  ): Promise<string>;
  getEmailStatus(email: Email): Promise<ValidateEmailFeedback>;
}
