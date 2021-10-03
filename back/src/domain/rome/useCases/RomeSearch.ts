import {
  ProfessionDto,
  RomeSearchRequestDto,
  RomeSearchResponseDto,
} from "../../../shared/rome";
import { createLogger } from "../../../utils/logger";
import { findMatchRanges } from "../../../utils/textSearch";
import { UseCase } from "../../core/UseCase";
import { RomeGateway } from "../ports/RomeGateway";
import { RomeAppellation, RomeMetier } from "./../ports/RomeGateway";

const logger = createLogger(__filename);
export class RomeSearch
  implements UseCase<RomeSearchRequestDto, RomeSearchResponseDto>
{
  public constructor(readonly romeGateway: RomeGateway) {}

  public async execute(
    searchText: RomeSearchRequestDto,
  ): Promise<RomeSearchResponseDto> {
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
