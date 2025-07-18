import type { Observable } from "rxjs";
import type {
  ConnectedUserJwt,
  ConventionSupportedJwt,
  DataWithPagination,
  DiscussionExchangeForbiddenParams,
  DiscussionInList,
  DiscussionReadDto,
  EstablishmentNameAndAdmins,
  ExchangeRead,
  FormEstablishmentDto,
  SendMessageToDiscussionFromDashboardRequestPayload,
  SiretDto,
  WithDiscussionStatus,
} from "shared";
import type {
  FetchDiscussionListRequestedPayload,
  FetchDiscussionRequestedPayload,
} from "../domain/discussion/discussion.slice";

export interface EstablishmentGateway {
  deleteEstablishment$(
    siret: SiretDto,
    jwt: ConnectedUserJwt,
  ): Observable<void>;
  addFormEstablishment$(
    establishment: FormEstablishmentDto,
    jwt: ConnectedUserJwt,
  ): Observable<void>;
  getFormEstablishmentFromJwt$(
    siret: SiretDto,
    jwt: ConnectedUserJwt,
  ): Observable<FormEstablishmentDto>;
  updateFormEstablishment$(
    establishment: FormEstablishmentDto,
    jwt: ConnectedUserJwt,
  ): Observable<void>;
  getEstablishmentNameAndAdmins$(
    siret: SiretDto,
    jwt: ConnectedUserJwt,
  ): Observable<EstablishmentNameAndAdmins>;
  getDiscussionById$(
    payload: FetchDiscussionRequestedPayload,
  ): Observable<DiscussionReadDto | undefined>;
  sendMessage$(
    payload: SendMessageToDiscussionFromDashboardRequestPayload,
  ): Observable<ExchangeRead | DiscussionExchangeForbiddenParams>;
  updateDiscussionStatus$(
    payload: {
      jwt: ConventionSupportedJwt;
      discussionId: string;
    } & WithDiscussionStatus,
  ): Observable<void>;
  getDiscussions$(
    payload: FetchDiscussionListRequestedPayload,
  ): Observable<DataWithPagination<DiscussionInList>>;
}
