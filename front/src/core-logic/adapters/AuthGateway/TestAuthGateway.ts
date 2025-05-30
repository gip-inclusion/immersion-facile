import { type Observable, Subject } from "rxjs";
import type { InitiateLoginByEmailParams } from "shared";
import type { AuthGateway } from "src/core-logic/ports/AuthGateway";

export class TestAuthGateway implements AuthGateway {
  public loginByEmailResponse$ = new Subject<void>();

  public loginByEmail$(_params: InitiateLoginByEmailParams): Observable<void> {
    return this.loginByEmailResponse$;
  }
}
