import { from, type Observable } from "rxjs";
import type {
  AbsoluteUrl,
  AuthRoutes,
  ConnectedUser,
  InitiateLoginByEmailParams,
  WithIdToken,
} from "shared";
import type { HttpClient } from "shared-routes";
import {
  logBodyAndThrow,
  otherwiseThrow,
  throwBadRequestWithExplicitMessage,
} from "src/core-logic/adapters/otherwiseThrow";
import type { AuthGateway } from "src/core-logic/ports/AuthGateway";
import { match } from "ts-pattern";

export class HttpAuthGateway implements AuthGateway {
  constructor(private readonly httpClient: HttpClient<AuthRoutes>) {}
  loginByEmail$(params: InitiateLoginByEmailParams): Observable<void> {
    return from(
      this.httpClient
        .initiateLoginByEmail({
          body: params,
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => undefined)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public getLogoutUrl$({
    idToken,
    authToken,
  }: WithIdToken & { authToken: string }): Observable<AbsoluteUrl> {
    return from(
      this.httpClient
        .getOAuthLogoutUrl({
          queryParams: { idToken },
          headers: { authorization: authToken },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 401 }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public getCurrentUser$(token: string): Observable<ConnectedUser> {
    return from(
      this.httpClient
        .getConnectedUser({
          headers: { authorization: token },
          queryParams: {},
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: 401 }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }
}
