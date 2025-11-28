import type { Observable } from "rxjs";
import type {
  AbsoluteUrl,
  AfterOAuthSuccessRedirectionResponse,
  ConnectedUser,
  InitiateLoginByEmailParams,
  OAuthSuccessLoginParams,
  WithIdToken,
} from "shared";

export interface AuthGateway {
  loginByEmail$: (params: InitiateLoginByEmailParams) => Observable<void>;
  getLogoutUrl$(
    payload: WithIdToken & { authToken: string },
  ): Observable<AbsoluteUrl>;
  getCurrentUser$(token: string): Observable<ConnectedUser>;
  confirmLoginByMagicLink$(params: OAuthSuccessLoginParams): Observable<AfterOAuthSuccessRedirectionResponse>;
}
