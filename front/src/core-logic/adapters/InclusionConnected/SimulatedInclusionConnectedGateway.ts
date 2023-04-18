import { delay, Observable, of, throwError } from "rxjs";
import { AgencyId, InclusionConnectedUser } from "shared";
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
  constructor(private simulatedLatency: number = 0) {}
  getCurrentUser$(_token: string): Observable<InclusionConnectedUser> {
    return of(simulatedUserConnected);
  }
  registerAgenciesToCurrentUser$(
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
