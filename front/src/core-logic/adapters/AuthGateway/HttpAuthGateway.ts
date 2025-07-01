import { from, type Observable } from "rxjs";
import type {
  InclusionConnectImmersionRoutes,
  InitiateLoginByEmailParams,
} from "shared";
import type { HttpClient } from "shared-routes";
import { otherwiseThrow } from "src/core-logic/adapters/otherwiseThrow";
import type { AuthGateway } from "src/core-logic/ports/AuthGateway";
import { match } from "ts-pattern";

export class HttpAuthGateway implements AuthGateway {
  constructor(
    private readonly httpClient: HttpClient<InclusionConnectImmersionRoutes>,
  ) {}
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
}
