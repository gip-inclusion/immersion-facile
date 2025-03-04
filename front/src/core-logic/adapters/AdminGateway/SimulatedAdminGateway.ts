import { Observable, of, throwError } from "rxjs";
import {
  AgencyDtoBuilder,
  AgencyRight,
  ApiConsumer,
  ApiConsumerJwt,
  ConnectedUserJwt,
  DashboardUrlAndName,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  GetUsersFilters,
  InclusionConnectedUser,
  NotificationsByKind,
  RejectIcUserRoleForAgencyParams,
  UserId,
  UserInList,
  UserParamsForAgency,
  WithAgencyIdAndUserId,
  toAgencyDtoForAgencyUsersAndAdmins,
} from "shared";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

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

export class SimulatedAdminGateway implements AdminGateway {
  public updateFeatureFlags$ = (): Observable<void> => of(undefined);

  public addEstablishmentBatch$(
    _establishmentBatch: FormEstablishmentBatchDto,
    _token: ConnectedUserJwt,
  ): Observable<EstablishmentBatchReport> {
    return of({
      numberOfEstablishmentsProcessed: 12,
      numberOfSuccess: 8,
      failures: [
        {
          siret: "744854745000266",
          errorMessage: "Test erreur 1",
        },
        {
          siret: "744854745000267",
          errorMessage: "Test erreur 2",
        },
        {
          siret: "744854745000268",
          errorMessage: "Test erreur 3",
        },
      ],
    });
  }

  public createUserForAgency$(
    { agencyId }: UserParamsForAgency,
    _token: string,
  ): Observable<InclusionConnectedUser> {
    return agencyId === "non-existing-agency-id"
      ? throwError(() => new Error(`Agency Id ${agencyId} not found`))
      : of({
          id: "fake-user-id-2",
          email: "remi@sanfamille.fr",
          firstName: "Rémi",
          lastName: "Sanfamille",
          agencyRights: [],
          dashboards: { agencies: {}, establishments: {} },
          externalId: "fake-user-external-id-2",
          createdAt: new Date().toISOString(),
        });
  }

  public getAllApiConsumers$(
    _adminToken: ConnectedUserJwt,
  ): Observable<ApiConsumer[]> {
    return of(apiConsumers);
  }

  public getDashboardUrl$(
    { name }: GetDashboardParams,
    _token: ConnectedUserJwt,
  ): Observable<DashboardUrlAndName> {
    return of({ name, url: `http://${name}.com` });
  }

  public getInclusionConnectedUsersToReview$(): Observable<
    InclusionConnectedUser[]
  > {
    return of([
      {
        id: "fake-user-id-1",
        email: "jbon8745@wanadoo.fr",
        firstName: "Jean",
        lastName: "Bon",
        agencyRights: simulatedAgencyRights,
        dashboards: { agencies: {}, establishments: {} },
        externalId: "fake-user-external-id-1",
        createdAt: new Date().toISOString(),
      },
      {
        id: "fake-user-id-2",
        email: "remi@sanfamille.fr",
        firstName: "Rémi",
        lastName: "Sanfamille",
        agencyRights: [],
        dashboards: { agencies: {}, establishments: {} },
        externalId: "fake-user-external-id-2",
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
        externalId: "fake-user-in-error-external-id",
        createdAt: new Date().toISOString(),
      },
    ] satisfies InclusionConnectedUser[]);
  }

  public getLastNotifications$(
    _token: ConnectedUserJwt,
  ): Observable<NotificationsByKind> {
    const notificationsByKind: NotificationsByKind = {
      emails: [],
      sms: [],
    };
    return of(notificationsByKind);
  }

  public rejectUserForAgency$(
    { agencyId }: RejectIcUserRoleForAgencyParams,
    _token: string,
  ): Observable<void> {
    return agencyId === "non-existing-agency-id"
      ? throwError(() => new Error(`Agency Id ${agencyId} not found`))
      : of(undefined);
  }

