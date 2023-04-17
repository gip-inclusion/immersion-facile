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
    _token: string,
    _agencyIds: AgencyId[],
  ): Observable<InclusionConnectedUser> {
    return this.currentUser$;
  }
  // for test purpose
  public currentUser$ = new Subject<InclusionConnectedUser>();
}
