import { LaBonneBoiteCompanyVO } from "../valueObjects/LaBonneBoiteCompanyVO";

export type LaBonneBoiteRequestParams = {
  rome: string;
  lat: number;
  lon: number;
};
export interface LaBonneBoiteAPI {
  searchCompanies: (
    requestParams: LaBonneBoiteRequestParams,
  ) => Promise<LaBonneBoiteCompanyVO[]>;
}
