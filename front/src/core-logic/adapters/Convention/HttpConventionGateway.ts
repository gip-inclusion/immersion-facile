import { from, Observable } from "rxjs";
import { fromPromise } from "rxjs/internal/observable/innerFrom";
import {
  AbsoluteUrl,
  ConventionDto,
  ConventionId,
  ConventionMagicLinkTargets,
  ConventionReadDto,
  ShareLinkByEmailDto,
  UnauthenticatedConventionTargets,
  UpdateConventionStatusRequestDto,
  WithConventionIdLegacy,
} from "shared";
import { HttpClient } from "http-client";
import { FetchConventionRequestedPayload } from "src/core-logic/domain/convention/convention.slice";
import { ConventionGateway } from "src/core-logic/ports/ConventionGateway";

export class HttpConventionGateway implements ConventionGateway {
  constructor(
    private readonly magicLinkHttpClient: HttpClient<ConventionMagicLinkTargets>,
    private readonly unauthenticatedHttpClient: HttpClient<UnauthenticatedConventionTargets>,
  ) {}

  public createConvention$(conventionDto: ConventionDto): Observable<void> {
    return fromPromise(this.newConvention(conventionDto).then(() => undefined));
  }

  public getConventionStatusDashboardUrl$(
    jwt: string,
  ): Observable<AbsoluteUrl> {
    return from(
      this.magicLinkHttpClient
        .getConventionStatusDashboard({
          headers: { authorization: jwt },
        })
        .then(({ responseBody }) => responseBody),
    );
  }

  private async newConvention(conventionDto: ConventionDto): Promise<string> {
    return this.unauthenticatedHttpClient
      .createConvention({
        body: conventionDto,
      })
      .then(({ responseBody }) => responseBody.id);
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

  private async retrieveFromToken(
    payload: FetchConventionRequestedPayload,
  ): Promise<ConventionReadDto> {
    return this.magicLinkHttpClient
      .getConvention({
        headers: { authorization: payload.jwt },
        urlParams: { conventionId: payload.conventionId },
      })
      .then(({ responseBody }) => responseBody);
  }

  public retrieveFromToken$(
    payload: FetchConventionRequestedPayload,
  ): Observable<ConventionReadDto | undefined> {
    return from(this.retrieveFromToken(payload));
  }

  public async shareConventionLinkByEmail(
    conventionDto: ShareLinkByEmailDto,
  ): Promise<boolean> {
    return this.unauthenticatedHttpClient
      .shareConvention({
        body: conventionDto,
      })
      .then(({ status }) => status === 200);
  }

  private async signConvention(jwt: string): Promise<WithConventionIdLegacy> {
    return this.magicLinkHttpClient
      .signConvention({
        headers: { authorization: jwt },
        urlParams: { conventionId: jwt }, // todo change this to conventionId,
      })
      .then(({ responseBody }) => responseBody);
  }

  public signConvention$(jwt: string): Observable<void> {
    return fromPromise(this.signConvention(jwt).then(() => undefined));
  }

  private async updateConvention(
    convention: ConventionDto,
    jwt: string,
  ): Promise<string> {
    return this.magicLinkHttpClient
      .updateConvention({
        body: { convention },
        urlParams: { conventionId: convention.id },
        headers: { authorization: jwt },
      })
      .then(({ responseBody }) => responseBody.id);
  }

  public updateConvention$(
    conventionDto: ConventionDto,
    jwt: string,
  ): Observable<void> {
    return fromPromise(
      this.updateConvention(conventionDto, jwt).then(() => undefined),
    );
  }

  public updateConventionStatus$(
    params: UpdateConventionStatusRequestDto,
    conventionId: ConventionId,
    jwt: string,
  ): Observable<void> {
    return fromPromise(
      this.updateStatus(params, conventionId, jwt).then(() => undefined),
    );
  }

  private async updateStatus(
    params: UpdateConventionStatusRequestDto,
    conventionId: ConventionId,
    jwt: string,
  ): Promise<WithConventionIdLegacy> {
    return this.magicLinkHttpClient
      .updateConventionStatus({
        body: params,
        urlParams: { conventionId },
        headers: { authorization: jwt },
      })
      .then(({ responseBody }) => responseBody);
  }
}