  public saveApiConsumer$(
    _apiConsumer: ApiConsumer,
    _adminToken: ConnectedUserJwt,
  ): Observable<ApiConsumerJwt> {
    return of(
      "fakeTokenJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijk4ZDE3NTE3LWJlNDItNDY2OS04OTVkLTQ3ODE0MjBhNjhiOCIsImlhdCI6MTY5MTM5MTk4Mn0.WuGBIyvVa7rNaIxjZTgVTSIcU0LkN8GRDmFxXMYTRYFh0vK0c6ImupszTJF4VXHGpkkpE1AXasOwBWhOg",
    );
  }

  public updateUserRoleForAgency$(
    { agencyId }: UserParamsForAgency,
    _token: string,
  ): Observable<void> {
    return agencyId === "non-existing-agency-id"
      ? throwError(() => new Error(`Agency Id ${agencyId} not found`))
      : of(undefined);
  }

  public removeUserFromAgency$(
    _params: WithAgencyIdAndUserId,
    _token: string,
  ): Observable<void> {
    return of(undefined);
  }

  public listUsers$(
    { emailContains }: GetUsersFilters,
    _token: string,
  ): Observable<UserInList[]> {
    return of(
      simulatedUsers.filter((user) => user.email.includes(emailContains)),
    );
  }

  public getIcUser$(
    params: {
      userId: UserId;
    },
    _token: ConnectedUserJwt,
  ): Observable<InclusionConnectedUser> {
    const icUser = simulatedUsers.find((user) => user.id === params.userId);
    if (!icUser) throw new Error(`User ${params.userId} not found`);
    return of({
      ...icUser,
      agencyRights: [
        {
          agency: toAgencyDtoForAgencyUsersAndAdmins(
            new AgencyDtoBuilder().build(),
            [],
          ),
          roles: ["validator"],
          isNotifiedByEmail: true,
        },
      ],
      dashboards: { agencies: {}, establishments: {} },
    });
  }
}

const simulatedUsers: UserInList[] = [
  {
    id: "fake-user-id-1",
    email: "jerome@mail.com",
    firstName: "Jerome",
    lastName: "Yolo",
    externalId: "external-id-1",
    createdAt: new Date().toISOString(),
    numberOfAgencies: 10,
  },
  {
    id: "fake-user-id-2",
    email: "john@mail.com",
    firstName: "john",
    lastName: "Lala",
    externalId: "external-id-1",
    createdAt: new Date().toISOString(),
    numberOfAgencies: 3,
  },
];

const apiConsumers: ApiConsumer[] = [
  {
    id: "fake-api-consumer-id-1",
    name: "FakeApiConsumer1",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce fermentum odio nibh, quis porta mi tempus quis.",
    contact: {
      lastName: "FakeLastname1",
      firstName: "FakeFirstname1",
      job: "FakeJob1",
      phone: "FakePhone1",
      emails: ["fakeEmail1@mail.com"],
    },
    createdAt: new Date().toISOString(),
    expirationDate: new Date().toISOString(),
    rights: {
      searchEstablishment: {
        kinds: ["READ"],
        scope: "no-scope",
        subscriptions: [],
      },
      convention: {
        kinds: ["READ", "WRITE"],
        scope: {
          agencyKinds: ["pole-emploi", "mission-locale"],
        },
        subscriptions: [],
      },
      statistics: {
        kinds: ["READ"],
        scope: "no-scope",
        subscriptions: [],
      },
    },
  },
  {
    id: "fake-api-consumer-id-2",
    name: "FakeApiConsumer2",
    description: "Temp",
    contact: {
      lastName: "FakeLastname2",
      firstName: "FakeFirstname2",
      job: "FakeJob2",
      phone: "FakePhone2",
      emails: ["fakeEmail2@mail.com"],
    },
    createdAt: new Date().toISOString(),
    expirationDate: new Date().toISOString(),
    rights: {
      searchEstablishment: {
        kinds: ["READ"],
        scope: "no-scope",
        subscriptions: [],
      },
      convention: {
        kinds: ["READ"],
        scope: {
          agencyIds: ["fake-agency-id-1"],
        },
        subscriptions: [],
      },
      statistics: {
        kinds: ["READ"],
        scope: "no-scope",
        subscriptions: [],
      },
    },
  },
];
