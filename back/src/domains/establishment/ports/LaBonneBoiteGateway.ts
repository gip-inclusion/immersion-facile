import { RomeDto, SearchResultDto, SiretDto, WithNafCodes } from "shared";
import { GeoParams } from "../entities/SearchMadeEntity";

export type SearchCompaniesParams = RomeDto & GeoParams & WithNafCodes;

export interface LaBonneBoiteGateway {
  searchCompanies(
    requestParams: SearchCompaniesParams,
  ): Promise<SearchResultDto[]>;
  fetchCompanyBySiret(
    id: SiretDto,
    romeDto: RomeDto,
  ): Promise<SearchResultDto | null>;
}
