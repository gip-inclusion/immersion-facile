import { type Observable, from } from "rxjs";
import type { ConventionJwt, EstablishmentLeadRoutes } from "shared";
import type { HttpClient } from "shared-routes";
import type { EstablishmentLeadGateway } from "src/core-logic/ports/EstablishmentLeadGateway";
import { P, match } from "ts-pattern";
import {
  otherwiseThrow,
  throwBadRequestWithExplicitMessage,
} from "../otherwiseThrow";

export class HttpEstablishmentLeadGateway implements EstablishmentLeadGateway {
  constructor(
    private readonly httpClient: HttpClient<EstablishmentLeadRoutes>,
  ) {}

  public rejectEstablishmentLeadRegistration$(
    jwt: ConventionJwt,
  ): Observable<void> {
    return from(
      this.httpClient
        .unregisterEstablishmentLead({
          headers: {
            authorization: jwt,
          },
        })
        .then((response) =>
          match(response)
            .with({ status: 204 }, () => {
              /* void */
            })
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: P.union(401, 403, 404) }, ({ body }) => {
              throw new Error(JSON.stringify(body));
            })
            .otherwise(otherwiseThrow),
        ),
    );
  }
}
