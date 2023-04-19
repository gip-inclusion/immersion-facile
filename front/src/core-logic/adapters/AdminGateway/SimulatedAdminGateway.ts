import { Observable, of, throwError } from "rxjs";
import {
  AbsoluteUrl,
  AgencyDto,
  AgencyDtoBuilder,
  AgencyId,
  AgencyRole,
  AuthenticatedUser,
  AuthenticatedUserId,
  BackOfficeJwt,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  UserAndPassword,
} from "shared";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

const simulatedAgencyDtosResponse: AgencyDto[] = [
  new AgencyDtoBuilder()
    .withName("Agence de Bourg en Bresse")
    .withId("fake-agency-id-1")
    .build(),
  new AgencyDtoBuilder()
    .withName("Mission locale du Berry")
    .withId("fake-agency-id-2")
    .build(),
  new AgencyDtoBuilder()
    .withName("CCI de Quimper")
    .withId("fake-agency-id-3")
    .build(),
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

  getAgencyUsersToReview$(): Observable<AuthenticatedUser[]> {
    return of([
      {
        id: "fake-user-id-1",
        email: "jbon8745@wanadoo.fr",
        firstName: "Jean",
        lastName: "Bon",
      },
      {
        id: "fake-user-id-2",
        email: "remi@sanfamille.fr",
        firstName: "Rémi",
        lastName: "Sanfamille",
      },
      {
        id: "fake-user-id-3",
        email: "bob@bikinibottom.com",
        firstName: "Spongebob",
        lastName: "Squarepants",
      },
      {
        id: "user-in-error",
        email: "fake-user-email-4@test.fr",
        firstName: "Jean-Michel",
        lastName: "Ayraure",
      },
    ]);
  }

  getAgenciesToReviewForUser$(
    userId: AuthenticatedUserId,
    _token: string,
  ): Observable<AgencyDto[]> {
    return userId === "user-in-error"
      ? throwError(new Error(`User Id ${userId} has errored getting agencies`))
      : of(simulatedAgencyDtosResponse);
  }

  updateAgencyRoleForUser$(
    agencyId: AgencyId,
    _role: AgencyRole,
    _userId: AuthenticatedUserId,
    _token: string,
  ): Observable<void> {
    return agencyId === "non-existing-agency-id"
      ? throwError(new Error(`Agency Id ${agencyId} not found`))
      : of(undefined);
  }
}
