import { from, Observable } from "rxjs";
import { fromPromise } from "rxjs/internal/observable/innerFrom";
import {
  AbsoluteUrl,
  ConventionDto,
  ConventionMagicLinkRoutes,
  ConventionReadDto,
  ConventionSupportedJwt,
  RenewConventionParams,
  ShareLinkByEmailDto,
  UnauthenticatedConventionRoutes,
  UpdateConventionStatusRequestDto,
  WithConventionIdLegacy,
} from "shared";
import { HttpClient } from "shared-routes";
import { FetchConventionRequestedPayload } from "src/core-logic/domain/convention/convention.slice";
import { ConventionGateway } from "src/core-logic/ports/ConventionGateway";

export class HttpConventionGateway implements ConventionGateway {
  constructor(
    private readonly magicLinkHttpClient: HttpClient<ConventionMagicLinkRoutes>,
    private readonly unauthenticatedHttpClient: HttpClient<UnauthenticatedConventionRoutes>,
  ) {}

  public createConvention$(conventionDto: ConventionDto): Observable<void> {
    return fromPromise(
      this.#newConvention(conventionDto).then(() => undefined),
    );
  }

  public getConventionStatusDashboardUrl$(
    jwt: string,
  ): Observable<AbsoluteUrl> {
    return from(
      this.magicLinkHttpClient
        .getConventionStatusDashboard({
          headers: { authorization: jwt },
        })
        .then(({ body }) => body),
    );
  }

  public renewConvention$(
    params: RenewConventionParams,
    jwt: ConventionSupportedJwt,
  ): Observable<void> {
    return fromPromise(this.#renewConvention(params, jwt));
  }

  public async renewMagicLink(
    expiredJwt: string,
    originalUrl: string,
  ): Promise<void> {
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
    return from(this.#retrieveFromToken(payload));
  }

  public shareConventionLinkByEmail(
    conventionDto: ShareLinkByEmailDto,
  ): Promise<boolean> {
    return this.unauthenticatedHttpClient
      .shareConvention({
        body: conventionDto,
      })
      .then(({ status }) => status === 200);
  }

  public signConvention$(jwt: string): Observable<void> {
    return fromPromise(this.#signConvention(jwt).then(() => undefined));
  }

  public updateConvention$(
    conventionDto: ConventionDto,
    jwt: string,
  ): Observable<void> {
    return fromPromise(
      this.#updateConvention(conventionDto, jwt).then(() => undefined),
    );
  }

  public updateConventionStatus$(
    params: UpdateConventionStatusRequestDto,
    jwt: string,
  ): Observable<void> {
    return fromPromise(this.#updateStatus(params, jwt).then(() => undefined));
  }

  #newConvention(conventionDto: ConventionDto): Promise<string> {
    return this.unauthenticatedHttpClient
      .createConvention({
        body: conventionDto,
      })
      .then(({ body }) => body.id);
  }

  #renewConvention(
    params: RenewConventionParams,
    jwt: ConventionSupportedJwt,
  ): Promise<void> {
    return this.magicLinkHttpClient
      .renewConvention({
        body: params,
        headers: { authorization: jwt },
      })
      .then(() => undefined);
  }

  #retrieveFromToken(
    payload: FetchConventionRequestedPayload,
  ): Promise<ConventionReadDto> {
    return this.magicLinkHttpClient
      .getConvention({
        headers: { authorization: payload.jwt },
        urlParams: { conventionId: payload.conventionId },
      })
      .then(({ body }) => body);
  }

  #signConvention(jwt: string): Promise<WithConventionIdLegacy> {
    return this.magicLinkHttpClient
      .signConvention({
        headers: { authorization: jwt },
        urlParams: { conventionId: jwt }, // todo change this to conventionId,
      })
      .then(({ body }) => body);
  }

  #updateConvention(convention: ConventionDto, jwt: string): Promise<string> {
    return this.magicLinkHttpClient
      .updateConvention({
        body: { convention },
        urlParams: { conventionId: convention.id },
        headers: { authorization: jwt },
      })
      .then(({ body }) => body.id);
  }

  #updateStatus(
    params: UpdateConventionStatusRequestDto,
    jwt: string,
  ): Promise<WithConventionIdLegacy> {
    return this.magicLinkHttpClient
      .updateConventionStatus({
        body: params,
        headers: { authorization: jwt },
      })
      .then(({ body }) => body);
  }
}
