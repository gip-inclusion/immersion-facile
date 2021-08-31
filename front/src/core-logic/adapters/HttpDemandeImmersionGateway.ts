import axios from "axios";
import { DemandeImmersionGateway } from "src/core-logic/ports/DemandeImmersionGateway";
import { demandesImmersionRoute, siretRoute } from "src/shared/routes";
import {
  DemandeImmersionDto,
  addDemandeImmersionResponseDtoSchema,
  AddDemandeImmersionResponseDto,
  demandeImmersionDtoSchema,
  UpdateDemandeImmersionResponseDto,
  updateDemandeImmersionResponseDtoSchema,
  demandeImmersionDtoArraySchema,
} from "src/shared/DemandeImmersionDto";

const prefix = "api";

export class HttpDemandeImmersionGateway implements DemandeImmersionGateway {
  public async add(demandeImmersionDto: DemandeImmersionDto): Promise<string> {
    await demandeImmersionDtoSchema.validate(demandeImmersionDto);
    const httpResponse = await axios.post(
      `/${prefix}/${demandesImmersionRoute}`,
      demandeImmersionDto
    );
    const addDemandeImmersionResponse: AddDemandeImmersionResponseDto =
      httpResponse.data;
    await addDemandeImmersionResponseDtoSchema.validate(
      addDemandeImmersionResponse
    );
    return addDemandeImmersionResponse.id;
  }

  public async get(id: string): Promise<DemandeImmersionDto> {
    const response = await axios.get(
      `/${prefix}/${demandesImmersionRoute}/${id}`
    );
    console.log(response.data);
    await demandeImmersionDtoSchema.validate(response.data);
    return response.data;
  }

  public async getAll(): Promise<Array<DemandeImmersionDto>> {
    const response = await axios.get(`/${prefix}/${demandesImmersionRoute}`);

    const demandesImmersion = response.data.map(function (data: any) {
      return {
        ...data,
        dateStart: new Date(data.dateStart),
        dateEnd: new Date(data.dateEnd),
      } as DemandeImmersionDto;
    });

    await demandeImmersionDtoArraySchema.validate(demandesImmersion);
    return demandesImmersion;
  }

  public async update(
    id: string,
    demandeImmersionDto: DemandeImmersionDto
  ): Promise<string> {
    await demandeImmersionDtoSchema.validate(demandeImmersionDto);
    const httpResponse = await axios.post(
      `/${prefix}/${demandesImmersionRoute}/${id}`,
      demandeImmersionDto
    );
    const updateDemandeImmersionResponse: UpdateDemandeImmersionResponseDto =
      httpResponse.data;
    await updateDemandeImmersionResponseDtoSchema.validate(
      updateDemandeImmersionResponse
    );
    return updateDemandeImmersionResponse.id;
  }

  public async getSiretInfo(siret: string): Promise<Object> {
    const httpResponse = await axios.get(`/${prefix}/${siretRoute}/${siret}`);
    return httpResponse.data;
  }
}
