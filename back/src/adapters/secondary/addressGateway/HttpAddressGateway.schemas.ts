import { zAnyObj } from "shared";
import { z } from "zod";
import {
  OpenCageDataFeatureCollection,
  OpenCageDataSearchResultCollection,
} from "./HttpAddressGateway.dto";

export const openCageDataSearchResultCollectionSchema: z.Schema<OpenCageDataSearchResultCollection> =
  z.object({
    documentation: z.string(),
    licenses: z.array(z.any()),
    results: z.array(
      z.object({
        bounds: z
          .object({
            northeast: z.object({
              lat: z.string(),
              lng: z.string(),
            }),
            southwest: z.object({
              lat: z.string(),
              lng: z.string(),
            }),
          })
          .optional(),
        formatted: z.string(),
        geometry: z.object({
          lat: z.string(),
          lng: z.string(),
        }),
        name: z.string(),
      }),
    ),
    status: zAnyObj,
    stay_informed: zAnyObj,
    thanks: z.string(),
    timestamp: zAnyObj,
    total_results: z.number(),
  });

const openCageDataFeatureSchema = z.object({
  geometry: z.object({
    coordinates: z.array(z.number()).nonempty(),
    type: z.literal("Point"),
  }),
  properties: z.object({
    components: z
      .object({
        region: z.string(),
        postcode: z.string(),
        city: z.string(),
        county: z.string(),
        county_code: z.string(),
        department: z.string(),
        footway: z.string(),
        house_number: z.string(),
        housenumber: z.string(),
        path: z.string(),
        pedestrian: z.string(),
        place: z.string(),
        road: z.string(),
        state: z.string(),
        state_code: z.string(),
        suburb: z.string(),
        town: z.string(),
        village: z.string(),
      })
      .partial(),
    confidence: z.number(),
  }),
  type: z.literal("Feature"),
});

export const openCageDataFeatureCollectionSchema: z.Schema<OpenCageDataFeatureCollection> =
  z.object({
    features: z.array(openCageDataFeatureSchema),
    type: z.literal("FeatureCollection"),
  });
