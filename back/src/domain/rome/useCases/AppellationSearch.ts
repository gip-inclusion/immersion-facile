import { AppellationMatchDto } from "../../../shared/romeAndAppellationDtos/romeAndAppellation.dto";
import { zTrimmedString } from "../../../shared/zodUtils";
import { createLogger } from "../../../utils/logger";
import { findMatchRanges } from "../../../utils/textSearch";
import { UseCase } from "../../core/UseCase";
import { RomeRepository } from "../ports/RomeRepository";

const logger = createLogger(__filename);

const MIN_SEARCH_TEXT_LENGTH = 3;
export class AppellationSearch extends UseCase<string, AppellationMatchDto[]> {
  public constructor(readonly romeRepository: RomeRepository) {
    super();
  }

  inputSchema = zTrimmedString;

  public async _execute(searchText: string): Promise<AppellationMatchDto[]> {
    if (searchText.length <= MIN_SEARCH_TEXT_LENGTH) return [];

    const appellations = await this.romeRepository.searchAppellation(
      searchText,
    );

    const appellationsWithMatch: AppellationMatchDto[] = appellations.map(
      (appellation) => ({
        appellation,
        matchRanges: findMatchRanges(searchText, appellation.appellationLabel),
      }),
    );

    logger.info(appellationsWithMatch, " appellationsWithMatch ");
    return appellationsWithMatch;
  }
}
