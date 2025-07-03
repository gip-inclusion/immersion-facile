import { delay, type Observable, of } from "rxjs";
import type {
  AbsoluteUrl,
  ConnectedUser,
  InitiateLoginByEmailParams,
} from "shared";
import type { AuthGateway } from "src/core-logic/ports/AuthGateway";

export class SimulatedAuthGateway implements AuthGateway {
  constructor(private simulatedLatency = 0) {}
  loginByEmail$(_params: InitiateLoginByEmailParams): Observable<void> {
    return of(undefined).pipe(delay(this.simulatedLatency));
  }
  public getLogoutUrl$(): Observable<AbsoluteUrl> {
    return of("http://fake-logout.com");
  }
  public getCurrentUser$(_token: string): Observable<ConnectedUser> {
    return of(simulatedUserConnected);
  }
}

const simulatedUserConnected: ConnectedUser = {
  email: "fake@user.com",
  firstName: "Fake",
  lastName: "User",
  id: "fake-user-id",
  agencyRights: [],
  dashboards: { agencies: {}, establishments: {} },
  proConnect: {
    externalId: "fake-user-external-id",
    siret: "00000000000000",
  },
  createdAt: new Date().toISOString(),
  isBackofficeAdmin: true,
};
