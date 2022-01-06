import {
  SearchMade,
  SearchMadeEntity,
} from "../../../domain/immersionOffer/entities/SearchMadeEntity";
import { SearchesMadeRepository } from "../../../domain/immersionOffer/ports/SearchesMadeRepository";
import { createLogger } from "../../../utils/logger";

const logger = createLogger(__filename);

export class InMemorySearchesMadeRepository implements SearchesMadeRepository {
  constructor(private _searchesMadeEntities: SearchMadeEntity[] = []) {}

  public async insertSearchMade(searchMadeEntity: SearchMadeEntity) {
    logger.info(searchMadeEntity, "insertSearchMade");
    this._searchesMadeEntities.push(searchMadeEntity);
    return;
  }

  public async markPendingSearchesAsProcessedAndRetrieveThem() {
    logger.info("markPendingSearchesAsProcessedAndRetrieveThem");
    const searchesToReturn = this._searchesMadeEntities;
    this._searchesMadeEntities = [];
    return searchesToReturn.map((searchMadeEntity) => {
      const searchMade: SearchMade = {
        distance_km: searchMadeEntity.distance_km,
        lat: searchMadeEntity.lat,
        lon: searchMadeEntity.lon,
        rome: searchMadeEntity.rome,
        siret: searchMadeEntity.siret,
        nafDivision: searchMadeEntity.nafDivision,
      };
      return searchMade;
    });
  }

  // for test purposes only
  public setSearchesMade(searchesMade: SearchMadeEntity[]) {
    this._searchesMadeEntities = searchesMade;
  }

  public get searchesMade() {
    return this._searchesMadeEntities;
  }
}
