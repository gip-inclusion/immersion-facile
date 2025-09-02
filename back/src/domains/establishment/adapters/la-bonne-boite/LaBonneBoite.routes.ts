import {
  type AbsoluteUrl,
  siretSchema,
  type WithSiretDto,
  withAuthorizationHeaders,
} from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod/v4";
import type { LaBonneBoiteApiResultV2Props } from "./LaBonneBoiteCompanyDto";

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

type HttpGetLaBonneBoiteCompanyResponseV2 =
  | {
      items?: LaBonneBoiteApiResultV2Props[];
    }
  | undefined;

export type LaBonneBoiteRoutes = ReturnType<typeof createLbbRoutes>;

const lbbQueryParamsSchema: z.Schema<HttpGetLaBonneBoiteCompanyParamsV2> =
  z.any();

const lbbQueryGetCompanyParamsSchema: z.Schema<WithSiretDto> = z.object({
  siret: siretSchema,
});

// TODO: define LBBv2 schema if more production typing mismatch issues from response body
const lbbResponseSchema: z.Schema<HttpGetLaBonneBoiteCompanyResponseV2> =
  z.any();

export const createLbbRoutes = (peApiUrl: AbsoluteUrl) =>
  defineRoutes({
    getCompanies: defineRoute({
      method: "get",
      url: `${peApiUrl}/partenaire/labonneboite/v2/recherche`,
      queryParamsSchema: lbbQueryParamsSchema,
      ...withAuthorizationHeaders,
      responses: {
        200: lbbResponseSchema,
        401: z.any(),
        404: z.any(),
        500: z.any(),
      },
    }),
    getCompany: defineRoute({
      method: "get",
      url: `${peApiUrl}/partenaire/labonneboite/v2/potentielEmbauche`,
      queryParamsSchema: lbbQueryGetCompanyParamsSchema,
      ...withAuthorizationHeaders,
      responses: {
        200: lbbResponseSchema,
        500: z.any(),
      },
    }),
  });
