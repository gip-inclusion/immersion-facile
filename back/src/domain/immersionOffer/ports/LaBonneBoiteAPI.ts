import { LaBonneBoiteCompanyVO } from "../valueObjects/LaBonneBoiteCompanyVO";

export type LaBonneBoiteRequestParams = {
  rome?: string;
  distance_km: number;
  lat: number;
  lon: number;
};
export interface LaBonneBoiteAPI {
  searchCompanies: (
    requestParams: LaBonneBoiteRequestParams,
  ) => Promise<LaBonneBoiteCompanyVO[]>;
}
