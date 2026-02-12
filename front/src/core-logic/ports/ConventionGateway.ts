import type { Observable } from "rxjs";
import type {
  ApiConsumerName,
  ConnectedUserJwt,
  ConventionDraftDto,
  ConventionDraftId,
  ConventionDto,
  ConventionId,
  ConventionJwt,
  ConventionLastBroadcastFeedbackResponse,
  ConventionReadDto,
  ConventionSupportedJwt,
  ConventionTemplate,
  ConventionTemplateId,
  DashboardUrlAndName,
  DataWithPagination,
  DiscussionId,
  EditBeneficiaryBirthdateRequestDto,
  EditConventionCounsellorNameRequestDto,
  FindSimilarConventionsParams,
  FlatGetConventionsForAgencyUserParams,
  FlatGetConventionsWithErroredBroadcastFeedbackParams,
  MarkPartnersErroredConventionAsHandledRequest,
  RenewConventionParams,
  SendSignatureLinkRequestDto,
  ShareConventionDraftByEmailDto,
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
  shareConventionDraftByEmail(
    shareDraftByEmailDto: ShareConventionDraftByEmailDto,
  ): Observable<void>;
  sendSignatureLink$(
    params: SendSignatureLinkRequestDto,
    jwt: ConventionSupportedJwt,
  ): Observable<void>;

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
  editBeneficiaryBirthdate$(
    params: EditBeneficiaryBirthdateRequestDto,
    jwt: ConnectedUserJwt,
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
  getConventionDraftById$(
    conventionDraftId: ConventionDraftId,
  ): Observable<ConventionDraftDto | undefined>;
  createOrUpdateConventionTemplate$(
    conventionTemplate: ConventionTemplate,
    jwt: string,
  ): Observable<void>;
  getConventionTemplatesForCurrentUser$(
    jwt: string,
  ): Observable<ConventionTemplate[]>;
  deleteConventionTemplate$(
    conventionTemplateId: ConventionTemplateId,
    jwt: string,
  ): Observable<void>;
}
