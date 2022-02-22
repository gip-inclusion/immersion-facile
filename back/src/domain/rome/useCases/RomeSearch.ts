import { ProfessionDto, RomeSearchMatchDto } from "../../../shared/rome";
import { zTrimmedString } from "../../../shared/zodUtils";
import { createLogger } from "../../../utils/logger";
import { findMatchRanges } from "../../../utils/textSearch";
import { UseCase } from "../../core/UseCase";
import { RomeAppellation, RomeGateway, RomeMetier } from "../ports/RomeGateway";

const logger = createLogger(__filename);

const MIN_SEARCH_TEXT_LENGTH = 3;
export class RomeSearch extends UseCase<string, RomeSearchMatchDto[]> {
  public constructor(readonly romeGateway: RomeGateway) {
    super();
  }

  inputSchema = zTrimmedString;

  public async _execute(searchText: string): Promise<RomeSearchMatchDto[]> {
    if (searchText.length <= MIN_SEARCH_TEXT_LENGTH) return [];

    const [appellations, metiers] = await Promise.all([
      this.romeGateway.searchAppellation(searchText),
      this.romeGateway.searchMetier(searchText),
    ]);

    const result = [
      ...appellations.map(romeAppellationToProfession),
      ...metiers.map(romeMetierToProfession),
    ].map((profession) => ({
      profession,
      matchRanges: findMatchRanges(searchText, profession.description),
    }));
    logger.info(result, " result ");
    return result;
  }
}

const romeAppellationToProfession = (
  appellation: RomeAppellation,
): ProfessionDto => ({
  romeCodeAppellation: appellation.codeAppellation.toString(),
  description: appellation.libelle,
  romeCodeMetier: appellation.codeMetier,
});

const romeMetierToProfession = (metier: RomeMetier): ProfessionDto => ({
  romeCodeMetier: metier.codeMetier,
  description: metier.libelle,
});
