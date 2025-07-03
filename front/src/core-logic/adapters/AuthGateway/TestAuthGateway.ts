import { type Observable, Subject } from "rxjs";
import type {
  AbsoluteUrl,
  ConnectedUser,
  InitiateLoginByEmailParams,
} from "shared";
import type { AuthGateway } from "src/core-logic/ports/AuthGateway";

export class TestAuthGateway implements AuthGateway {
  public loginByEmailResponse$ = new Subject<void>();

  public getLogoutUrlResponse$ = new Subject<AbsoluteUrl>();

  public currentUser$ = new Subject<ConnectedUser>();

  public loginByEmail$(_params: InitiateLoginByEmailParams): Observable<void> {
    return this.loginByEmailResponse$;
  }
  public getLogoutUrl$() {
    return this.getLogoutUrlResponse$;
  }

  public getCurrentUser$(_token: string): Observable<ConnectedUser> {
    return this.currentUser$;
  }
}
