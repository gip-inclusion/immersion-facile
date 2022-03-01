import axios from "axios";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import {
  AgencyInListDto,
  listAgenciesResponseSchema,
} from "src/shared/agencies";
import {
  AddImmersionApplicationResponseDto,
  addImmersionApplicationResponseDtoSchema,
  ApplicationStatus,
  ImmersionApplicationDto,
  ImmersionApplicationId,
  immersionApplicationSchema,
  UpdateImmersionApplicationResponseDto,
  updateImmersionApplicationResponseDtoSchema,
  UpdateImmersionApplicationStatusRequestDto,
  UpdateImmersionApplicationStatusResponseDto,
  updateImmersionApplicationStatusResponseSchema,
} from "src/shared/ImmersionApplicationDto";
import {
  agenciesRoute,
  generateMagicLinkRoute,
  immersionApplicationsRoute,
  renewMagicLinkRoute,
  signApplicationRoute,
  siretRoute,
  updateApplicationStatusRoute,
  validateImmersionApplicationRoute,
} from "src/shared/routes";
import { LatLonDto } from "src/shared/SearchImmersionDto";
import { GetSiretResponseDto, SiretDto } from "src/shared/siret";
import { Role } from "src/shared/tokens/MagicLinkPayload";
import { AgencyId } from "../../shared/agencies";

const prefix = "api";

export class HttpImmersionApplicationGateway extends ImmersionApplicationGateway {
  public async add(
    immersionApplicationDto: ImmersionApplicationDto,
  ): Promise<string> {
    immersionApplicationSchema.parse(immersionApplicationDto);
    const httpResponse = await axios.post(
      `/${prefix}/${immersionApplicationsRoute}`,
      immersionApplicationDto,
    );
    const addImmersionApplicationResponse: AddImmersionApplicationResponseDto =
      httpResponse.data;
    addImmersionApplicationResponseDtoSchema.parse(
      addImmersionApplicationResponse,
    );
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
    const updateImmersionApplicationResponse: UpdateImmersionApplicationResponseDto =
      httpResponse.data;
    updateImmersionApplicationResponseDtoSchema.parse(
      updateImmersionApplicationResponse,
    );
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
      updateImmersionApplicationResponseDtoSchema.parse(httpResponse.data);
    return updateImmersionApplicationResponse.id;
  }

  public async updateStatus(
    params: UpdateImmersionApplicationStatusRequestDto,
    jwt: string,
  ): Promise<UpdateImmersionApplicationStatusResponseDto> {
    const httpResponse = await axios.post(
      `/${prefix}/auth/${updateApplicationStatusRoute}/${jwt}`,
      params,
    );

    return updateImmersionApplicationStatusResponseSchema.parse(
      httpResponse.data,
    );
  }

  public async signApplication(
    jwt: string,
  ): Promise<UpdateImmersionApplicationStatusResponseDto> {
    const httpResponse = await axios.post(
      `/${prefix}/auth/${signApplicationRoute}/${jwt}`,
    );

    return updateImmersionApplicationStatusResponseSchema.parse(
      httpResponse.data,
    );
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

  public async listAgencies(position: LatLonDto): Promise<AgencyInListDto[]> {
    const httpResponse = await axios.get(`/${prefix}/${agenciesRoute}`, {
      params: position,
    });
    const response = listAgenciesResponseSchema.parse(httpResponse.data);
    console.log(response);
    return response;
  }
}
