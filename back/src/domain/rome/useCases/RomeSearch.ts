import {
  ROME_AND_APPELLATION_MIN_SEARCH_TEXT_LENGTH,
  RomeDto,
  zTrimmedString,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";

export class RomeSearch extends TransactionalUseCase<string, RomeDto[]> {
  protected inputSchema = zTrimmedString;

  public async _execute(
    searchText: string,
    uow: UnitOfWork,
  ): Promise<RomeDto[]> {
    if (searchText.length < ROME_AND_APPELLATION_MIN_SEARCH_TEXT_LENGTH)
      return [];
    return uow.romeRepository.searchRome(searchText);
  }
}
