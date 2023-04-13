import { z } from "zod";

import { OpenCageGeoSearchKey } from "shared";

import { createTarget, createTargets } from "http-client";

import { validateAndParseZodSchema } from "../../primary/helpers/httpErrors";

import { GeoCodingQueryParams } from "./HttpAddressGateway.dto";
import {
  openCageDataFeatureCollectionSchema,
  openCageDataSearchResultCollectionSchema,
} from "./HttpAddressGateway.schemas";

// https://api.gouv.fr/les-api/base-adresse-nationale
// const apiAddressBaseUrl: AbsoluteUrl = `https://api-adresse.data.gouv.fr`;
// const getDepartmentCodeUrl = `${apiAddressBaseUrl}/search` as const;

const geoCodingQueryParamsSchema: z.Schema<GeoCodingQueryParams> = z.object({
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

const geoSearchQueryParamsSchema: z.Schema<GeoSearchQueryParams> = z.object({
  q: z.string(),
  language: z.string().optional(),
  countrycode: z.string().optional(),
  limit: z.string().optional(),
});

type GeoSearchHeaders = {
  "OpenCage-Geosearch-Key": OpenCageGeoSearchKey;
  Origin: string;
};

const geoSearchHeadersSchema: z.Schema<GeoSearchHeaders> = z.object({
  "OpenCage-Geosearch-Key": z.string() as z.Schema<OpenCageGeoSearchKey>,
  Origin: z.string(),
});

const openCageDataBaseUrl = "https://api.opencagedata.com" as const;

export type AddressesTargets = typeof addressesExternalTargets;
export const addressesExternalTargets = createTargets({
  geocoding: createTarget({
    method: "GET",
    url: `${openCageDataBaseUrl}/geocode/v1/geojson`,
    validateQueryParams: geoCodingQueryParamsSchema.parse,
    validateResponseBody: (responseBody) =>
      validateAndParseZodSchema(
        openCageDataFeatureCollectionSchema,
        responseBody,
      ),
  }),
  geosearch: createTarget({
    method: "GET",
    url: `${openCageDataBaseUrl}/geosearch`,
    validateQueryParams: geoSearchQueryParamsSchema.parse,
    validateHeaders: geoSearchHeadersSchema.parse,
    validateResponseBody: (responseBody) =>
      validateAndParseZodSchema(
        openCageDataSearchResultCollectionSchema,
        responseBody,
      ),
  }),
});
