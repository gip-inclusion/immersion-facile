import { Observable, Subject } from "rxjs";
import { AbsoluteUrl, AgencyId,
  InclusionConnectedUser,
  MarkPartnersErroredConventionAsHandledRequest,
} from "shared";
import { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";

export class TestInclusionConnectedGateway
  implements InclusionConnectedGateway
{
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
