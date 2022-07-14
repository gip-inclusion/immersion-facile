import { RomeDto } from "shared/src/romeAndAppellationDtos/romeAndAppellation.dto";
import { zTrimmedString } from "shared/src/zodUtils";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

const MIN_SEARCH_TEXT_LENGTH = 3;

export class RomeSearch extends TransactionalUseCase<string, RomeDto[]> {
  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  inputSchema = zTrimmedString;

  public async _execute(
    searchText: string,
    uow: UnitOfWork,
  ): Promise<RomeDto[]> {
    if (searchText.length < MIN_SEARCH_TEXT_LENGTH) return [];
    return uow.romeRepository.searchRome(searchText);
  }
}
