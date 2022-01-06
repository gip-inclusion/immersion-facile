import { SearchMade } from "../entities/SearchMadeEntity";
import { LaBonneBoiteCompanyVO } from "../valueObjects/LaBonneBoiteCompanyVO";

export interface LaBonneBoiteAPI {
  searchCompanies: (searchMade: SearchMade) => Promise<LaBonneBoiteCompanyVO[]>;
}
