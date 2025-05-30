import type { Observable } from "rxjs";
import type { InitiateLoginByEmailParams } from "shared";

export interface AuthGateway {
  loginByEmail$: (params: InitiateLoginByEmailParams) => Observable<void>;
}
