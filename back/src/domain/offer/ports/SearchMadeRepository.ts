import { SearchMadeEntity } from "../entities/SearchMadeEntity";

export interface SearchMadeRepository {
  insertSearchMade: (searchMadeEntity: SearchMadeEntity) => Promise<void>;
}
