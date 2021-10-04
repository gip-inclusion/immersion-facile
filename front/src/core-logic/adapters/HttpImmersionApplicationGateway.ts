import axios from "axios";
import { CompanyInfoFromSiretApi } from "src/core-logic/ports/CompanyInfoFromSiretApi";
import { ImmersionApplicationGateway } from "src/core-logic/ports/ImmersionApplicationGateway";
import {
  immersionApplicationsRoute,
  siretRoute,
  validateDemandeRoute,
} from "src/shared/routes";
import {
  ImmersionApplicationDto,
  addImmersionApplicationResponseDtoSchema,
  AddImmersionApplicationResponseDto,
  immersionApplicationSchema,
  UpdateImmersionApplicationResponseDto,
  updateImmersionApplicationResponseDtoSchema,
  immersionApplicationArraySchema,
  ImmersionApplicationId,
} from "src/shared/ImmersionApplicationDto";

const prefix = "api";

export class HttpImmersionApplicationGateway
  implements ImmersionApplicationGateway
{
  public async add(
    demandeImmersionDto: ImmersionApplicationDto,
  ): Promise<string> {
    await immersionApplicationSchema.validate(demandeImmersionDto);
    const httpResponse = await axios.post(
      `/${prefix}/${immersionApplicationsRoute}`,
      demandeImmersionDto,
    );
    const addDemandeImmersionResponse: AddImmersionApplicationResponseDto =
      httpResponse.data;
    await addImmersionApplicationResponseDtoSchema.validate(
      addDemandeImmersionResponse,
    );
    return addDemandeImmersionResponse.id;
  }

  public async get(id: string): Promise<ImmersionApplicationDto> {
    const response = await axios.get(
      `/${prefix}/${immersionApplicationsRoute}/${id}`,
    );
    console.log(response.data);
    return response.data;
  }

  public async getAll(): Promise<Array<ImmersionApplicationDto>> {
    const response = await axios.get(
      `/${prefix}/${immersionApplicationsRoute}`,
    );

    return response.data;
  }

  public async update(
    demandeImmersionDto: ImmersionApplicationDto,
  ): Promise<string> {
    await immersionApplicationSchema.validate(demandeImmersionDto);
    const httpResponse = await axios.post(
      `/${prefix}/${immersionApplicationsRoute}/${demandeImmersionDto.id}`,
      demandeImmersionDto,
    );
    const updateDemandeImmersionResponse: UpdateImmersionApplicationResponseDto =
      httpResponse.data;
    await updateImmersionApplicationResponseDtoSchema.validate(
      updateDemandeImmersionResponse,
    );
    return updateDemandeImmersionResponse.id;
  }

  public async validate(id: ImmersionApplicationId): Promise<string> {
    const { data } = await axios.get(
      `/${prefix}/${validateDemandeRoute}/${id}`,
    );
    return data.id;
  }

  public async getSiretInfo(siret: string): Promise<CompanyInfoFromSiretApi> {
    const httpResponse = await axios.get(`/${prefix}/${siretRoute}/${siret}`);
    return httpResponse.data;
  }
}
