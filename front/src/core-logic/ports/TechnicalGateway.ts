import { Observable } from "rxjs";
import {
  AbsoluteUrl,
  ConventionSupportedJwt,
  Email,
  FeatureFlags,
  ValidateEmailStatus,
} from "shared";

export interface TechnicalGateway {
  getAllFeatureFlags$(): Observable<FeatureFlags>;
  uploadFile(file: File, renameFileToId: boolean): Promise<AbsoluteUrl>;
  htmlToPdf(htmlContent: string, jwt: ConventionSupportedJwt): Promise<string>;
  getEmailStatus(email: Email): Promise<ValidateEmailStatus>;
}
