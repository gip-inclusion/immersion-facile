import { SearchMade, SearchMadeEntity } from "../entities/SearchMadeEntity";

export interface SearchesMadeRepository {
  insertSearchMade: (searchMadeEntity: SearchMadeEntity) => Promise<void>;
  markPendingSearchesAsProcessedAndRetrieveThem(): Promise<SearchMade[]>;
}
