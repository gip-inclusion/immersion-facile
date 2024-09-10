import { Observable } from "rxjs";
import {
  AbsoluteUrl,
  AgencyId,
  ConventionSupportedJwt,
  DiscussionReadDto,
  DiscussionRejected,
  IdToken,
  InclusionConnectedUser,
  MarkPartnersErroredConventionAsHandledRequest,
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
  getLogoutUrl$(payload: {
    idToken: IdToken;
  }): Observable<AbsoluteUrl>;
  updateDiscussiokenonStatus$(
    payload: {
      jwt: ConventionSupportedJwt;
      discussionId: string;
    } & DiscussionRejected,
  ): Observable<void>;
}
