import {
  SearchMadeEntity,
  SearchMadeId,
} from "../../../domains/establishment/entities/SearchMadeEntity";
import { SearchMadeRepository } from "../../../domains/establishment/ports/SearchMadeRepository";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class InMemorySearchMadeRepository implements SearchMadeRepository {
  constructor(
    private _searchesMadeEntities: SearchMadeEntity[] = [],
    private _processedSearchesMadeIds: Set<SearchMadeId> = new Set(),
  ) {}

  public async insertSearchMade(searchMadeEntity: SearchMadeEntity) {
    logger.info(searchMadeEntity, "insertSearchMade");
    this._searchesMadeEntities.push(searchMadeEntity);
    if (!searchMadeEntity.needsToBeSearched)
      this._processedSearchesMadeIds.add(searchMadeEntity.id);
    return;
  }

  public get searchesMade() {
    return this._searchesMadeEntities;
  }
}
