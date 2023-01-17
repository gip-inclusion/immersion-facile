import {
  featureToAddressDto,
  GeoJsonFeature,
} from "../apiAdresse/apiAddress.dto";
import { GeoPositionDto } from "../geoPosition/geoPosition.dto";
import { Flavor } from "../typeFlavors";

export type DepartmentCode = Flavor<string, "DepartmentCode">;
export type Postcode = Flavor<string, "Postcode">;
export type LookupAddress = Flavor<string, "LookupAddress">;
export type LookupLocationInput = Flavor<string, "LookupLocation">;

export type LookupSearchResult = {
  label: string;
  position: GeoPositionDto;
};

export type AddressDto = {
  streetNumberAndAddress: string;
  postcode: Postcode; // (ex: "75001")
  departmentCode: DepartmentCode; // numéro de département (ex: "75")
  city: string;
};

export type AddressAndPosition = {
  position: GeoPositionDto;
  address: AddressDto;
};

export const isAddressIdentical = (
  address: AddressDto,
  addressToCompare: AddressDto,
): boolean =>
  address.city === addressToCompare.city &&
  address.postcode === addressToCompare.postcode &&
  address.streetNumberAndAddress === addressToCompare.streetNumberAndAddress &&
  address.departmentCode === addressToCompare.departmentCode;

export const featureToAddressWithPosition = (
  feature: GeoJsonFeature,
): AddressAndPosition | undefined =>
  Array.isArray(feature.geometry.coordinates)
    ? {
        address: featureToAddressDto(feature),
        position: {
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
        },
      }
    : undefined;
