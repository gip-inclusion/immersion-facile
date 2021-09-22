import axios from "axios";
import { DemandeImmersionGateway } from "src/core-logic/ports/DemandeImmersionGateway";
import {
  demandesImmersionRoute,
  siretRoute,
  validateDemandeRoute,
} from "src/shared/routes";
import {
  DemandeImmersionDto,
  addDemandeImmersionResponseDtoSchema,
  AddDemandeImmersionResponseDto,
  demandeImmersionDtoSchema,
  UpdateDemandeImmersionResponseDto,
  updateDemandeImmersionResponseDtoSchema,
  demandeImmersionDtoArraySchema,
  DemandeImmersionId,
} from "src/shared/DemandeImmersionDto";

const prefix = "api";

export class HttpDemandeImmersionGateway implements DemandeImmersionGateway {
  public async add(demandeImmersionDto: DemandeImmersionDto): Promise<string> {
    await demandeImmersionDtoSchema.validate(demandeImmersionDto);
    const httpResponse = await axios.post(
      `/${prefix}/${demandesImmersionRoute}`,
      demandeImmersionDto,
    );
    const addDemandeImmersionResponse: AddDemandeImmersionResponseDto =
      httpResponse.data;
    await addDemandeImmersionResponseDtoSchema.validate(
      addDemandeImmersionResponse,
    );
    return addDemandeImmersionResponse.id;
  }

  public async get(id: string): Promise<DemandeImmersionDto> {
    const response = await axios.get(
      `/${prefix}/${demandesImmersionRoute}/${id}`,
    );
    console.log(response.data);
    return response.data;
  }

  public async getAll(): Promise<Array<DemandeImmersionDto>> {
    const response = await axios.get(`/${prefix}/${demandesImmersionRoute}`);

    return response.data;
  }

  public async update(
    demandeImmersionDto: DemandeImmersionDto,
  ): Promise<string> {
    await demandeImmersionDtoSchema.validate(demandeImmersionDto);
    const httpResponse = await axios.post(
      `/${prefix}/${demandesImmersionRoute}/${demandeImmersionDto.id}`,
      demandeImmersionDto,
    );
    const updateDemandeImmersionResponse: UpdateDemandeImmersionResponseDto =
      httpResponse.data;
    await updateDemandeImmersionResponseDtoSchema.validate(
      updateDemandeImmersionResponse,
    );
    return updateDemandeImmersionResponse.id;
  }

  public async validate(id: DemandeImmersionId): Promise<string> {
    const { data } = await axios.get(
      `/${prefix}/${validateDemandeRoute}/${id}`,
    );
    return data.id;
  }

  public async getSiretInfo(siret: string): Promise<Object> {
    const httpResponse = await axios.get(`/${prefix}/${siretRoute}/${siret}`);
    return httpResponse.data;
  }
}
