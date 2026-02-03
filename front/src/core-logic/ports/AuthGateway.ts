import type { Observable } from "rxjs";
import type {
  AbsoluteUrl,
  AfterOAuthSuccessRedirectionResponse,
  ConnectedUser,
  ConnectedUserJwt,
  InitiateLoginByEmailParams,
  LogoutQueryParams,
  OAuthSuccessLoginParams,
  RenewExpiredJwtRequestDto,
  WithUserFilters,
} from "shared";

export interface AuthGateway {
  loginByEmail$: (params: InitiateLoginByEmailParams) => Observable<void>;
  getLogoutUrl$(
    payload: LogoutQueryParams & { authToken: string },
  ): Observable<AbsoluteUrl>;
  getCurrentUser$(token: string): Observable<ConnectedUser>;
  getConnectedUsers$: (
    token: ConnectedUserJwt,
    filters: WithUserFilters,
  ) => Observable<ConnectedUser[]>;
  confirmLoginByMagicLink$(
    params: OAuthSuccessLoginParams,
  ): Observable<AfterOAuthSuccessRedirectionResponse>;
  renewExpiredJwt$(
    renewMagicLinkRequestDto: RenewExpiredJwtRequestDto,
  ): Observable<void>;
}
