import { SearchParams } from "./ImmersionOfferRepository";

export type LaBonneBoiteCompany = {
  address: string;
  city: string;
  lat: number;
  lon: number;
  matched_rome_code: string;
  naf: string;
  name: string;
  siret: string;
  stars: number;
};

export interface LaBonneBoiteAPI {
  searchCompanies: (
    searchParams: SearchParams,
  ) => Promise<LaBonneBoiteCompany[]>;
}
