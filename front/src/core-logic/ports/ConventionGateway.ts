import { Observable } from "rxjs";
import {
  AbsoluteUrl,
  ConventionDto,
  ConventionId,
  ConventionReadDto,
  ConventionSupportedJwt,
  ShareLinkByEmailDto,
  UpdateConventionStatusRequestDto,
} from "shared";
import { FetchConventionRequestedPayload } from "../domain/convention/convention.slice";

export interface ConventionGateway {
  retrieveFromToken$(
    payload: FetchConventionRequestedPayload,
  ): Observable<ConventionReadDto | undefined>;
  getConventionStatusDashboardUrl$(jwt: string): Observable<AbsoluteUrl>;

  createConvention$(conventionDto: ConventionDto): Observable<void>;
  updateConvention$(
    conventionDto: ConventionDto,
    jwt: string,
  ): Observable<void>;
  updateConventionStatus$(
    params: UpdateConventionStatusRequestDto,
    conventionId: ConventionId,
    jwt: ConventionSupportedJwt,
  ): Observable<void>;
  signConvention$(jwt: string): Observable<void>;
  shareConventionLinkByEmail(
    shareLinkByEmailDto: ShareLinkByEmailDto,
  ): Promise<boolean>;
  renewMagicLink(expiredJwt: string, originalUrl: string): Promise<void>;
}
