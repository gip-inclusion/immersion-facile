import { Observable, of } from "rxjs";
import {
  AgencyDtoBuilder,
  AgencyId,
  AgencyRole,
  InclusionConnectedUser,
} from "shared";
import { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";

const simulatedUserConnected: InclusionConnectedUser = {
  email: "fake@user.com",
  firstName: "Fake",
  lastName: "User",
  id: "fake-user-id",
  dashboardUrl: "https://placeholder.com/",
  agencyRights: [
    {
      role: "agencyOwner",
      agency: new AgencyDtoBuilder().build(),
    },
  ],
};

export class SimulatedInclusionConnectedGateway
  implements InclusionConnectedGateway
{
  getCurrentUser$(_token: string): Observable<InclusionConnectedUser> {
    return of(simulatedUserConnected);
  }
  registerAgenciesToCurrentUser$(
    _token: string,
    agencyIds: AgencyId[],
  ): Observable<InclusionConnectedUser> {
    return of({
      ...simulatedUserConnected,
      agencyRights: agencyIds.map((agencyId) => ({
        role: "toReview" as AgencyRole,
        agency: new AgencyDtoBuilder().withId(agencyId).build(),
      })),
    });
  }
}
