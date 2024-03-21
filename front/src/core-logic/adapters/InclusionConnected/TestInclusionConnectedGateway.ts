import { Observable, Subject } from "rxjs";
import {
  AbsoluteUrl,
  AgencyId,
  DiscussionReadDto,
  InclusionConnectedUser,
  MarkPartnersErroredConventionAsHandledRequest,
} from "shared";
import { FetchDiscussionRequestedPayload } from "src/core-logic/domain/discussion/discussion.slice";
import { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";

export class TestInclusionConnectedGateway
  implements InclusionConnectedGateway
{
  public discussion$ = new Subject<DiscussionReadDto | undefined>();
  // for test purpose
  public currentUser$ = new Subject<InclusionConnectedUser>();

  public getLogoutUrlResponse$ = new Subject<AbsoluteUrl>();

  public markPartnersErroredConventionAsHandledResult$ = new Subject<void>();

  public registerAgenciesToCurrentUserResponse$ = new Subject<undefined>();

  public getCurrentUser$(_token: string): Observable<InclusionConnectedUser> {
    return this.currentUser$;
  }

  public getLogoutUrl$() {
    return this.getLogoutUrlResponse$;
  }

  public getDiscussionById$(
    _payload: FetchDiscussionRequestedPayload,
  ): Observable<DiscussionReadDto | undefined> {
    return this.discussion$;
  }

  public markPartnersErroredConventionAsHandled$(
    _params: MarkPartnersErroredConventionAsHandledRequest,
    _jwt: string,
  ): Observable<void> {
    return this.markPartnersErroredConventionAsHandledResult$;
  }

  public registerAgenciesToCurrentUser$(
    _agencyIds: AgencyId[],
    _token: string,
  ): Observable<void> {
    return this.registerAgenciesToCurrentUserResponse$;
  }
}
