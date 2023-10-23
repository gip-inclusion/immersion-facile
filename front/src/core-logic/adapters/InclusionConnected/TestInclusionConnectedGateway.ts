import { Observable, Subject } from "rxjs";
import {
  AgencyId,
  InclusionConnectedUser,
  MarkPartnersErroredConventionAsHandledRequest,
} from "shared";
import { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";

export class TestInclusionConnectedGateway
  implements InclusionConnectedGateway
{
  // for test purpose
  public currentUser$ = new Subject<InclusionConnectedUser>();

  public markPartnersErroredConventionAsHandledResult$ = new Subject<void>();

  public registerAgenciesToCurrentUserResponse$ = new Subject<undefined>();

  public getCurrentUser$(_token: string): Observable<InclusionConnectedUser> {
    return this.currentUser$;
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
