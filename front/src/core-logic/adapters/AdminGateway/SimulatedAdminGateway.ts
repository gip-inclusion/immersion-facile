import { Observable, of, throwError } from "rxjs";
import {
  AbsoluteUrl,
  AdminToken,
  DashboardName,
  UserAndPassword,
} from "shared";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class SimulatedAdminGateway implements AdminGateway {
  login({ user }: UserAndPassword): Observable<AdminToken> {
    if (user.toLowerCase() === "failed")
      return throwError(
        () =>
          new Error("Impossible de vous authentifier (SimulatedAdminGateway)"),
      );
    return of("some-token");
  }

  public metabaseAgencyEmbed(_: AdminToken): Observable<AbsoluteUrl> {
    return of(`http://plop`);
  }

  public getDashboardUrl$(
    dashboardName: DashboardName,
    _token: AdminToken,
  ): Observable<AbsoluteUrl> {
    const url: AbsoluteUrl = `http://${dashboardName}.com`;
    return of(url);
  }
}
