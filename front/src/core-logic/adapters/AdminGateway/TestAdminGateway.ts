import { Observable, of, Subject } from "rxjs";
import { AbsoluteUrl, AdminToken, DashboardName } from "shared";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class TestAdminGateway implements AdminGateway {
  login(): Observable<AdminToken> {
    return this.token$;
  }

  public metabaseAgencyEmbed(_: AdminToken): Observable<AbsoluteUrl> {
    return of(`http://plop`);
  }

  public getDashboardUrl$(
    _dashboardName: DashboardName,
    _token: AdminToken,
  ): Observable<AbsoluteUrl> {
    return this.dashboardUrl$;
  }

  public token$ = new Subject<string>();
  public dashboardUrl$ = new Subject<AbsoluteUrl>();
}
