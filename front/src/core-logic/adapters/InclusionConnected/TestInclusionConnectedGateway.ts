import { Observable, Subject } from "rxjs";
import { AgencyId, InclusionConnectedUser } from "shared";
import { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";

export class TestInclusionConnectedGateway
  implements InclusionConnectedGateway
{
  getCurrentUser$(_token: string): Observable<InclusionConnectedUser> {
    return this.currentUser$;
  }
  registerAgenciesToCurrentUser$(
    _agencyIds: AgencyId[],
    _token: string,
  ): Observable<void> {
    return this.registerAgenciesToCurrentUserResponse$;
  }

  // for test purpose
  public currentUser$ = new Subject<InclusionConnectedUser>();
  public registerAgenciesToCurrentUserResponse$ = new Subject<undefined>();
}
