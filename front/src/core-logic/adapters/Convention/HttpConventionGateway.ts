import { from, type Observable } from "rxjs";
import type {
  AddConventionInput,
  ApiConsumerName,
  AuthenticatedConventionRoutes,
  ConnectedUserJwt,
  ConventionDto,
  ConventionId,
  ConventionJwt,
  ConventionLastBroadcastFeedbackResponse,
  ConventionMagicLinkRoutes,
  ConventionReadDto,
  ConventionSupportedJwt,
  DashboardUrlAndName,
  DataWithPagination,
  EditConventionCounsellorNameRequestDto,
  FindSimilarConventionsParams,
  FlatGetConventionsForAgencyUserParams,
  MarkPartnersErroredConventionAsHandledRequest,
  RenewConventionParams,
  RenewMagicLinkRequestDto,
  SendSignatureLinkRequestDto,
  ShareLinkByEmailDto,
  TransferConventionToAgencyRequestDto,
  UnauthenticatedConventionRoutes,
  UpdateConventionStatusRequestDto,
  WithConventionId,
} from "shared";
import type { HttpClient } from "shared-routes";
import {
  logBodyAndThrow,
  otherwiseThrow,
  throwBadRequestWithExplicitMessage,
  throwServiceUnavailableWithExplicitMessage,
  throwTooManyRequestWithExplicitMessage,
} from "src/core-logic/adapters/otherwiseThrow";
import type { FetchConventionRequestedPayload } from "src/core-logic/domain/convention/convention.slice";
import type { ConventionGateway } from "src/core-logic/ports/ConventionGateway";
import { match, P } from "ts-pattern";

export class HttpConventionGateway implements ConventionGateway {
  constructor(
    private readonly magicLinkHttpClient: HttpClient<ConventionMagicLinkRoutes>,
    private readonly unauthenticatedHttpClient: HttpClient<UnauthenticatedConventionRoutes>,
    private readonly authenticatedHttpClient: HttpClient<AuthenticatedConventionRoutes>,
  ) {}

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

