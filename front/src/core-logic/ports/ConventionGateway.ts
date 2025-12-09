import type { Observable } from "rxjs";
import type {
  ApiConsumerName,
  ConnectedUserJwt,
  ConventionDto,
  ConventionId,
  ConventionJwt,
  ConventionLastBroadcastFeedbackResponse,
  ConventionReadDto,
  ConventionSupportedJwt,
  DashboardUrlAndName,
  DataWithPagination,
  DiscussionId,
  EditConventionCounsellorNameRequestDto,
  FindSimilarConventionsParams,
  FlatGetConventionsForAgencyUserParams,
  FlatGetConventionsWithErroredBroadcastFeedbackParams,
  MarkPartnersErroredConventionAsHandledRequest,
  RenewConventionParams,
  RenewMagicLinkRequestDto,
  SendSignatureLinkRequestDto,
  ShareLinkByEmailDto,
  TransferConventionToAgencyRequestDto,
  UpdateConventionStatusRequestDto,
  WithConventionId,
} from "shared";
import type { ConventionWithBroadcastFeedback } from "../../../../shared/src/convention/conventionWithBroadcastFeedback.dto";
import type { FetchConventionRequestedPayload } from "../domain/convention/convention.slice";

export interface ConventionGateway {
  retrieveFromToken$(
    payload: FetchConventionRequestedPayload,
  ): Observable<ConventionReadDto | undefined>;
  getConventionStatusDashboardUrl$(
    conventionId: ConventionId,
    jwt: string,
  ): Observable<DashboardUrlAndName>;

  createConvention$(params: {
    convention: ConventionDto;
    discussionId?: DiscussionId;
  }): Observable<void>;
  getApiConsumersByConvention$(
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
    jwt: ConventionJwt | ConnectedUserJwt,
  ): Observable<void>;
  shareConventionLinkByEmail(
    shareLinkByEmailDto: ShareLinkByEmailDto,
  ): Promise<boolean>;
  sendSignatureLink$(
    params: SendSignatureLinkRequestDto,
    jwt: ConventionSupportedJwt,
  ): Observable<void>;
  renewMagicLink(
    renewMagicLinkRequestDto: RenewMagicLinkRequestDto,
  ): Promise<void>;
  renewConvention$(
    params: RenewConventionParams,
    jwt: ConventionSupportedJwt,
  ): Observable<void>;
  broadcastConventionAgain$(
    params: WithConventionId,
    jwt: ConnectedUserJwt,
  ): Observable<void>;
  transferConventionToAgency$(
    params: TransferConventionToAgencyRequestDto,
    jwt: ConventionSupportedJwt,
  ): Observable<void>;
  editConventionCounsellorName$(
    params: EditConventionCounsellorNameRequestDto,
    jwt: ConventionSupportedJwt,
  ): Observable<void>;
  markPartnersErroredConventionAsHandled$(
    params: MarkPartnersErroredConventionAsHandledRequest,
    jwt: ConventionSupportedJwt,
  ): Observable<void>;
  getConventionsForUser$(
    params: FlatGetConventionsForAgencyUserParams,
    jwt: string,
  ): Observable<DataWithPagination<ConventionReadDto>>;
  getConventionLastBroadcastFeedback$(
    conventionId: ConventionId,
    jwt: ConventionSupportedJwt,
  ): Observable<ConventionLastBroadcastFeedbackResponse>;
  getConventionsWithErroredBroadcastFeedback$(
    params: FlatGetConventionsWithErroredBroadcastFeedbackParams,
    jwt: string,
  ): Observable<DataWithPagination<ConventionWithBroadcastFeedback>>;
}
