import axios from "axios";
import { FormulaireGateway } from "src/core-logic/ports/formulaireGateway";
import { formulairesRoute } from "src/shared/routes";
import type { FormulaireDto } from "src/shared/FormulaireDto";

const prefix = "api";

export class HttpFormulaireGateway implements FormulaireGateway {
  public async add(formulaireDto: FormulaireDto): Promise<void> {
    await axios.post(`/${prefix}/${formulairesRoute}`, formulaireDto);
  }
}
