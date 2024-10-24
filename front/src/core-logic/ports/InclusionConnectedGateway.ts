import { Observable } from "rxjs";
import {
  AbsoluteUrl,
  AgencyId,
  ConventionSupportedJwt,
  DiscussionReadDto,
  DiscussionRejected,
  InclusionConnectedUser,
  MarkPartnersErroredConventionAsHandledRequest,
  WithIdToken,
} from "shared";
import { FetchDiscussionRequestedPayload } from "../domain/discussion/discussion.slice";

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
