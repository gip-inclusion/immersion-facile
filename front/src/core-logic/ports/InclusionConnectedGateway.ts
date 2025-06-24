import type { Observable } from "rxjs";
import type {
  AbsoluteUrl,
  AgencyId,
  ConventionSupportedJwt,
  DataWithPagination,
  DiscussionExchangeForbiddenParams,
  DiscussionInList,
  DiscussionReadDto,
  Exchange,
  InclusionConnectedUser,
  MarkPartnersErroredConventionAsHandledRequest,
  SendMessageToDiscussionFromDashboardRequestPayload,
  WithDiscussionStatus,
  WithIdToken,
} from "shared";
import type {
  FetchDiscussionListRequestedPayload,
  FetchDiscussionRequestedPayload,
} from "../domain/discussion/discussion.slice";

export interface InclusionConnectedGateway {
  getCurrentUser$(token: string): Observable<InclusionConnectedUser>;
  registerAgenciesToCurrentUser$(
    agencyIds: AgencyId[],
    token: string,
  ): Observable<void>;
  markPartnersErroredConventionAsHandled$(
    params: MarkPartnersErroredConventionAsHandledRequest,
    jwt: ConventionSupportedJwt,
  ): Observable<void>;
  getDiscussionById$(
    payload: FetchDiscussionRequestedPayload,
  ): Observable<DiscussionReadDto | undefined>;
  sendMessage$(
    payload: SendMessageToDiscussionFromDashboardRequestPayload,
  ): Observable<Exchange | DiscussionExchangeForbiddenParams>;
  getLogoutUrl$(
    payload: WithIdToken & { authToken: string },
  ): Observable<AbsoluteUrl>;
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
