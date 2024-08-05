import {
  ROME_AND_APPELLATION_MIN_SEARCH_TEXT_LENGTH,
  RomeDto,
  zStringMinLength1,
} from "shared";
import { TransactionalUseCase } from "../../UseCase";
import { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";

export class RomeSearch extends TransactionalUseCase<string, RomeDto[]> {
  protected inputSchema = zStringMinLength1;

  public async _execute(
    searchText: string,
    uow: UnitOfWork,
  ): Promise<RomeDto[]> {
    if (searchText.length < ROME_AND_APPELLATION_MIN_SEARCH_TEXT_LENGTH)
      return [];
    return uow.romeRepository.searchRome(searchText);
  }
}
