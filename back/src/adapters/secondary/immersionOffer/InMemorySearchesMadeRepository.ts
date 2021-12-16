import { SearchParams } from "../../../domain/immersionOffer/entities/SearchParams";
import { SearchesMadeRepository } from "../../../domain/immersionOffer/ports/SearchesMadeRepository";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class InMemorySearchesMadeRepository implements SearchesMadeRepository {
  constructor(private _searchesMade: SearchParams[] = []) {}

  public async insertSearchMade(searchParams: SearchParams) {
    logger.info(searchParams, "insertSearchMade");
    this._searchesMade.push(searchParams);
    return;
  }

  public async markPendingSearchesAsProcessedAndRetrieveThem(): Promise<
    SearchParams[]
  > {
    logger.info("markPendingSearchesAsProcessedAndRetrieveThem");
    const searchesToReturn = this._searchesMade;
    this._searchesMade = [];
    return searchesToReturn;
  }

  // for test purposes only
  public setSearchesMade(searchesMade: SearchParams[]) {
    this._searchesMade = searchesMade;
  }

  public get searchesMade() {
    return this._searchesMade;
  }
}
