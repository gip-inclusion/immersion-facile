import axios from "axios";
import { AdminToken } from "shared/src/admin/admin.dto";
import { ConventionGateway } from "src/core-logic/ports/ConventionGateway";
import { AgencyId } from "shared/src/agency/agency.dto";
import {
  ConventionStatus,
  ConventionId,
  UpdateConventionStatusRequestDto,
  WithConventionId,
  ConventionDto,
  ConventionReadDto,
} from "shared/src/convention/convention.dto";
import { withConventionIdSchema } from "shared/src/convention/convention.schema";
import {
  generateMagicLinkRoute,
  conventionShareRoute,
  conventionsRoute,
  renewMagicLinkRoute,
  signConventionRoute,
  updateConventionStatusRoute,
} from "shared/src/routes";
import { ShareLinkByEmailDto } from "shared/src/ShareLinkByEmailDto";
import { Role } from "shared/src/tokens/MagicLinkPayload";
import { from, Observable } from "rxjs";

const prefix = "api";

export class HttpConventionGateway implements ConventionGateway {
  retrieveFromToken(
    payload: string,
  ): Observable<ConventionReadDto | undefined> {
    return from(this.getMagicLink(payload));
  }

  public async add(conventionDto: ConventionDto): Promise<string> {
    const httpResponse = await axios.post(
      `/${prefix}/${conventionsRoute}`,
      conventionDto,
    );
    const addConventionResponse: WithConventionId = httpResponse.data;
    withConventionIdSchema.parse(addConventionResponse);
    return addConventionResponse.id;
  }

  public async getById(id: string): Promise<ConventionReadDto> {
    const response = await axios.get(`/${prefix}/${conventionsRoute}/${id}`);
    return response.data;
  }

  public async getMagicLink(jwt: string): Promise<ConventionReadDto> {
    const response = await axios.get(`/${prefix}/auth/${conventionsRoute}/id`, {
      headers: { Authorization: jwt },
    });
    return response.data;
  }

  public async getAll(
    adminToken: AdminToken,
    agency?: AgencyId,
    status?: ConventionStatus,
  ): Promise<Array<ConventionReadDto>> {
    const response = await axios.get(`/${prefix}/admin/${conventionsRoute}`, {
      params: {
        agency,
        status,
      },
      headers: {
        authorization: adminToken,
      },
    });

    return response.data;
  }

  public async update(conventionDto: ConventionDto): Promise<string> {
    const httpResponse = await axios.post(
      `/${prefix}/${conventionsRoute}/${conventionDto.id}`,
      conventionDto,
    );
    const updateConventionResponse: WithConventionId = httpResponse.data;
    withConventionIdSchema.parse(updateConventionResponse);
    return updateConventionResponse.id;
  }

  public async updateMagicLink(
    conventionDto: ConventionDto,
    jwt: string,
  ): Promise<string> {
    const httpResponse = await axios.post(
      `/${prefix}/auth/${conventionsRoute}/${jwt}`,
      conventionDto,
      { headers: { authorization: jwt } },
    );
    const updateConventionResponse = withConventionIdSchema.parse(
      httpResponse.data,
    );
    return updateConventionResponse.id;
  }

  public async updateStatus(
    params: UpdateConventionStatusRequestDto,
    jwt: string,
  ): Promise<WithConventionId> {
    const httpResponse = await axios.post(
      `/${prefix}/auth/${updateConventionStatusRoute}/${jwt}`,
      params,
      { headers: { Authorization: jwt } },
    );

    return withConventionIdSchema.parse(httpResponse.data);
  }

  public async signApplication(jwt: string): Promise<WithConventionId> {
    const httpResponse = await axios.post(
      `/${prefix}/auth/${signConventionRoute}/${jwt}`,
      undefined,
      { headers: { authorization: jwt } },
    );

    return withConventionIdSchema.parse(httpResponse.data);
  }

  public async generateMagicLink(
    adminToken: AdminToken,
    applicationId: ConventionId,
    role: Role,
    expired: boolean,
  ): Promise<string> {
    const httpResponse = await axios.get(
      `/${prefix}/admin/${generateMagicLinkRoute}?id=${applicationId}&role=${role}&expired=${expired}`,
      { headers: { authorization: adminToken } },
    );
    return httpResponse.data.jwt;
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
