import { type Observable, Subject } from "rxjs";
import type {
  AbsoluteUrl,
  AfterOAuthSuccessRedirectionResponse,
  ConnectedUser,
  InitiateLoginByEmailParams,
  OAuthSuccessLoginParams,
  RenewExpiredJwtRequestDto,
} from "shared";
import type { AuthGateway } from "src/core-logic/ports/AuthGateway";

export class TestAuthGateway implements AuthGateway {
  public loginByEmailResponse$ = new Subject<void>();
  public confirmLoginByMagicLinkResponse$ =
    new Subject<AfterOAuthSuccessRedirectionResponse>();

  public getLogoutUrlResponse$ = new Subject<AbsoluteUrl>();

  public currentUser$ = new Subject<ConnectedUser>();

  public getConnectedUsersResponse$ = new Subject<ConnectedUser[]>();

  public renewExpiredJwtResponse$ = new Subject<void>();

  public loginByEmail$(_params: InitiateLoginByEmailParams): Observable<void> {
    return this.loginByEmailResponse$;
  }
  public getLogoutUrl$() {
    return this.getLogoutUrlResponse$;
  }

  public getCurrentUser$(_token: string): Observable<ConnectedUser> {
    return this.currentUser$;
  }

  public getConnectedUsers$(): Observable<ConnectedUser[]> {
    return this.getConnectedUsersResponse$;
  }

  public confirmLoginByMagicLink$(
    _params: OAuthSuccessLoginParams,
  ): Observable<AfterOAuthSuccessRedirectionResponse> {
    return this.confirmLoginByMagicLinkResponse$;
  }

  public renewExpiredJwt$(_: RenewExpiredJwtRequestDto): Observable<void> {
    return this.renewExpiredJwtResponse$;
  }
}
