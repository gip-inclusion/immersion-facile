import { AxiosInstance } from "axios";
import { from, Observable } from "rxjs";
import { fromPromise } from "rxjs/internal/observable/innerFrom";
import {
  AbsoluteUrl,
  absoluteUrlSchema,
  BackOfficeJwt,
  ConventionDto,
  ConventionId,
  ConventionReadDto,
  conventionReadSchema,
  conventionShareRoute,
  conventionsRoute,
  generateMagicLinkRoute,
  getConventionStatusDashboard,
  jwtSchema,
  queryParamsAsString,
  RenewMagicLinkRequestDto,
  renewMagicLinkRoute,
  Role,
  ShareLinkByEmailDto,
  signConventionRoute,
  UpdateConventionStatusRequestDto,
  updateConventionStatusRoute,
  WithConventionId,
  withConventionIdSchema,
} from "shared";
import { FetchConventionRequestedPayload } from "src/core-logic/domain/convention/convention.slice";
import { ConventionGateway } from "src/core-logic/ports/ConventionGateway";

export class HttpConventionGateway implements ConventionGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

  public getConventionStatusDashboardUrl$(
    jwt: string,
  ): Observable<AbsoluteUrl> {
    return from(
      this.httpClient
        .get<unknown>(`/auth/${getConventionStatusDashboard}`, {
          headers: { authorization: jwt },
        })
        .then(({ data }) => absoluteUrlSchema.parse(data)),
    );
  }

  public retrieveFromToken$(
    payload: FetchConventionRequestedPayload,
  ): Observable<ConventionReadDto | undefined> {
    return from(this.retreiveFromToken(payload));
  }

  private async retreiveFromToken(
    payload: FetchConventionRequestedPayload,
  ): Promise<ConventionReadDto> {
    const { data } = await this.httpClient.get<unknown>(
      `/auth/${conventionsRoute}/${payload.conventionId}`,
      {
        headers: { Authorization: payload.jwt },
      },
    );
    return conventionReadSchema.parse(data);
  }

  public newConvention$(conventionDto: ConventionDto): Observable<void> {
    return fromPromise(this.newConvention(conventionDto).then(() => undefined));
  }

  private async newConvention(conventionDto: ConventionDto): Promise<string> {
    const { data } = await this.httpClient.post<unknown>(
      `/${conventionsRoute}`,
      conventionDto,
    );
    return withConventionIdSchema.parse(data).id;
  }

  public updateConvention$(
    conventionDto: ConventionDto,
    jwt: string,
  ): Observable<void> {
    return fromPromise(
      this.updateConvention(conventionDto, jwt).then(() => undefined),
    );
  }

  private async updateConvention(
    convention: ConventionDto,
    jwt: string,
  ): Promise<string> {
    const { data } = await this.httpClient.post(
      `/auth/${conventionsRoute}/${convention.id}`,
      { convention },
      { headers: { authorization: jwt } },
    );
    return withConventionIdSchema.parse(data).id;
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
  ): Promise<WithConventionId> {
    const { data } = await this.httpClient.post(
      `/auth/${updateConventionStatusRoute}/${conventionId}`,
      params,
      { headers: { Authorization: jwt } },
    );
    return withConventionIdSchema.parse(data);
  }

  public signConvention$(jwt: string): Observable<void> {
    return fromPromise(this.signConvention(jwt).then(() => undefined));
  }

  private async signConvention(jwt: string): Promise<WithConventionId> {
    const { data } = await this.httpClient.post<unknown>(
      `/auth/${signConventionRoute}/${jwt}`,
      undefined,
      { headers: { authorization: jwt } },
    );

    return withConventionIdSchema.parse(data);
  }

  public async generateMagicLink(
    adminToken: BackOfficeJwt,
    applicationId: ConventionId,
    role: Role,
    expired: boolean,
  ): Promise<string> {
    const { data } = await this.httpClient.get<unknown>(
      `/admin/${generateMagicLinkRoute}?id=${applicationId}&role=${role}&expired=${expired}`,
      { headers: { authorization: adminToken } },
    );
    return jwtSchema.parse(data).jwt;
  }

  public async renewMagicLink(
    expiredJwt: string,
    originalUrl: string,
  ): Promise<void> {
    const queryParams = queryParamsAsString<RenewMagicLinkRequestDto>({
      expiredJwt,
      originalUrl: encodeURIComponent(originalUrl),
    });
    await this.httpClient.get(`/${renewMagicLinkRoute}?${queryParams}`);
  }

  public async shareConventionLinkByEmail(
    conventionDto: ShareLinkByEmailDto,
  ): Promise<boolean> {
    const httpResponse = await this.httpClient.post(
      `/${conventionShareRoute}`,
      conventionDto,
    );
    return httpResponse.status === 200;
  }

  public async retreiveById(id: string): Promise<ConventionReadDto> {
    const { data } = await this.httpClient.get<unknown>(
      `/${conventionsRoute}/${id}`,
    );
    return conventionReadSchema.parse(data);
  }
}
