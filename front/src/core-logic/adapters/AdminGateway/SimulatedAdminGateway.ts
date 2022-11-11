import { Observable, of, throwError } from "rxjs";
import {
  AbsoluteUrl,
  AdminToken,
  GetDashboardParams,
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

  public getDashboardUrl$(
    { name }: GetDashboardParams,
    _token: AdminToken,
  ): Observable<AbsoluteUrl> {
    const url: AbsoluteUrl = `http://${name}.com`;
    return of(url);
  }
}
