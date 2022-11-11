import { Observable, Subject } from "rxjs";
import { AbsoluteUrl, AdminToken } from "shared";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class TestAdminGateway implements AdminGateway {
  login(): Observable<AdminToken> {
    return this.token$;
  }

  public getDashboardUrl$(): Observable<AbsoluteUrl> {
    return this.dashboardUrl$;
  }

  public token$ = new Subject<string>();
  public dashboardUrl$ = new Subject<AbsoluteUrl>();
}
