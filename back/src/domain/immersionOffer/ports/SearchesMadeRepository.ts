import { SearchParams } from "../entities/SearchParams";

export interface SearchesMadeRepository {
  insertSearchMade: (searchParams: SearchParams) => Promise<void>;
  markPendingSearchesAsProcessedAndRetrieveThem(): Promise<SearchParams[]>;
}
