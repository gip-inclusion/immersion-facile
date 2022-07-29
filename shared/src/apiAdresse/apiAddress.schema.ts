import { z } from "zod";
import {
  GeoJsonFeature,
  GeoJsonFeatureApiAddressProperties,
  GeoJsonFeatureCollection,
  GeoJsonGeometry,
} from "./apiAddress.dto";

export const featuresSchemaResponse: z.Schema<{ features: unknown[] }> =
  z.object({
    features: z.array(z.unknown()),
  });

const geoJsonGeometrySchema: z.Schema<GeoJsonGeometry> = z.record(
  z.string(),
  z.unknown(),
);

const geoJsonFeatureProperties: z.Schema<GeoJsonFeatureApiAddressProperties> =
  z.object({
    label: z.string(),
    score: z.number(),
    housenumber: z.string(),
    id: z.string(),
    type: z.string(),
    name: z.string(),
    postcode: z.string(),
    citycode: z.string(),
    x: z.number(),
    y: z.number(),
    city: z.string(),
    context: z.string(),
    importance: z.number(),
    street: z.string(),
  });
export const geoJsonFeatureSchema: z.Schema<GeoJsonFeature> = z.object({
  type: z.literal("Feature"),
  geometry: geoJsonGeometrySchema,
  properties: geoJsonFeatureProperties,
});

export const geoJsonFeatureCollectionSchema: z.Schema<GeoJsonFeatureCollection> =
  z.object({
    type: z.literal("FeatureCollection"),
    features: z.array(geoJsonFeatureSchema),
  });

export const toFeatureCollection = (data: unknown): GeoJsonFeatureCollection =>
  geoJsonFeatureCollectionSchema.parse(data);
