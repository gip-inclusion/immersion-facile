import axios from "axios";
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
import { validateDataFromSchema } from "shared/src/zodUtils";
import { Role } from "shared/src/tokens/MagicLinkPayload";
import { ConventionGateway } from "src/core-logic/ports/ConventionGateway";

const prefix = "api";

export class HttpConventionGateway implements ConventionGateway {
  retrieveFromToken(
    payload: string,
  ): Observable<ConventionReadDto | undefined> {
    return from(this.getMagicLink(payload));
  }

  public async add(conventionDto: ConventionDto): Promise<string> {
    const { data } = await axios.post<unknown>(
      `/${prefix}/${conventionsRoute}`,
      conventionDto,
    );
    const withConventionId = validateDataFromSchema(
      withConventionIdSchema,
      data,
    );
    if (withConventionId instanceof Error) throw withConventionId;
    return withConventionId.id;
  }

  public async getById(id: string): Promise<ConventionReadDto> {
    const { data } = await axios.get<unknown>(
      `/${prefix}/${conventionsRoute}/${id}`,
    );
    const conventionReadDto = validateDataFromSchema(
      conventionReadSchema,
      data,
    );
    if (conventionReadDto instanceof Error) throw conventionReadDto;
    return conventionReadDto;
  }

  public async getMagicLink(jwt: string): Promise<ConventionReadDto> {
    const { data } = await axios.get<unknown>(
      `/${prefix}/auth/${conventionsRoute}/id`,
      {
        headers: { Authorization: jwt },
      },
    );
    const conventionReadDto = validateDataFromSchema(
      conventionReadSchema,
      data,
    );
    if (conventionReadDto instanceof Error) throw conventionReadDto;
    return conventionReadDto;
  }

  public async getAll(
    adminToken: AdminToken,
    agency?: AgencyId,
    status?: ConventionStatus,
  ): Promise<Array<ConventionReadDto>> {
    const { data } = await axios.get<unknown>(
      `/${prefix}/admin/${conventionsRoute}`,
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

    const conventionReadDtos = validateDataFromSchema(
      conventionReadsSchema,
      data,
    );
    if (conventionReadDtos instanceof Error) throw conventionReadDtos;
    return conventionReadDtos;
  }

  public async update(conventionDto: ConventionDto): Promise<string> {
    const { data } = await axios.post(
      `/${prefix}/${conventionsRoute}/${conventionDto.id}`,
      conventionDto,
    );
    const withConventionId = validateDataFromSchema(
      withConventionIdSchema,
      data,
    );
    if (withConventionId instanceof Error) throw withConventionId;
    return withConventionId.id;
  }

  public async updateMagicLink(
    conventionDto: ConventionDto,
    jwt: string,
  ): Promise<string> {
    const { data } = await axios.post(
      `/${prefix}/auth/${conventionsRoute}/${jwt}`,
      conventionDto,
      { headers: { authorization: jwt } },
    );
    const withConventionId = validateDataFromSchema(
      withConventionIdSchema,
      data,
    );
    if (withConventionId instanceof Error) throw withConventionId;
    return withConventionId.id;
  }

  public async updateStatus(
    params: UpdateConventionStatusRequestDto,
    jwt: string,
  ): Promise<WithConventionId> {
    const { data } = await axios.post(
      `/${prefix}/auth/${updateConventionStatusRoute}/${jwt}`,
      params,
      { headers: { Authorization: jwt } },
    );

    const withConventionId = validateDataFromSchema(
      withConventionIdSchema,
      data,
    );
    if (withConventionId instanceof Error) throw withConventionId;
    return withConventionId;
  }

  public async signApplication(jwt: string): Promise<WithConventionId> {
    const { data } = await axios.post<unknown>(
      `/${prefix}/auth/${signConventionRoute}/${jwt}`,
      undefined,
      { headers: { authorization: jwt } },
    );

    const withConventionIdDto = validateDataFromSchema(
      withConventionIdSchema,
      data,
    );
    if (withConventionIdDto instanceof Error) throw withConventionIdDto;
    return withConventionIdDto;
  }

  public async generateMagicLink(
    adminToken: AdminToken,
    applicationId: ConventionId,
    role: Role,
    expired: boolean,
  ): Promise<string> {
    const { data } = await axios.get<unknown>(
      `/${prefix}/admin/${generateMagicLinkRoute}?id=${applicationId}&role=${role}&expired=${expired}`,
      { headers: { authorization: adminToken } },
    );

    const jwtDto = validateDataFromSchema(jwtSchema, data);
    if (jwtDto instanceof Error) throw jwtDto;
    return jwtDto.jwt;
  }

  public async renewMagicLink(
    expiredJwt: string,
    linkFormat: string,
  ): Promise<void> {
    await axios.get(
      `/${prefix}/${renewMagicLinkRoute}?expiredJwt=${expiredJwt}&linkFormat=${encodeURIComponent(
        linkFormat,
      )}`,
    );
  }

  public async shareLinkByEmail(
    conventionDto: ShareLinkByEmailDto,
  ): Promise<boolean> {
    const httpResponse = await axios.post(
      `/${prefix}/${conventionShareRoute}`,
      conventionDto,
    );
    return httpResponse.status === 200;
  }
}
