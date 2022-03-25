import { RomeDto } from "../../../shared/romeAndAppellationDtos/romeAndAppellation.dto";
import { zTrimmedString } from "../../../shared/zodUtils";
import { UseCase } from "../../core/UseCase";
import { RomeRepository } from "../ports/RomeRepository";

const MIN_SEARCH_TEXT_LENGTH = 3;

export class RomeSearch extends UseCase<string, RomeDto[]> {
  public constructor(readonly romeRepository: RomeRepository) {
    super();
  }

  inputSchema = zTrimmedString;

  public async _execute(searchText: string): Promise<RomeDto[]> {
    if (searchText.length <= MIN_SEARCH_TEXT_LENGTH) return [];
    return await this.romeRepository.searchRome(searchText);
  }
}
