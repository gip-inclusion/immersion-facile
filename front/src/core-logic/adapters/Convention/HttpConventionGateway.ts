import { AxiosInstance } from "axios";
import { from, Observable } from "rxjs";
import { AdminToken } from "shared";
import {
  ConventionDto,
  ConventionId,
  ConventionReadDto,
  UpdateConventionStatusRequestDto,
  WithConventionId,
} from "shared";
import { conventionReadSchema, withConventionIdSchema } from "shared";
import {
  conventionShareRoute,
  conventionsRoute,
  generateMagicLinkRoute,
  renewMagicLinkRoute,
  signConventionRoute,
  updateConventionStatusRoute,
} from "shared";
import { ShareLinkByEmailDto } from "shared";
import { jwtSchema } from "shared";
import { Role } from "shared";
import { ConventionGateway } from "src/core-logic/ports/ConventionGateway";

export class HttpConventionGateway implements ConventionGateway {
  constructor(private readonly httpClient: AxiosInstance) {}

  retrieveFromToken(
    payload: string,
  ): Observable<ConventionReadDto | undefined> {
    return from(this.getMagicLink(payload));
  }

  public async add(conventionDto: ConventionDto): Promise<string> {
    const { data } = await this.httpClient.post<unknown>(
      `/${conventionsRoute}`,
      conventionDto,
    );
    const withConventionId = withConventionIdSchema.parse(data);
    return withConventionId.id;
  }

  public async getById(id: string): Promise<ConventionReadDto> {
    const { data } = await this.httpClient.get<unknown>(
      `/${conventionsRoute}/${id}`,
    );
    const conventionReadDto = conventionReadSchema.parse(data);
    return conventionReadDto;
  }

  public async getMagicLink(jwt: string): Promise<ConventionReadDto> {
    const { data } = await this.httpClient.get<unknown>(
      `/auth/${conventionsRoute}/id`,
      {
        headers: { Authorization: jwt },
      },
    );
    const conventionReadDto = conventionReadSchema.parse(data);
    return conventionReadDto;
  }

  public async update(conventionDto: ConventionDto): Promise<string> {
    const { data } = await this.httpClient.post(
      `/${conventionsRoute}/${conventionDto.id}`,
      conventionDto,
    );
    const withConventionId = withConventionIdSchema.parse(data);
    return withConventionId.id;
  }

  public async updateMagicLink(
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

  public async updateStatus(
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

  public async signApplication(jwt: string): Promise<WithConventionId> {
    const { data } = await this.httpClient.post<unknown>(
      `/auth/${signConventionRoute}/${jwt}`,
      undefined,
      { headers: { authorization: jwt } },
    );

    const withConventionIdDto = withConventionIdSchema.parse(data);
    return withConventionIdDto;
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
