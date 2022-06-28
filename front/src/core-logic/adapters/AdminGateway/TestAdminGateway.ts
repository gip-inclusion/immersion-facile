import { Observable, Subject } from "rxjs";
import { AdminToken } from "shared/src/admin/admin.dto";
import { AdminGateway } from "src/core-logic/ports/AdminGateway";

export class TestAdminGateway implements AdminGateway {
  login(): Observable<AdminToken> {
    return this.token$;
  }

  public token$ = new Subject<string>();
}
