import type { Observable } from "rxjs";
import type {
  AbsoluteUrl,
  AfterOAuthSuccessRedirectionResponse,
  ConnectedUser,
  ConnectedUserJwt,
  InitiateLoginByEmailParams,
  OAuthSuccessLoginParams,
  WithIdToken,
  WithUserFilters,
} from "shared";

export interface AuthGateway {
  loginByEmail$: (params: InitiateLoginByEmailParams) => Observable<void>;
  getLogoutUrl$(
    payload: WithIdToken & { authToken: string },
  ): Observable<AbsoluteUrl>;
  getCurrentUser$(token: string): Observable<ConnectedUser>;
  getConnectedUsers$: (
    token: ConnectedUserJwt,
    filters: WithUserFilters,
  ) => Observable<ConnectedUser[]>;
  confirmLoginByMagicLink$(
    params: OAuthSuccessLoginParams,
  ): Observable<AfterOAuthSuccessRedirectionResponse>;
}
