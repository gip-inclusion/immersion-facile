import type {
  ExternalSearchResultDto,
  PaginationQueryParams,
  RomeDto,
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
  ): Promise<ExternalSearchResultDto[]>;
  fetchCompanyBySiret(
    id: SiretDto,
    romeDto: RomeDto,
  ): Promise<ExternalSearchResultDto | null>;
}
