import type {
  ExternalOfferDto,
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
  ): Promise<ExternalOfferDto[]>;
  fetchCompanyBySiret(
    id: SiretDto,
    romeDto: RomeDto,
  ): Promise<ExternalOfferDto | null>;
}
