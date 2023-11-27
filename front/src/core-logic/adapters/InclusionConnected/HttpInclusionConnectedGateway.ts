import { from, Observable } from "rxjs";
import { match } from "ts-pattern";
import {
  AbsoluteUrl,
  AgencyId,
  InclusionConnectedAllowedRoutes,
  InclusionConnectedUser,
  MarkPartnersErroredConventionAsHandledRequest,
  WithSourcePage,
} from "shared";
import { HttpClient } from "shared-routes";
import {
  logBodyAndThrow,
  otherwiseThrow,
} from "src/core-logic/adapters/otherwiseThrow";
import { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";

export class HttpInclusionConnectedGateway
  implements InclusionConnectedGateway
{
  constructor(
    private readonly httpClient: HttpClient<InclusionConnectedAllowedRoutes>,
  ) {}

  public getCurrentUser$(token: string): Observable<InclusionConnectedUser> {
    return from(
      this.#getCurrentUser(token).then((response) =>
        match(response)
          .with({ status: 200 }, ({ body }) => body)
          .with({ status: 400 }, logBodyAndThrow)
          .otherwise(otherwiseThrow),
      ),
    );
  }

  public getLogoutUrl$(params: WithSourcePage): Observable<AbsoluteUrl> {
    return from(
      this.httpClient
        .getInclusionConnectLogoutUrl({ queryParams: params })
        .then((response) => response.body),
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
      .then((response) =>
        match(response)
          .with({ status: 200 }, () => undefined)
          .with({ status: 404 }, () => {
            throw new Error(
              "L'erreur sur la convention que vous cherchez à traiter n'existe pas, peut-être est-elle déjà marquée comme traitée. Rechargez la page pour mettre à jour le tableau.",
            );
          })
          .with({ status: 400 }, logBodyAndThrow)
          .otherwise(otherwiseThrow),
      );
  }

  #registerAgenciesToCurrentUser(agencyIds: AgencyId[], token: string) {
    return this.httpClient.registerAgenciesToUser({
      headers: { authorization: token },
      body: agencyIds,
    });
  }
}
