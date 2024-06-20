import { SearchResultDto } from "shared";

export type LaBonneBoiteRequestParams = {
  rome: string;
  lat: number;
  lon: number;
  distanceKm: number;
};
export interface LaBonneBoiteGateway {
  searchCompanies(
    requestParams: LaBonneBoiteRequestParams,
  ): Promise<SearchResultDto[]>;
}
