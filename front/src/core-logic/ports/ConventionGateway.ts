import { Observable } from "rxjs";
import {
  ApiConsumerName,
  ConventionDto,
  ConventionId,
  ConventionJwt,
  ConventionReadDto,
  ConventionSupportedJwt,
  DashboardUrlAndName,
  DiscussionId,
  FindSimilarConventionsParams,
  InclusionConnectJwt,
  RenewConventionParams,
  ShareLinkByEmailDto,
  UpdateConventionStatusRequestDto,
  WithConventionId,
} from "shared";
import { FetchConventionRequestedPayload } from "../domain/convention/convention.slice";

export interface ConventionGateway {
  retrieveFromToken$(
    payload: FetchConventionRequestedPayload,
  ): Observable<ConventionReadDto | undefined>;
  getConventionStatusDashboardUrl$(
    jwt: string,
  ): Observable<DashboardUrlAndName>;

  createConvention$(params: {
    convention: ConventionDto;
    discussionId?: DiscussionId;
  }): Observable<void>;
  getApiConsumersByconvention$(
    params: {
      conventionId: ConventionId;
    },
    jwt: string,
  ): Observable<ApiConsumerName[]>;
  getSimilarConventions$(
    findSimilarConventionsParams: FindSimilarConventionsParams,
  ): Observable<ConventionId[]>;
  updateConvention$(
    conventionDto: ConventionDto,
    jwt: string,
  ): Observable<void>;
  updateConventionStatus$(
    params: UpdateConventionStatusRequestDto,
    jwt: ConventionSupportedJwt,
  ): Observable<void>;
  signConvention$(
    conventionId: ConventionId,
    jwt: ConventionJwt | InclusionConnectJwt,
  ): Observable<void>;
  shareConventionLinkByEmail(
    shareLinkByEmailDto: ShareLinkByEmailDto,
  ): Promise<boolean>;
  renewMagicLink(expiredJwt: string, originalUrl: string): Promise<void>;
  renewConvention$(
    params: RenewConventionParams,
    jwt: ConventionSupportedJwt,
  ): Observable<void>;
  broadcastConventionAgain$(
    params: WithConventionId,
    jwt: InclusionConnectJwt,
  ): Observable<void>;
}
