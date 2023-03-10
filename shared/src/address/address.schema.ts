import { z } from "zod";
import { geoPositionSchema } from "../geoPosition/geoPosition.schema";
import { zString, zStringCanBeEmpty } from "../zodUtils";
import {
  AddressAndPosition,
  AddressDto,
  DepartmentCode,
  LookupSearchResult,
  WithDepartmentCodeFromPostcodeQuery,
  WithLookupAddress,
  WithLookupLocationInput,
} from "./address.dto";

export const departmentCodeSchema: z.Schema<DepartmentCode> = z.string();

export const addressSchema: z.Schema<AddressDto> = z.object({
  streetNumberAndAddress: zStringCanBeEmpty,
  postcode: zString,
  departmentCode: zString,
  city: zString,
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

export const lookupAddressSchema: z.Schema<WithLookupAddress> = z.object({
  lookup: z.string(),
});

export const lookupLocationInputSchema: z.Schema<WithLookupLocationInput> =
  z.object({
    query: z.string(),
  });

export const departmentCodeFromPostcodeQuerySchema: z.Schema<WithDepartmentCodeFromPostcodeQuery> =
  z.object({
    postcode: z.string(),
  });
