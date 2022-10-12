import { AxiosInstance } from "axios";
import { from, Observable } from "rxjs";
import { fromPromise } from "rxjs/internal/observable/innerFrom";
import {
  AdminToken,
  ConventionDto,
  ConventionId,
  ConventionReadDto,
  conventionReadSchema,
  conventionShareRoute,
  conventionsRoute,
  generateMagicLinkRoute,
  jwtSchema,
  renewMagicLinkRoute,
  Role,
  ShareLinkByEmailDto,
  signConventionRoute,
  UpdateConventionStatusRequestDto,
  updateConventionStatusRoute,
  WithConventionId,
  withConventionIdSchema,
} from "shared";
import { ConventionGateway } from "src/core-logic/ports/ConventionGateway";

export class HttpConventionGateway implements ConventionGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

  retrieveFromToken$(
    payload: string,
  ): Observable<ConventionReadDto | undefined> {
    return from(this.getMagicLink(payload));
  }

  private async add(conventionDto: ConventionDto): Promise<string> {
    const { data } = await this.httpClient.post<unknown>(
      `/${conventionsRoute}`,
      conventionDto,
    );
    const withConventionId = withConventionIdSchema.parse(data);
    return withConventionId.id;
  }

  public add$(conventionDto: ConventionDto): Observable<void> {
    return fromPromise(this.add(conventionDto).then(() => undefined));
  }

  public async getById(id: string): Promise<ConventionReadDto> {
    const { data } = await this.httpClient.get<unknown>(
      `/${conventionsRoute}/${id}`,
    );
    const conventionReadDto = conventionReadSchema.parse(data);
    return conventionReadDto;
  }

  private async getMagicLink(jwt: string): Promise<ConventionReadDto> {
    const { data } = await this.httpClient.get<unknown>(
      `/auth/${conventionsRoute}/id`,
      {
        headers: { Authorization: jwt },
      },
    );
    const conventionReadDto = conventionReadSchema.parse(data);
    return conventionReadDto;
  }

  private async updateMagicLink(
    conventionDto: ConventionDto,
    jwt: string,
  ): Promise<string> {
    const { data } = await this.httpClient.post(
      `/auth/${conventionsRoute}/${jwt}`,
      conventionDto,
      { headers: { authorization: jwt } },
    );
    const withConventionId = withConventionIdSchema.parse(data);
    return withConventionId.id;
  }

  public update$(conventionDto: ConventionDto, jwt: string): Observable<void> {
    return fromPromise(
      this.updateMagicLink(conventionDto, jwt).then(() => undefined),
    );
  }

  private async updateStatus(
    params: UpdateConventionStatusRequestDto,
    jwt: string,
  ): Promise<WithConventionId> {
    const { data } = await this.httpClient.post(
      `/auth/${updateConventionStatusRoute}/${jwt}`,
      params,
      { headers: { Authorization: jwt } },
    );

    const withConventionId = withConventionIdSchema.parse(data);
    if (withConventionId instanceof Error) throw withConventionId;
    return withConventionId;
  }

  public updateStatus$(
    params: UpdateConventionStatusRequestDto,
    jwt: string,
  ): Observable<void> {
    return fromPromise(this.updateStatus(params, jwt).then(() => undefined));
  }

  private async signApplication(jwt: string): Promise<WithConventionId> {
    const { data } = await this.httpClient.post<unknown>(
      `/auth/${signConventionRoute}/${jwt}`,
      undefined,
      { headers: { authorization: jwt } },
    );

    const withConventionIdDto = withConventionIdSchema.parse(data);
    return withConventionIdDto;
  }

  public signConvention$(jwt: string): Observable<void> {
    return fromPromise(this.signApplication(jwt).then(() => undefined));
  }

  // TODO Mieux identifier l'admin
  public async generateMagicLink(
    adminToken: AdminToken,
    applicationId: ConventionId,
    role: Role,
    expired: boolean,
  ): Promise<string> {
    const { data } = await this.httpClient.get<unknown>(
      `/admin/${generateMagicLinkRoute}?id=${applicationId}&role=${role}&expired=${expired}`,
      { headers: { authorization: adminToken } },
    );

    const jwtDto = jwtSchema.parse(data);
    return jwtDto.jwt;
  }

  public async renewMagicLink(
    expiredJwt: string,
    linkFormat: string,
  ): Promise<void> {
    await this.httpClient.get(
      `/${renewMagicLinkRoute}?expiredJwt=${expiredJwt}&linkFormat=${encodeURIComponent(
        linkFormat,
      )}`,
    );
  }

  public async shareLinkByEmail(
    conventionDto: ShareLinkByEmailDto,
  ): Promise<boolean> {
    const httpResponse = await this.httpClient.post(
      `/${conventionShareRoute}`,
      conventionDto,
    );
    return httpResponse.status === 200;
  }
}
