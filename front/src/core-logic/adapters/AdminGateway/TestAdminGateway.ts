import { Observable, of, Subject } from "rxjs";
import { AdminToken } from "shared/src/admin/admin.dto";
import { AbsoluteUrl } from "src/../../shared/src/AbsoluteUrl";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class TestAdminGateway implements AdminGateway {
  login(): Observable<AdminToken> {
    return this.token$;
  }

  public metabaseAgencyEmbed(_: AdminToken): Observable<AbsoluteUrl> {
    return of(`http://plop`);
  }

  public dashboardConvention(_token: AdminToken): Observable<AbsoluteUrl> {
    return of(`http://plop`);
  }

  public token$ = new Subject<string>();
}
