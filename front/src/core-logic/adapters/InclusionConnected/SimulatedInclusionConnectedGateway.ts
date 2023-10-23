import { delay, Observable, of, Subject, throwError } from "rxjs";
import {
  AgencyId,
  InclusionConnectedUser,
  MarkPartnersErroredConventionAsHandledRequest,
} from "shared";
import { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";

const simulatedUserConnected: InclusionConnectedUser = {
  email: "fake@user.com",
  firstName: "Fake",
  lastName: "User",
  id: "fake-user-id",
  agencyRights: [],
};

export const nonExisitingAgencyId: AgencyId = "not-found-agency-id";

export class SimulatedInclusionConnectedGateway
  implements InclusionConnectedGateway
{
  public markPartnersErroredConventionAsHandledResult$ = new Subject<void>();

  constructor(private simulatedLatency: number = 0) {}

  public getCurrentUser$(_token: string): Observable<InclusionConnectedUser> {
    return of(simulatedUserConnected);
  }

  public markPartnersErroredConventionAsHandled$(
    _params: MarkPartnersErroredConventionAsHandledRequest,
    _jwt: string,
  ): Observable<void> {
    return this.markPartnersErroredConventionAsHandledResult$;
  }

  public registerAgenciesToCurrentUser$(
    agencyIds: AgencyId[],
    _token: string,
  ): Observable<void> {
    const agencyIdInError = agencyIds.findIndex(
      (id) => id === nonExisitingAgencyId,
    );
    return agencyIdInError > 0
      ? throwError(
          new Error(`Agency Id ${agencyIds[agencyIdInError]} not found`),
        )
      : of(undefined).pipe(delay(this.simulatedLatency));
  }
}
