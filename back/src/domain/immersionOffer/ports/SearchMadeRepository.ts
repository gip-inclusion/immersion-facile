import {
  SearchMade,
  SearchMadeEntity,
  SearchMadeId,
} from "../entities/SearchMadeEntity";

export interface SearchMadeRepository {
  insertSearchMade: (searchMadeEntity: SearchMadeEntity) => Promise<void>;
  markPendingSearchesAsProcessedAndRetrieveThem(): Promise<SearchMade[]>;
  retrievePendingSearches(): Promise<SearchMadeEntity[]>;
  markSearchAsProcessed(searchMadeId: SearchMadeId): Promise<void>;
}
