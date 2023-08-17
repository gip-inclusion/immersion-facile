import {
  AppellationMatchDto,
  ROME_AND_APPELLATION_MIN_SEARCH_TEXT_LENGTH,
  zTrimmedString,
} from "shared";
import { createLogger } from "../../../utils/logger";
import { findMatchRanges } from "../../../utils/textSearch";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

const logger = createLogger(__filename);

export class AppellationSearch extends TransactionalUseCase<
  string,
  AppellationMatchDto[]
> {
  protected inputSchema = zTrimmedString;

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  public async _execute(
    searchText: string,
    uow: UnitOfWork,
  ): Promise<AppellationMatchDto[]> {
    if (searchText.length < ROME_AND_APPELLATION_MIN_SEARCH_TEXT_LENGTH)
      return [];

    const appellations = await uow.romeRepository.searchAppellation(searchText);

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
