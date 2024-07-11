import { Observable, from } from "rxjs";
import {
  AbsoluteUrl,
  AgencyId,
  DiscussionReadDto,
  DiscussionRejected,
  InclusionConnectedAllowedRoutes,
  InclusionConnectedUser,
  MarkPartnersErroredConventionAsHandledRequest,
  makeRejection,
} from "shared";
import { HttpClient } from "shared-routes";
import {
  logBodyAndThrow,
  otherwiseThrow,
} from "src/core-logic/adapters/otherwiseThrow";
import { FetchDiscussionRequestedPayload } from "src/core-logic/domain/discussion/discussion.slice";
import { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";
import { match } from "ts-pattern";

export class HttpInclusionConnectedGateway
  implements InclusionConnectedGateway
{
  constructor(
    private readonly httpClient: HttpClient<InclusionConnectedAllowedRoutes>,
  ) {}
  getDiscussionById$({
    discussionId,
    jwt,
  }: FetchDiscussionRequestedPayload): Observable<
    DiscussionReadDto | undefined
  > {
    return from(
      this.httpClient
        .getDiscussionByIdForEstablishment({
          headers: { authorization: jwt },
          urlParams: {
            discussionId,
          },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 401 }, logBodyAndThrow)
            .with({ status: 403 }, logBodyAndThrow)
            .with({ status: 404 }, () => undefined)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public getCurrentUser$(token: string): Observable<InclusionConnectedUser> {
    return from(
      this.httpClient
        .getInclusionConnectedUser({
          headers: { authorization: token },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 400 }, logBodyAndThrow)
            .with({ status: 403 }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public getLogoutUrl$(): Observable<AbsoluteUrl> {
    return from(
      this.httpClient.getInclusionConnectLogoutUrl().then((response) =>
        match(response)
          .with({ status: 200 }, ({ body }) => body)
          .otherwise(otherwiseThrow),
      ),
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
      this.httpClient
        .registerAgenciesToUser({
          headers: { authorization: token },
          body: agencyIds,
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => undefined)
            .with({ status: 400 }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public updateDiscussionStatus$(
    params: {
      jwt: string;
      discussionId: string;
    } & DiscussionRejected,
  ): Observable<void> {
    const { jwt, discussionId, status } = params;
    return from(
      this.httpClient
        .updateDiscussionStatus({
          headers: { authorization: jwt },
          urlParams: { discussionId },
          body: {
            status,
            ...makeRejection({ ...params }),
          },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => undefined)
            .with({ status: P.union(400, 401, 403, 404) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
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
          .with({ status: 400 }, logBodyAndThrow)
          .with({ status: 403 }, logBodyAndThrow)
          .with({ status: 404 }, () => {
            throw new Error(
              "L'erreur sur la convention que vous cherchez à traiter n'existe pas, peut-être est-elle déjà marquée comme traitée. Rechargez la page pour mettre à jour le tableau.",
            );
          })
          .otherwise(otherwiseThrow),
      );
  }
}
