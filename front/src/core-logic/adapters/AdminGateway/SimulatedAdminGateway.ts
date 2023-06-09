import { Observable, of, throwError } from "rxjs";
import {
  AbsoluteUrl,
  AgencyDtoBuilder,
  AgencyRight,
  BackOfficeJwt,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  IcUserRoleForAgencyParams,
  InclusionConnectedUser,
  NotificationsByKind,
  UserAndPassword,
} from "shared";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

const simulatedAgencyDtos: AgencyRight[] = [
  {
    role: "toReview",
    agency: new AgencyDtoBuilder()
      .withName("Agence de Bourg en Bresse")
      .withId("fake-agency-id-1")
      .build(),
  },
  {
    role: "validator",
    agency: new AgencyDtoBuilder()
      .withName("Mission locale qu'on ne devrait pas voir")
      .withId("fake-agency-id-not-shown")
      .build(),
  },
  {
    role: "toReview",
    agency: new AgencyDtoBuilder()
      .withName("CCI de Quimper")
      .withId("fake-agency-id-3")
      .build(),
  },
];
export class SimulatedAdminGateway implements AdminGateway {
  login({ user }: UserAndPassword): Observable<BackOfficeJwt> {
    if (user.toLowerCase() === "failed")
      return throwError(
        () =>
          new Error("Impossible de vous authentifier (SimulatedAdminGateway)"),
      );
    return of("some-token");
  }

  public getDashboardUrl$(
    { name }: GetDashboardParams,
    _token: BackOfficeJwt,
  ): Observable<AbsoluteUrl> {
    const url: AbsoluteUrl = `http://${name}.com`;
    return of(url);
  }
  public addEstablishmentBatch$(
    _establishmentBatch: FormEstablishmentBatchDto,
    _token: BackOfficeJwt,
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

  getInclusionConnectedUsersToReview$(): Observable<InclusionConnectedUser[]> {
    return of([
      {
        id: "fake-user-id-1",
        email: "jbon8745@wanadoo.fr",
        firstName: "Jean",
        lastName: "Bon",
        agencyRights: simulatedAgencyDtos,
      },
      {
        id: "fake-user-id-2",
        email: "remi@sanfamille.fr",
        firstName: "Rémi",
        lastName: "Sanfamille",
        agencyRights: [],
      },
      {
        id: "user-in-error",
        email: "fake-user-email-4@test.fr",
        firstName: "Jean-Michel",
        lastName: "Jeplante",
        agencyRights: [
          {
            role: "toReview",
            agency: new AgencyDtoBuilder()
              .withName("Mission locale qui plante")
              .withId("non-existing-agency-id")
              .build(),
          },
        ],
      },
    ]);
  }

  updateUserRoleForAgency$(
    { agencyId }: IcUserRoleForAgencyParams,
    _token: string,
  ): Observable<void> {
    return agencyId === "non-existing-agency-id"
      ? throwError(() => new Error(`Agency Id ${agencyId} not found`))
      : of(undefined);
  }

  getLastNotifications(_token: BackOfficeJwt): Observable<NotificationsByKind> {
    const notificationsByKind: NotificationsByKind = {
      emails: [],
      sms: [],
    };
    return of(notificationsByKind);
  }
}
