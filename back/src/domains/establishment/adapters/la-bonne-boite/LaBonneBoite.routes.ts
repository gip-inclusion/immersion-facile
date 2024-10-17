import { AbsoluteUrl, withAuthorizationHeaders } from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { LaBonneBoiteApiResultV2Props } from "./LaBonneBoiteCompanyDto";

type _HttpGetLaBonneBoiteCompanyParams = {
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

type HttpGetLaBonneBoiteCompanyParamsV2 = {
  bbox?: string;
  city?: string[];
  citycode?: string[];
  department?: string;
  department_number?: number[];
  distance?: number;
  domain?: string[];
  granddomain?: string[];
  job?: string;
  latitude?: number;
  location?: string;
  longitude?: number;
  naf?: string[];
  page?: number;
  page_size?: number;
  postcode?: string[];
  region?: string[];
  region_number?: number[];
  rome?: string[];
  sort_by?: string; // Element de l'index elastic search sur lequel effectuer le tri. Les valeurs possible sont romes.hiring_potential, hiring_potential
  sort_direction?: "asc" | "desc"; // Sens du tri
};

// type _HttpGetLaBonneBoiteCompanyResponseV1 = {
//   companies: LaBonneBoiteApiResultV1Props[];
// };

// example response item :

// {
//   rome: 'M1203',
//   id: 17687,
//   siret: '21860066600018',
//   email: 'yes',
//   company_name: 'COMMUNE DE CHATELLERAULT',
//   office_name: 'MAIRIE CHATELLERAULT',
//   headcount_min: 250,
//   headcount_max: 499,
//   naf: '8411Z',
//   naf_label: 'Administration publique générale',
//   location: [Object],
//   city: 'Châtellerault',
//   citycode: '86066',
//   postcode: '86100',
//   department: 'Vienne',
//   region: 'Nouvelle-Aquitaine',
//   department_number: '86',
//   hiring_potential: 59.5344812,
//   is_high_potential: false
// }

type HttpGetLaBonneBoiteCompanyResponseV2 = {
  items: LaBonneBoiteApiResultV2Props[];
};

export type LaBonneBoiteRoutes = ReturnType<typeof createLbbRoutes>;

const lbbQueryParamsSchema: z.Schema<HttpGetLaBonneBoiteCompanyParamsV2> =
  z.any();
const lbbResponseSchema: z.Schema<HttpGetLaBonneBoiteCompanyResponseV2> =
  z.any();

export const createLbbRoutes = (peApiUrl: AbsoluteUrl) =>
  defineRoutes({
    getCompany: defineRoute({
      method: "get",
      url: `${peApiUrl}/partenaire/labonneboite/v2/recherche`,
      queryParamsSchema: lbbQueryParamsSchema,
      ...withAuthorizationHeaders,
      responses: {
        200: lbbResponseSchema,
      },
    }),
  });
