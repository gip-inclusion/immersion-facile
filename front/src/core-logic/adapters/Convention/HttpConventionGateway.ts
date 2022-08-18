import { AxiosInstance } from "axios";
import { from, Observable } from "rxjs";
import { AdminToken } from "shared/src/admin/admin.dto";
import { AgencyId } from "shared/src/agency/agency.dto";
import {
  ConventionDto,
  ConventionId,
  ConventionReadDto,
  ConventionStatus,
  UpdateConventionStatusRequestDto,
  WithConventionId,
} from "shared/src/convention/convention.dto";
import {
  conventionReadSchema,
  conventionReadsSchema,
  withConventionIdSchema,
} from "shared/src/convention/convention.schema";
import {
  conventionShareRoute,
  conventionsRoute,
  generateMagicLinkRoute,
  renewMagicLinkRoute,
  signConventionRoute,
  updateConventionStatusRoute,
} from "shared/src/routes";
import { ShareLinkByEmailDto } from "shared/src/ShareLinkByEmailDto";
import { jwtSchema } from "shared/src/tokens/jwt.schema";
import { Role } from "shared/src/tokens/MagicLinkPayload";
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

  // TODO Mieux identifier l'admin
  public async getAll(
    adminToken: AdminToken,
    agency?: AgencyId,
    status?: ConventionStatus,
  ): Promise<Array<ConventionReadDto>> {
    const { data } = await this.httpClient.get<unknown>(
      `/admin/${conventionsRoute}`,
      {
        params: {
          agency,
          status,
        },
        headers: {
          authorization: adminToken,
        },
      },
    );

    const conventionReadDtos = conventionReadsSchema.parse(data);
    return conventionReadDtos;
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
