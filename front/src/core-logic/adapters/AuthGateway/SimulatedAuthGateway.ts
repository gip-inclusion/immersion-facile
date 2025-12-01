import { delay, type Observable, of } from "rxjs";
import {
  type AbsoluteUrl,
  type AfterOAuthSuccessRedirectionResponse,
  AgencyDtoBuilder,
  type AgencyRight,
  type ConnectedUser,
  type InitiateLoginByEmailParams,
  type OAuthSuccessLoginParams,
  toAgencyDtoForAgencyUsersAndAdmins,
} from "shared";
import type { AuthGateway } from "src/core-logic/ports/AuthGateway";

export class SimulatedAuthGateway implements AuthGateway {
  constructor(private simulatedLatency = 0) { }
  loginByEmail$(_params: InitiateLoginByEmailParams): Observable<void> {
    return of(undefined).pipe(delay(this.simulatedLatency));
  }
  public getLogoutUrl$(): Observable<AbsoluteUrl> {
    return of("http://fake-logout.com");
  }
  public getCurrentUser$(_token: string): Observable<ConnectedUser> {
    return of(simulatedUserConnected);
  }

  public getConnectedUsers$(): Observable<ConnectedUser[]> {
    return of([
      {
        id: "fake-user-id-1",
        email: "jbon8745@wanadoo.fr",
        firstName: "Jean",
        lastName: "Bon",
        agencyRights: simulatedAgencyRights,
        dashboards: { agencies: {}, establishments: {} },
        proConnect: {
          externalId: "fake-user-external-id-1",
          siret: "00000000002222",
        },
        createdAt: new Date().toISOString(),
      },
      {
        id: "fake-user-id-2",
        email: "remi@sanfamille.fr",
        firstName: "Rémi",
        lastName: "Sanfamille",
        agencyRights: [],
        dashboards: { agencies: {}, establishments: {} },
        proConnect: {
          externalId: "fake-user-external-id-2",
          siret: "00000000001111",
        },
        createdAt: new Date().toISOString(),
      },
      {
        id: "user-in-error",
        email: "fake-user-email-4@test.fr",
        firstName: "Jean-Michel",
        lastName: "Jeplante",
        agencyRights: [
          {
            roles: ["to-review"],
            agency: toAgencyDtoForAgencyUsersAndAdmins(
              new AgencyDtoBuilder()
                .withName("Mission locale qui plante")
                .withId("non-existing-agency-id")
                .build(),
              [],
            ),
            isNotifiedByEmail: true,
          },
        ],
        dashboards: { agencies: {}, establishments: {} },
        proConnect: {
          externalId: "fake-user-in-error-external-id",
          siret: "00000000003333",
        },
        createdAt: new Date().toISOString(),
      },
    ] satisfies ConnectedUser[]);
  }

  public confirmLoginByMagicLink$(
    _params: OAuthSuccessLoginParams,
  ): Observable<AfterOAuthSuccessRedirectionResponse> {
    return of({
      ...simulatedUserConnected,
      idToken: "fake-id-token",
      provider: "email",
      token: "fake-token",
      redirectUri: "http://fake-redirect.com",
    });
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

const simulatedAgencyRights: AgencyRight[] = [
  {
    roles: ["to-review"],
    agency: toAgencyDtoForAgencyUsersAndAdmins(
      new AgencyDtoBuilder()
        .withName("Agence de Bourg en Bresse")
        .withId("fake-agency-id-1")
        .build(),
      [],
    ),
    isNotifiedByEmail: true,
  },
  {
    roles: ["validator"],
    agency: toAgencyDtoForAgencyUsersAndAdmins(
      new AgencyDtoBuilder()
        .withName("Mission locale qu'on ne devrait pas voir")
        .withId("fake-agency-id-not-shown")
        .build(),
      [],
    ),
    isNotifiedByEmail: true,
  },
  {
    roles: ["to-review"],
    agency: toAgencyDtoForAgencyUsersAndAdmins(
      new AgencyDtoBuilder()
        .withName("CCI de Quimper")
        .withId("fake-agency-id-3")
        .build(),
      [],
    ),
    isNotifiedByEmail: true,
  },
];
