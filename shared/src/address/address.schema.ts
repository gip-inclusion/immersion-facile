import { z } from "zod";
import { geoPositionSchema } from "../geoPosition/geoPosition.schema";
import { zStringCanBeEmpty } from "../zodUtils";
import {
  LookupAddress,
  LookupLocationInput,
  LookupSearchResult,
} from "./address.dto";

import { AddressAndPosition, AddressDto, DepartmentCode } from "./address.dto";

export const departmentCodeSchema: z.Schema<DepartmentCode> = z.string();

export const addressSchema: z.Schema<AddressDto> = z.object({
  streetNumberAndAddress: zStringCanBeEmpty,
  postcode: zStringCanBeEmpty,
  departmentCode: zStringCanBeEmpty,
  city: zStringCanBeEmpty,
});

export const lookupSearchResultSchema: z.Schema<LookupSearchResult> = z.object({
  label: z.string(),
  position: geoPositionSchema,
});

export const addressAndPositionSchema: z.Schema<AddressAndPosition> = z.object({
  address: addressSchema,
  position: geoPositionSchema,
});

export const addressAndPositionListSchema: z.ZodSchema<AddressAndPosition[]> =
  z.array(addressAndPositionSchema);

export const lookupSearchResultsSchema: z.ZodSchema<LookupSearchResult[]> =
  z.array(lookupSearchResultSchema);

export const lookupAddressSchema: z.Schema<LookupAddress> = z.string();

export const lookupLocationInputSchema: z.Schema<LookupLocationInput> =
  z.string();
