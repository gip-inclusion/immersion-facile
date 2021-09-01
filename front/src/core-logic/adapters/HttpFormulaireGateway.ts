import { DemandeImmersionId } from "./../../shared/FormulaireDto";
import axios from "axios";
import { FormulaireGateway } from "src/core-logic/ports/formulaireGateway";
import { formulairesRoute, siretRoute } from "src/shared/routes";
import {
  FormulaireDto,
  addFormulaireResponseDtoSchema,
  AddFormulaireResponseDto,
  formulaireDtoSchema,
  UpdateFormulaireResponseDto,
  updateFormulaireResponseDtoSchema,
  formulaireDtoArraySchema,
} from "src/shared/FormulaireDto";

const prefix = "api";

export class HttpFormulaireGateway implements FormulaireGateway {
  public async add(formulaireDto: FormulaireDto): Promise<DemandeImmersionId> {
    await formulaireDtoSchema.validate(formulaireDto);
    const httpResponse = await axios.post(
      `/${prefix}/${formulairesRoute}`,
      formulaireDto
    );
    const addFormulaireResponse: AddFormulaireResponseDto = httpResponse.data;
    await addFormulaireResponseDtoSchema.validate(addFormulaireResponse);
    return addFormulaireResponse.id;
  }

  public async get(id: DemandeImmersionId): Promise<FormulaireDto> {
    const response = await axios.get(`/${prefix}/${formulairesRoute}/${id}`);
    console.log(response.data);
    await formulaireDtoSchema.validate(response.data);
    return response.data;
  }

  public async getAll(): Promise<Array<FormulaireDto>> {
    const response = await axios.get(`/${prefix}/${formulairesRoute}`);

    const formulaires = response.data.map(function (data: any) {
      return {
        ...data,
        dateStart: new Date(data.dateStart),
        dateEnd: new Date(data.dateEnd),
      } as FormulaireDto;
    });

    await formulaireDtoArraySchema.validate(formulaires);
    return formulaires;
  }

  public async update(
    formulaireDto: FormulaireDto
  ): Promise<DemandeImmersionId> {
    await formulaireDtoSchema.validate(formulaireDto);
    const httpResponse = await axios.post(
      `/${prefix}/${formulairesRoute}/${formulaireDto.id}`,
      formulaireDto
    );
    const updateFormulaireResponse: UpdateFormulaireResponseDto =
      httpResponse.data;
    await updateFormulaireResponseDtoSchema.validate(updateFormulaireResponse);
    return updateFormulaireResponse.id;
  }

  public async getSiretInfo(siret: string): Promise<Object> {
    const httpResponse = await axios.get(`/${prefix}/${siretRoute}/${siret}`);
    return httpResponse.data;
  }
}
