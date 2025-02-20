import { Observable } from "rxjs";
import {
  AbsoluteUrl,
  ConventionSupportedJwt,
  Email,
  FeatureFlags,
  HtmlToPdfRequest,
  ValidateEmailFeedback,
} from "shared";

export interface TechnicalGateway {
  getAllFeatureFlags$(): Observable<FeatureFlags>;
  uploadFile(file: File): Promise<AbsoluteUrl>;
  htmlToPdf(
    params: HtmlToPdfRequest,
    jwt: ConventionSupportedJwt,
  ): Promise<string>;
  getEmailStatus(email: Email): Promise<ValidateEmailFeedback>;
}
