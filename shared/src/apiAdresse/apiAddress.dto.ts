import { AddressDto } from "../address/address.dto";

export type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

export type GeoJsonGeometry = Record<string, unknown>;

export type GeoJsonFeature = {
  type: "Feature";
  geometry: GeoJsonGeometry;
  properties: GeoJsonFeatureApiAddressProperties;
};

export type GeoJsonFeatureApiAddressProperties = {
  label: string;
  score: number;
  housenumber?: string;
  id: string;
  type: string;
  name: string;
  postcode: string;
  citycode: string;
  x: number;
  y: number;
  city: string;
  context: string;
  importance: number;
  street?: string;
};

export const featureToAddressDto = (feature: GeoJsonFeature): AddressDto => ({
  streetNumberAndAddress: feature.properties.name,
  city: feature.properties.city,
  departmentCode: feature.properties.context.split(", ")[0],
  postcode: feature.properties.postcode,
});
