import {
  type AppellationAndRomeDto,
  type AppellationMatchDto,
  ROME_AND_APPELLATION_MIN_SEARCH_TEXT_LENGTH,
  zStringMinLength1,
} from "shared";
import { z } from "zod";
import { createLogger } from "../../../../utils/logger";
import { findMatchRanges } from "../../../../utils/textSearch";
import { TransactionalUseCase } from "../../UseCase";
import type { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";
import type { AppellationsGateway } from "../ports/AppellationsGateway";

const logger = createLogger(__filename);

type AppellationSearchInputParams = {
  searchText: string;
  fetchAppellationsFromNaturalLanguage: boolean;
};

const appellationSearchInputParamsSchema = z.object({
  searchText: zStringMinLength1,
  fetchAppellationsFromNaturalLanguage: z.boolean(),
});

export class AppellationSearch extends TransactionalUseCase<
  AppellationSearchInputParams,
  AppellationMatchDto[]
> {
  protected inputSchema = appellationSearchInputParamsSchema;
  readonly #appellationsGateway: AppellationsGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    appellationsGateway: AppellationsGateway,
  ) {
    super(uowPerformer);
    this.#appellationsGateway = appellationsGateway;
  }

  public async _execute(
    {
      searchText,
      fetchAppellationsFromNaturalLanguage,
    }: AppellationSearchInputParams,
    uow: UnitOfWork,
  ): Promise<AppellationMatchDto[]> {
    if (searchText.length < ROME_AND_APPELLATION_MIN_SEARCH_TEXT_LENGTH)
      return [];

    const diagorienteAppellations = fetchAppellationsFromNaturalLanguage
      ? await this.#naturalLanguageSearchAppellations(uow, searchText)
      : [];

    const appellations =
      diagorienteAppellations.length > 0
        ? diagorienteAppellations
        : await uow.romeRepository.searchAppellation(searchText);

    const appellationsWithMatch: AppellationMatchDto[] = appellations.map(
      (appellation) => ({
        appellation,
        matchRanges: findMatchRanges(searchText, appellation.appellationLabel),
      }),
    );

    logger.info({
      message: `appellationsWithMatch ${appellationsWithMatch.map(
        ({ appellation }) => appellation.appellationCode,
      )}`,
    });
    return appellationsWithMatch;
  }

  async #naturalLanguageSearchAppellations(
    uow: UnitOfWork,
    searchText: string,
  ): Promise<AppellationAndRomeDto[]> {
    const appellations =
      await this.#appellationsGateway.searchAppellations(searchText);

    if (appellations.length === 0) return [];

    return uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodesIfExist(
      appellations.map(({ appellationCode }) => appellationCode),
    );
  }
}
