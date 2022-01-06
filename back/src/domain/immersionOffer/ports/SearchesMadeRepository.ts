import { SearchMade, SearchMadeEntity } from "../entities/SearchMadeEntity";

export interface SearchesMadeRepository {
  insertSearchMade: (searchMadeEntity: SearchMadeEntity) => Promise<void>;
  markPendingSearchesAsProcessedAndRetrieveThem(): Promise<SearchMade[]>;
  // retrievePendingSearches(): Promise<SearchMadeEntity[]>;
  // markSearchAsProcessed(): Promise<SearchMadeId>;
}
