import type {
  OpenCageGeoSearchKey,
  ZodSchemaWithInputMatchingOutput,
} from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import type { GeoCodingQueryParams } from "./HttpAddressGateway.dto";
import {
  openCageDataFeatureCollectionSchema,
  openCageDataSearchResultCollectionSchema,
} from "./HttpAddressGateway.schemas";

// https://api.gouv.fr/les-api/base-adresse-nationale
// const apiAddressBaseUrl: AbsoluteUrl = `https://api-adresse.data.gouv.fr`;
// const getDepartmentCodeUrl = `${apiAddressBaseUrl}/search` as const;

const geoCodingQueryParamsSchema: ZodSchemaWithInputMatchingOutput<GeoCodingQueryParams> =
  z.object({
    q: z.string(),
    key: z.string(),
    language: z.string().optional(),
    countrycode: z.string().optional(),
    limit: z.string().optional(),
  });

type GeoSearchQueryParams = {
  q: string;
  language?: string;
  countrycode?: string;
  limit?: string;
};

const geoSearchQueryParamsSchema: ZodSchemaWithInputMatchingOutput<GeoSearchQueryParams> =
  z.object({
    q: z.string(),
    language: z.string().optional(),
    countrycode: z.string().optional(),
    limit: z.string().optional(),
  });

type GeoSearchHeaders = {
  "OpenCage-Geosearch-Key": OpenCageGeoSearchKey;
  Origin: string;
};

const geoSearchHeadersSchema: ZodSchemaWithInputMatchingOutput<GeoSearchHeaders> =
  z.object({
    "OpenCage-Geosearch-Key":
      z.string() as ZodSchemaWithInputMatchingOutput<OpenCageGeoSearchKey>,
    Origin: z.string(),
  });

const openCageDataBaseUrl = "https://api.opencagedata.com" as const;

export type AddressesRoutes = typeof addressesExternalRoutes;
export const addressesExternalRoutes = defineRoutes({
  geocoding: defineRoute({
    method: "get",
    url: `${openCageDataBaseUrl}/geocode/v1/geojson`,
    queryParamsSchema: geoCodingQueryParamsSchema,
    responses: { 200: openCageDataFeatureCollectionSchema },
  }),
  geosearch: defineRoute({
    method: "get",
    url: `${openCageDataBaseUrl}/geosearch`,
    queryParamsSchema: geoSearchQueryParamsSchema,
    headersSchema: geoSearchHeadersSchema,
    responses: { 200: openCageDataSearchResultCollectionSchema },
  }),
});
