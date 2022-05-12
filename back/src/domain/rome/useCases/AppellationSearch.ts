import { AppellationMatchDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import { zTrimmedString } from "shared/src/zodUtils";
import { createLogger } from "../../../utils/logger";
import { findMatchRanges } from "../../../utils/textSearch";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

const logger = createLogger(__filename);

const MIN_SEARCH_TEXT_LENGTH = 2;

export class AppellationSearch extends TransactionalUseCase<
  string,
  AppellationMatchDto[]
> {
  public constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = zTrimmedString;

  public async _execute(
    searchText: string,
    uow: UnitOfWork,
  ): Promise<AppellationMatchDto[]> {
    if (searchText.length <= MIN_SEARCH_TEXT_LENGTH) return [];

    const appellations = await uow.romeRepo.searchAppellation(searchText);

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
