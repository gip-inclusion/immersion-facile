import { SearchParams } from "../entities/SearchParams";
import { LaBonneBoiteCompanyVO } from "../valueObjects/LaBonneBoiteCompanyVO";

export interface LaBonneBoiteAPI {
  searchCompanies: (
    searchParams: SearchParams,
  ) => Promise<LaBonneBoiteCompanyVO[]>;
}
