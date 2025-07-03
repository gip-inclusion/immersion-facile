import type { Observable } from "rxjs";
import type {
  AbsoluteUrl,
  ConnectedUser,
  InitiateLoginByEmailParams,
  WithIdToken,
} from "shared";

export interface AuthGateway {
  loginByEmail$: (params: InitiateLoginByEmailParams) => Observable<void>;
  getLogoutUrl$(
    payload: WithIdToken & { authToken: string },
  ): Observable<AbsoluteUrl>;
  getCurrentUser$(token: string): Observable<ConnectedUser>;
}
