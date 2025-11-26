import type {
  PaginationQueryParams,
  RomeDto,
  SearchResultDto,
  SiretDto,
  WithNafCodes,
} from "shared";
import type { GeoParams } from "../entities/SearchMadeEntity";

export type SearchCompaniesParams = RomeDto &
  GeoParams &
  WithNafCodes &
  PaginationQueryParams;

export interface LaBonneBoiteGateway {
  searchCompanies(
    requestParams: SearchCompaniesParams,
  ): Promise<SearchResultDto[]>;
  fetchCompanyBySiret(
    id: SiretDto,
    romeDto: RomeDto,
  ): Promise<SearchResultDto | null>;
}
