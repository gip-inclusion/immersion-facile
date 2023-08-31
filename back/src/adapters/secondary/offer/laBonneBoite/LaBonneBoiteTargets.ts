import { AbsoluteUrl } from "shared";
import { withValidateHeadersAuthorization } from "shared";
import { createTarget, createTargets } from "http-client";
import { LaBonneBoiteApiResultProps } from "./LaBonneBoiteCompanyDto";

type HttpGetLaBonneBoiteCompanyParams = {
  commune_id?: string; // INSEE of municipality near which we are looking
  departments?: number[]; // List of departments
  contract?: "dpae" | "alternance";
  latitude?: number; // required if commune_id and deparments are undefined
  longitude?: number; // required if commune_id and deparments are undefined
  distance?: number; // in KM, used only if (latitude, longitude) is given
  rome_codes: string;
  naf_codes?: string; // list of naf codes separeted with a comma, eg : "9499Z,5610C"
  headcount?: "all" | "big" | "small"; // Size of company (big if more than 50 employees). Default to "all"
  page: number; // Page index
  page_size: number; // Nb of results per page
  sort?: "score" | "distance";
};

type HttpGetLaBonneBoiteCompanyResponse = {
  companies: LaBonneBoiteApiResultProps[];
};

export type LaBonneBoiteTargets = ReturnType<typeof createLbbTargets>;

export const createLbbTargets = (peApiUrl: AbsoluteUrl) => {
  const url: AbsoluteUrl = `${peApiUrl}/partenaire/labonneboite/v1/company/`;

  return createTargets({
    getCompany: createTarget({
      method: "GET",
      url,
      validateQueryParams: (params) =>
        params as HttpGetLaBonneBoiteCompanyParams,
      ...withValidateHeadersAuthorization,
      validateResponseBody: (response) =>
        response as HttpGetLaBonneBoiteCompanyResponse,
    }),
  });
};
