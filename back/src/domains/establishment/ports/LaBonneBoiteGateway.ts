import { SearchResultDto } from "shared";

export type LaBonneBoiteRequestParams = {
  rome: string;
  romeLabel: string; // ugly fix for now
  lat: number;
  lon: number;
  distanceKm: number;
};
export interface LaBonneBoiteGateway {
  searchCompanies(
    requestParams: LaBonneBoiteRequestParams,
  ): Promise<SearchResultDto[]>;
}
