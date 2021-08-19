import axios from "axios";
import { FormulaireGateway } from "src/core-logic/ports/formulaireGateway";
import { formulairesRoute } from "src/shared/routes";
import type { FormulaireDto, AddFormulaireResponseDto } from "src/shared/FormulaireDto";

const prefix = "api";

export class HttpFormulaireGateway implements FormulaireGateway {
  public async add(formulaireDto: FormulaireDto): Promise<AddFormulaireResponseDto> {
    const response = await axios.post(`/${prefix}/${formulairesRoute}`, formulaireDto);
    console.log(response);
    return response.data;
  }
}
