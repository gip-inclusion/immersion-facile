import { from, map, Observable } from "rxjs";
import {
  AgencyId,
  InclusionConnectedAllowedRoutes,
  InclusionConnectedUser,
  MarkPartnersErroredConventionAsHandledRequest,
} from "shared";
import { HttpClient } from "shared-routes";
import { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";

export class HttpInclusionConnectedGateway
  implements InclusionConnectedGateway
{
  constructor(
    private readonly httpClient: HttpClient<InclusionConnectedAllowedRoutes>,
  ) {}

  public getCurrentUser$(token: string): Observable<InclusionConnectedUser> {
    return from(this.#getCurrentUser(token)).pipe(
      map(({ body, status }) => {
        if (status === 200) return body;
        throw new Error(JSON.stringify(body));
      }),
    );
  }

  public markPartnersErroredConventionAsHandled$(
    params: MarkPartnersErroredConventionAsHandledRequest,
    jwt: string,
  ): Observable<void> {
    return from(
      this.#markPartnersErroredConventionAsHandled(params, jwt).then(
        () => undefined,
      ),
    );
  }

  public registerAgenciesToCurrentUser$(
    agencyIds: AgencyId[],
    token: string,
  ): Observable<void> {
    return from(
      this.#registerAgenciesToCurrentUser(agencyIds, token).then(
        (responseBody) => {
          responseBody;
        },
      ),
    );
  }

  #getCurrentUser(token: string) {
    return this.httpClient.getInclusionConnectedUser({
      headers: { authorization: token },
    });
  }

  #markPartnersErroredConventionAsHandled(
    params: MarkPartnersErroredConventionAsHandledRequest,
    jwt: string,
  ): Promise<void> {
    return this.httpClient
      .markPartnersErroredConventionAsHandled({
        body: params,
        headers: { authorization: jwt },
      })
      .then(() => undefined);
  }

  #registerAgenciesToCurrentUser(agencyIds: AgencyId[], token: string) {
    return this.httpClient.registerAgenciesToUser({
      headers: { authorization: token },
      body: agencyIds,
    });
  }
}
