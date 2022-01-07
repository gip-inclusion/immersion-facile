import { SearchMadeEntity, SearchMadeId } from "../entities/SearchMadeEntity";

export interface SearchMadeRepository {
  insertSearchMade: (searchMadeEntity: SearchMadeEntity) => Promise<void>;
  retrievePendingSearches(): Promise<SearchMadeEntity[]>;
  markSearchAsProcessed(searchMadeId: SearchMadeId): Promise<void>;
}
