import { Observable, of, throwError } from "rxjs";
import {
  AbsoluteUrl,
  BackOfficeJwt,
  EstablishmentBatchReport,
  FormEstablishmentBatchDto,
  GetDashboardParams,
  UserAndPassword,
} from "shared";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

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
}
