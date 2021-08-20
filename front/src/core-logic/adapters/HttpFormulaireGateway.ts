import axios from "axios";
import { FormulaireGateway } from "src/core-logic/ports/formulaireGateway";
import { formulairesRoute } from "src/shared/routes";
import { FormulaireDto, addFormulaireResponseDtoSchema, AddFormulaireResponseDto, formulaireDtoSchema } from "src/shared/FormulaireDto";

const prefix = "api";

export class HttpFormulaireGateway implements FormulaireGateway {
  public async add(formulaireDto: FormulaireDto): Promise<AddFormulaireResponseDto> {
    await formulaireDtoSchema.isValid(formulaireDto);
    const response = await axios.post(`/${prefix}/${formulairesRoute}`, formulaireDto);
    const formulaireId = response.data;
    await addFormulaireResponseDtoSchema.isValid(response.data);
    return formulaireId;
  }

  public async get(id: string): Promise<FormulaireDto> {
    const response = await axios.get(`/${prefix}/${formulairesRoute}/${id}`);
    const dto = {
      ...response.data,
      dateStart: new Date(response.data.dateStart),
      dateEnd: new Date(response.data.dateEnd)
    } as FormulaireDto;
    console.log(dto);
    await formulaireDtoSchema.isValid(dto);
    return dto;
  }
}
