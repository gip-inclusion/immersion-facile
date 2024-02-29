import { createLogger } from "../../../utils/logger";
import { SearchMadeEntity, SearchMadeId } from "../entities/SearchMadeEntity";
import { SearchMadeRepository } from "../ports/SearchMadeRepository";

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
