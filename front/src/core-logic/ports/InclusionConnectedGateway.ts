import type { Observable } from "rxjs";
import type {
  AbsoluteUrl,
  AgencyId,
  ConventionSupportedJwt,
  DiscussionReadDto,
  DiscussionRejected,
  Exchange,
  InclusionConnectedUser,
  MarkPartnersErroredConventionAsHandledRequest,
  SendMessageToDiscussionFromDashboardRequestPayload,
  WithIdToken,
} from "shared";
import type { FetchDiscussionRequestedPayload } from "../domain/discussion/discussion.slice";

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
  ): Observable<Exchange>;
  getLogoutUrl$(
    payload: WithIdToken & { authToken: string },
  ): Observable<AbsoluteUrl>;
  updateDiscussionStatus$(
    payload: {
      jwt: ConventionSupportedJwt;
      discussionId: string;
    } & DiscussionRejected,
  ): Observable<void>;
}