  #markPartnersErroredConventionAsHandled(
    params: MarkPartnersErroredConventionAsHandledRequest,
    jwt: string,
  ): Promise<void> {
    return this.authenticatedHttpClient
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

  public broadcastConventionAgain$(
    params: WithConventionId,
    jwt: ConnectedUserJwt,
  ): Observable<void> {
    return from(
      this.authenticatedHttpClient
        .broadcastConventionAgain({
          body: { conventionId: params.conventionId },
          headers: { authorization: jwt },
        })
        .then((response) => {
          match(response)
            .with({ status: 200 }, () => undefined)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: P.union(401, 403, 404, 429) }, logBodyAndThrow)
            .otherwise(otherwiseThrow);
        }),
    );
  }

  public createConvention$(params: AddConventionInput): Observable<void> {
    return from(
      this.unauthenticatedHttpClient
        .createConvention({
          body: params,
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => undefined)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: 409 }, logBodyAndThrow)
            .with({ status: 503 }, throwServiceUnavailableWithExplicitMessage)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public editConventionCounsellorName$(
    params: EditConventionCounsellorNameRequestDto,
    jwt: ConventionSupportedJwt,
  ): Observable<void> {
    return from(
      this.magicLinkHttpClient
        .editConventionCounsellorName({
          body: params,
          headers: { authorization: jwt },
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

  public getApiConsumersByConvention$(
    params: WithConventionId,
    jwt: ConnectedUserJwt,
  ): Observable<ApiConsumerName[]> {
    return from(
      this.authenticatedHttpClient
        .getApiConsumersByConvention({
          urlParams: { conventionId: params.conventionId },
          headers: { authorization: jwt },
        })
        .then((response) => {
          return match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: P.union(401, 403, 404) }, logBodyAndThrow)
            .otherwise(otherwiseThrow);
        }),
    );
  }

  public getConventionStatusDashboardUrl$(
    conventionId: ConventionId,
    jwt: ConventionJwt,
  ): Observable<DashboardUrlAndName> {
    return from(
      this.magicLinkHttpClient
        .getConventionStatusDashboard({
          urlParams: {
            conventionId,
          },
          headers: { authorization: jwt },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: P.union(401, 403) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public getSimilarConventions$(
    findSimilarConventionsParams: FindSimilarConventionsParams,
  ): Observable<ConventionId[]> {
    return from(
      this.unauthenticatedHttpClient
        .findSimilarConventions({
          queryParams: findSimilarConventionsParams,
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body.similarConventionIds)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public sendSignatureLink$(
    params: SendSignatureLinkRequestDto,
    jwt: ConventionSupportedJwt,
  ): Observable<void> {
    return from(
      this.magicLinkHttpClient
        .sendSignatureLink({ body: params, headers: { authorization: jwt } })
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => undefined)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: 429 }, throwTooManyRequestWithExplicitMessage)
            .with({ status: P.union(403, 404) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public renewConvention$(
    params: RenewConventionParams,
    jwt: ConventionSupportedJwt,
  ): Observable<void> {
    return from(
      this.magicLinkHttpClient
        .renewConvention({
          body: params,
          headers: { authorization: jwt },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => undefined)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public async renewMagicLink({
    expiredJwt,
    originalUrl,
  }: RenewMagicLinkRequestDto): Promise<void> {
    await this.unauthenticatedHttpClient.renewMagicLink({
      queryParams: {
        expiredJwt,
        originalUrl: encodeURIComponent(originalUrl),
      },
    });
  }

  public retrieveFromToken$(
    payload: FetchConventionRequestedPayload,
  ): Observable<ConventionReadDto | undefined> {
    return from(
      this.magicLinkHttpClient
        .getConvention({
          headers: { authorization: payload.jwt },
          urlParams: { conventionId: payload.conventionId },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: 404 }, () => undefined)
            .with({ status: P.union(403, 401) }, ({ body }) => {
              throw new Error(body.message);
            })

            .otherwise(otherwiseThrow),
        ),
    );
  }

  public shareConventionLinkByEmail(
    conventionDto: ShareLinkByEmailDto,
  ): Promise<boolean> {
    return this.unauthenticatedHttpClient
      .shareConvention({
        body: conventionDto,
      })
      .then((response) =>
        match(response)
          .with({ status: 200 }, () => true)
          .with({ status: 400 }, () => false)
          .otherwise(otherwiseThrow),
      );
  }

  public signConvention$(
    conventionId: ConventionId,
    jwt: ConventionJwt | ConnectedUserJwt,
  ): Observable<void> {
    return from(
      this.magicLinkHttpClient
        .signConvention({
          headers: { authorization: jwt },
          urlParams: { conventionId },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => undefined)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public transferConventionToAgency$(
    params: TransferConventionToAgencyRequestDto,
    jwt: ConventionSupportedJwt,
  ): Observable<void> {
    return from(
      this.magicLinkHttpClient
        .transferConventionToAgency({
          body: params,
          headers: { authorization: jwt },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => undefined)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: P.union(403, 404) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public updateConvention$(
    convention: ConventionDto,
    jwt: string,
  ): Observable<void> {
    return from(
      this.magicLinkHttpClient
        .updateConvention({
          body: { convention },
          urlParams: { conventionId: convention.id },
          headers: { authorization: jwt },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => undefined)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: P.union(404, 401, 403) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public updateConventionStatus$(
    params: UpdateConventionStatusRequestDto,
    jwt: string,
  ): Observable<void> {
    return from(
      this.magicLinkHttpClient
        .updateConventionStatus({
          body: params,
          headers: { authorization: jwt },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, () => undefined)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: P.union(403, 404) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }

  public getConventionsForUser$(
    params: FlatGetConventionsForAgencyUserParams,
    jwt: string,
  ): Observable<DataWithPagination<ConventionReadDto>> {
    return from(
      this.authenticatedHttpClient
        .getConventionsForAgencyUser({
          queryParams: params,
          headers: { authorization: jwt },
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

  public getConventionLastBroadcastFeedback$(
    conventionId: ConventionId,
    jwt: ConventionSupportedJwt,
  ): Observable<ConventionLastBroadcastFeedbackResponse> {
    return from(
      this.authenticatedHttpClient
        .getConventionLastBroadcastFeedback({
          urlParams: { conventionId },
          headers: { authorization: jwt },
        })
        .then((response) =>
          match(response)
            .with({ status: 200 }, ({ body }) => body)
            .with({ status: 400 }, throwBadRequestWithExplicitMessage)
            .with({ status: P.union(401, 403, 404) }, logBodyAndThrow)
            .otherwise(otherwiseThrow),
        ),
    );
  }
}
