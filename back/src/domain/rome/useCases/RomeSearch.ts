import {
  ProfessionDto,
  RomeSearchRequestDto,
  romeSearchRequestSchema,
  RomeSearchResponseDto,
} from "../../../shared/rome";
import { createLogger } from "../../../utils/logger";
import { findMatchRanges } from "../../../utils/textSearch";
import { UseCase } from "../../core/UseCase";
import { RomeGateway } from "../ports/RomeGateway";
import { RomeAppellation, RomeMetier } from "../ports/RomeGateway";

const logger = createLogger(__filename);

const MIN_SEARCH_TEXT_LENGTH = 3;
export class RomeSearch extends UseCase<
  RomeSearchRequestDto,
  RomeSearchResponseDto
> {
  public constructor(readonly romeGateway: RomeGateway) {
    super();
  }

  inputSchema = romeSearchRequestSchema;

  public async _execute(
    searchText: RomeSearchRequestDto,
  ): Promise<RomeSearchResponseDto> {
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
  romeCodeAppellation: appellation.codeAppellation,
  description: appellation.libelle,
});

const romeMetierToProfession = (metier: RomeMetier): ProfessionDto => ({
  romeCodeMetier: metier.codeMetier,
  description: metier.libelle,
});
