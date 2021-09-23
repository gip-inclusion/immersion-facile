import { CompanyEntity } from "../entities/CompanyEntity";
import { SearchParams } from "./SearchParams";

export interface CompaniesGateway {
  getCompanies: (searchParams: SearchParams) => Promise<CompanyEntity[]>;
}
