import axios from "axios";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import {
  ApplicationStatus,
  ImmersionApplicationDto,
  ImmersionApplicationId,
  WithImmersionApplicationId,
  UpdateImmersionApplicationStatusRequestDto,
} from "src/shared/ImmersionApplication/ImmersionApplication.dto";
import {
  generateMagicLinkRoute,
  immersionApplicationShareRoute,
  immersionApplicationsRoute,
  renewMagicLinkRoute,
  signApplicationRoute,
  siretRoute,
  updateApplicationStatusRoute,
  validateImmersionApplicationRoute,
} from "src/shared/routes";
import { GetSiretResponseDto, SiretDto } from "src/shared/siret";
import { Role } from "src/shared/tokens/MagicLinkPayload";
import { AgencyId } from "src/shared/agencies";
import { ShareLinkByEmailDTO } from "src/shared/ShareLinkByEmailDTO";
import {
  immersionApplicationSchema,
  withImmersionApplicationIdSchema,
} from "src/shared/ImmersionApplication/immersionApplication.schema";

const prefix = "api";

export class HttpImmersionApplicationGateway
  implements ImmersionApplicationGateway
{
  public async add(
    immersionApplicationDto: ImmersionApplicationDto,
  ): Promise<string> {
    immersionApplicationSchema.parse(immersionApplicationDto);
    const httpResponse = await axios.post(
      `/${prefix}/${immersionApplicationsRoute}`,
      immersionApplicationDto,
    );
    const addImmersionApplicationResponse: WithImmersionApplicationId =
      httpResponse.data;
    withImmersionApplicationIdSchema.parse(addImmersionApplicationResponse);
    return addImmersionApplicationResponse.id;
  }

  public async backofficeGet(id: string): Promise<ImmersionApplicationDto> {
    const response = await axios.get(
      `/${prefix}/${immersionApplicationsRoute}/${id}`,
    );
    console.log(response.data);
    return response.data;
  }

  public async getML(jwt: string): Promise<ImmersionApplicationDto> {
    const response = await axios.get(
      `/${prefix}/auth/${immersionApplicationsRoute}/${jwt}`,
    );
    console.log(response.data);
    return response.data;
  }

  public async getAll(
    agency?: AgencyId,
    status?: ApplicationStatus,
  ): Promise<Array<ImmersionApplicationDto>> {
    const response = await axios.get(
      `/${prefix}/${immersionApplicationsRoute}`,
      {
        params: {
          agency,
          status,
        },
      },
    );

    return response.data;
  }

  public async update(
    immersionApplicationDto: ImmersionApplicationDto,
  ): Promise<string> {
    immersionApplicationSchema.parse(immersionApplicationDto);
    const httpResponse = await axios.post(
      `/${prefix}/${immersionApplicationsRoute}/${immersionApplicationDto.id}`,
      immersionApplicationDto,
    );
    const updateImmersionApplicationResponse: WithImmersionApplicationId =
      httpResponse.data;
    withImmersionApplicationIdSchema.parse(updateImmersionApplicationResponse);
    return updateImmersionApplicationResponse.id;
  }

  public async updateML(
    immersionApplicationDto: ImmersionApplicationDto,
    jwt: string,
  ): Promise<string> {
    immersionApplicationSchema.parse(immersionApplicationDto);
    const httpResponse = await axios.post(
      `/${prefix}/auth/${immersionApplicationsRoute}/${jwt}`,
      immersionApplicationDto,
    );
    const updateImmersionApplicationResponse =
      withImmersionApplicationIdSchema.parse(httpResponse.data);
    return updateImmersionApplicationResponse.id;
  }

  public async updateStatus(
    params: UpdateImmersionApplicationStatusRequestDto,
    jwt: string,
  ): Promise<WithImmersionApplicationId> {
    const httpResponse = await axios.post(
      `/${prefix}/auth/${updateApplicationStatusRoute}/${jwt}`,
      params,
    );

    return withImmersionApplicationIdSchema.parse(httpResponse.data);
  }

  public async signApplication(
    jwt: string,
  ): Promise<WithImmersionApplicationId> {
    const httpResponse = await axios.post(
      `/${prefix}/auth/${signApplicationRoute}/${jwt}`,
    );

    return withImmersionApplicationIdSchema.parse(httpResponse.data);
  }

  public async validate(id: ImmersionApplicationId): Promise<string> {
    const { data } = await axios.get(
      `/${prefix}/${validateImmersionApplicationRoute}/${id}`,
    );
    return data.id;
  }

  public async getSiretInfo(siret: SiretDto): Promise<GetSiretResponseDto> {
    const httpResponse = await axios.get(`/${prefix}/${siretRoute}/${siret}`);
    return httpResponse.data;
  }

  public async generateMagicLink(
    applicationId: ImmersionApplicationId,
    role: Role,
    expired: boolean,
  ): Promise<string> {
    const httpResponse = await axios.get(
      `/${prefix}/admin/${generateMagicLinkRoute}?id=${applicationId}&role=${role}&expired=${expired}`,
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
    immersionApplicationDTO: ShareLinkByEmailDTO,
  ): Promise<boolean> {
    const httpResponse = await axios.post(
      `/${prefix}/${immersionApplicationShareRoute}`,
      immersionApplicationDTO,
    );

    return httpResponse.status === 200;
  }
}
