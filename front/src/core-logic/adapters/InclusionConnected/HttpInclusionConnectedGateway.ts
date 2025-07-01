import { from, type Observable } from "rxjs";
import type {
  AbsoluteUrl,
  AgencyId,
  DataWithPagination,
  DiscussionExchangeForbiddenParams,
  DiscussionInList,
  DiscussionReadDto,
  Exchange,
  InclusionConnectedAllowedRoutes,
  InclusionConnectedUser,
  MarkPartnersErroredConventionAsHandledRequest,
  SendMessageToDiscussionFromDashboardRequestPayload,
  UpdateDiscussionStatusParams,
  WithIdToken,
} from "shared";
import type { HttpClient } from "shared-routes";
import {
  logBodyAndThrow,
  otherwiseThrow,
  throwBadRequestWithExplicitMessage,
} from "src/core-logic/adapters/otherwiseThrow";
import type {
  FetchDiscussionListRequestedPayload,
  FetchDiscussionRequestedPayload,
} from "src/core-logic/domain/discussion/discussion.slice";
import type { InclusionConnectedGateway } from "src/core-logic/ports/InclusionConnectedGateway";
import { match, P } from "ts-pattern";

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

  public getDiscussions$(
    payload: FetchDiscussionListRequestedPayload,
  ): Observable<DataWithPagination<DiscussionInList>> {
    return from(
      this.httpClient
        .getDiscussions({
          queryParams: payload.filters,
          headers: { authorization: payload.jwt },
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

  public getCurrentUser$(token: string): Observable<InclusionConnectedUser> {
    return from(
      this.httpClient
        .getInclusionConnectedUser({
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

  public getLogoutUrl$({
    idToken,
    authToken,
  }: WithIdToken & { authToken: string }): Observable<AbsoluteUrl> {
    return from(
      this.httpClient
        .getInclusionConnectLogoutUrl({
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
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public sendMessage$(
    payload: SendMessageToDiscussionFromDashboardRequestPayload,
  ): Observable<Exchange | DiscussionExchangeForbiddenParams> {
    return from(
      this.httpClient
        .replyToDiscussion({
          headers: { authorization: payload.jwt },
          urlParams: { discussionId: payload.discussionId },
          body: {
            message: payload.message,
          },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 202 }, ({ body }) => body)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: 401 }, logBodyAndThrow)
            .with({ status: 404 }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public updateDiscussionStatus$(
    params: {
      jwt: string;
      discussionId: string;
    } & UpdateDiscussionStatusParams,
  ): Observable<void> {
    const { discussionId: _, jwt: __, ...body } = params;
    return from(
      this.httpClient
        .updateDiscussionStatus({
          headers: { authorization: params.jwt },
          urlParams: { discussionId: params.discussionId },
          body,
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => undefined)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: P.union(401, 403, 404) }, logBodyAndThrow)
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
          .with({ status: 400 }, throwBadRequestWithExplicitMessage)
          .with({ status: P.union(401, 403) }, (response) => {
            throw new Error(response.body.message);
          })
          .with({ status: 404 }, () => {
            throw new Error(
              "L'erreur sur la convention que vous cherchez à traiter n'existe pas, peut-être est-elle déjà marquée comme traitée. Rechargez la page pour mettre à jour le tableau.",
            );
          })
          .otherwise(otherwiseThrow),
      );
  }
}
