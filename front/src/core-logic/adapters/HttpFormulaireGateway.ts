import axios from "axios";
import { FormulaireGateway } from "src/core-logic/ports/formulaireGateway";
import { formulairesRoute } from "src/shared/routes";
import { FormulaireDto, addFormulaireResponseDtoSchema, AddFormulaireResponseDto, formulaireDtoSchema, UpdateFormulaireResponseDto, updateFormulaireResponseDtoSchema } from "src/shared/FormulaireDto";

const prefix = "api";

export class HttpFormulaireGateway implements FormulaireGateway {
  public async add(formulaireDto: FormulaireDto): Promise<string> {
    await formulaireDtoSchema.validate(formulaireDto);
    const httpResponse = await axios.post(`/${prefix}/${formulairesRoute}`, formulaireDto);
    const addFormulaireResponse: AddFormulaireResponseDto = httpResponse.data;
    await addFormulaireResponseDtoSchema.validate(addFormulaireResponse);
    return addFormulaireResponse.id;
  }

  public async get(id: string): Promise<FormulaireDto> {
    const response = await axios.get(`/${prefix}/${formulairesRoute}/${id}`);
    const dto = {
      ...response.data,
      dateStart: new Date(response.data.dateStart),
      dateEnd: new Date(response.data.dateEnd)
    } as FormulaireDto;
    console.log(dto);
    await formulaireDtoSchema.validate(dto);
    return dto;
  }

  public async update(id: string, formulaireDto: FormulaireDto): Promise<string> {
    await formulaireDtoSchema.validate(formulaireDto);
    const httpResponse = await axios.post(`/${prefix}/${formulairesRoute}/${id}`, formulaireDto);
    const updateFormulaireResponse: UpdateFormulaireResponseDto = httpResponse.data;
    await updateFormulaireResponseDtoSchema.validate(updateFormulaireResponse);
    return updateFormulaireResponse.id;
  }
}
